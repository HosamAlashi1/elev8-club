import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { FirebaseService } from '../../../../services/firebase.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';
import { Lead, SalesStatus, SalesPackage, SALES_STATUS_LABELS, SALES_PACKAGE_LABELS, CallLog, CALL_TYPE_LABELS, CALL_STATUS_LABELS, CallType, Affiliate, SalesMember } from '../../../../../core/models';

interface LeadWithMeta extends Lead {
  affiliateName?: string;
  affiliateCode?: string;
  salesMemberName?: string;
}

@Component({
  selector: 'app-lead-detail',
  templateUrl: './lead-detail.component.html',
  styleUrls: ['./lead-detail.component.css']
})
export class LeadDetailComponent implements OnInit, OnDestroy {
  lead: LeadWithMeta | null = null;
  isLoading = true;
  isAdmin = false;
  isSales = false;

  callLogs: CallLog[] = [];
  isLoadingLogs = false;
  isSavingCall = false;
  callForm!: FormGroup;
  showCallForm = false;
  showPackageSelector = false;
  selectedSalesPackage: SalesPackage | null = null;
  isSavingStatus = false;

  private destroy$ = new Subject<void>();

  readonly salesSteps: { key: SalesStatus; label: string; icon: string }[] = [
    { key: 'new',          label: 'New',          icon: 'fe-user' },
    { key: 'pre_meeting',  label: 'Pre-Meeting',  icon: 'fe-calendar' },
    { key: 'post_meeting', label: 'Post-Meeting', icon: 'fe-check-square' },
    { key: 'follow_up',    label: 'Follow-up',    icon: 'fe-phone' },
    { key: 'closed',       label: 'Closed',       icon: 'fe-award' },
  ];

  readonly salesPackages: { value: SalesPackage; label: string }[] = [
    { value: 'starter', label: SALES_PACKAGE_LABELS.starter },
    { value: 'pro', label: SALES_PACKAGE_LABELS.pro },
    { value: 'ai', label: SALES_PACKAGE_LABELS.ai },
  ];

  readonly callTypeOptions: { value: CallType; label: string }[] = [
    { value: 'invitation',               label: 'Invitation Call' },
    { value: 'presentation_confirmation', label: 'Presentation Confirmation' },
    { value: 'presentation_followup',    label: 'Presentation Follow-up' },
    { value: 'offer',                    label: 'Offer Call' },
    { value: 'followup',                 label: 'Follow-up Call' },
  ];

  readonly callStatusOptions = [
    { value: 'answered',  label: 'Answered',  icon: 'fe-check-circle', cls: 'cs-answered' },
    { value: 'no_answer', label: 'No Answer', icon: 'fe-phone-missed',  cls: 'cs-no-answer' },
    { value: 'busy',      label: 'Busy',      icon: 'fe-phone-off',     cls: 'cs-busy' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private publicService: PublicService,
    private toastr: ToastrsService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.publicService.isAdmin();
    this.isSales = this.publicService.isSales();
    this.buildCallForm();

    const key = this.route.snapshot.paramMap.get('key');
    if (!key) { this.router.navigate(['/dashboard/leads']); return; }

    this.loadLead(key);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLead(key: string): void {
    this.isLoading = true;
    this.firebaseService.getLeadByKey(key).pipe(takeUntil(this.destroy$)).subscribe({
      next: (lead) => {
        if (!lead) { this.router.navigate(['/dashboard/leads']); return; }
        this.lead = lead;
        this.enrichLead(lead);
        this.isLoading = false;
        this.loadCallLogs(key);
      },
      error: () => { this.isLoading = false; this.router.navigate(['/dashboard/leads']); }
    });
  }

  private enrichLead(lead: Lead): void {
    if (lead.affiliateKey) {
      this.firebaseService.getAffiliateByKey(lead.affiliateKey).pipe(takeUntil(this.destroy$)).subscribe(aff => {
        if (this.lead) {
          this.lead.affiliateName = aff?.name || '';
          this.lead.affiliateCode = aff?.code || '';
        }
      });
    }
    if (lead.salesMemberKey) {
      this.firebaseService.getSalesMemberByKey(lead.salesMemberKey).pipe(takeUntil(this.destroy$)).subscribe(member => {
        if (this.lead) this.lead.salesMemberName = member?.name || '';
      });
    }
  }

  private loadCallLogs(key: string): void {
    this.isLoadingLogs = true;
    this.firebaseService.getCallLogs(key).pipe(takeUntil(this.destroy$)).subscribe(logs => {
      this.callLogs = [...logs].sort((a, b) =>
        new Date(b.callDate + 'T' + b.callTime).getTime() - new Date(a.callDate + 'T' + a.callTime).getTime()
      );
      this.isLoadingLogs = false;
    });
  }

  private buildCallForm(): void {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    this.callForm = this.fb.group({
      callType: ['invitation', Validators.required],
      callDate: [today, Validators.required],
      callTime: [now, Validators.required],
      status: ['answered', Validators.required],
      notes: ['']
    });
  }

  // ─── Status ───────────────────────────────────────
  get currentSalesStatus(): SalesStatus {
    return (this.lead?.sales_status as SalesStatus) || 'new';
  }

  getStepState(stepKey: SalesStatus): 'done' | 'active' | 'pending' {
    const order: SalesStatus[] = ['new', 'pre_meeting', 'post_meeting', 'follow_up', 'closed'];
    const curr = order.indexOf(this.currentSalesStatus);
    const idx  = order.indexOf(stepKey);
    if (idx < curr)  return 'done';
    if (idx === curr) return 'active';
    return 'pending';
  }

  changeStatus(status: SalesStatus): void {
    if (!this.lead?.key || this.isSavingStatus) return;
    if (status === 'closed') {
      this.selectedSalesPackage = this.lead.sales_package || null;
      this.showPackageSelector = true;
      return;
    }
    this.persistStatus(status);
  }

  saveClosedStatus(): void {
    if (!this.selectedSalesPackage) return;
    this.persistStatus('closed', this.selectedSalesPackage);
  }

  cancelPackageSelection(): void {
    this.showPackageSelector = false;
    this.selectedSalesPackage = null;
  }

  private persistStatus(status: SalesStatus, salesPackage?: SalesPackage): void {
    if (!this.lead?.key) return;
    this.isSavingStatus = true;
    this.firebaseService.updateLeadSalesStatus(this.lead.key, status, salesPackage).then(() => {
      this.lead!.sales_status = status;
      this.lead!.sales_package = status === 'closed' ? salesPackage : undefined;
      this.showPackageSelector = false;
      this.selectedSalesPackage = null;
      const packageLabel = salesPackage ? ` - ${SALES_PACKAGE_LABELS[salesPackage]}` : '';
      this.toastr.showSuccess(`${SALES_STATUS_LABELS[status]}${packageLabel}`);
    }).catch(() => this.toastr.showError('Failed to update status'))
      .finally(() => this.isSavingStatus = false);
  }

  markNotInterested(): void {
    if (!this.lead?.key || !confirm('Mark this lead as Not Interested?')) return;
    this.firebaseService.updateLeadSalesStatus(this.lead.key, 'not_interested').then(() => {
      this.lead!.sales_status = 'not_interested';
      this.lead!.sales_package = undefined;
      this.toastr.showSuccess('Marked as Not Interested');
    }).catch(() => this.toastr.showError('Failed'));
  }

  resetStatus(): void {
    if (!this.lead?.key) return;
    this.firebaseService.updateLeadSalesStatus(this.lead.key, 'new').then(() => {
      this.lead!.sales_status = 'new';
      this.lead!.sales_package = undefined;
      this.toastr.showSuccess('Status reset to New');
    });
  }

  // ─── Call Log ────────────────────────────────────
  saveCall(): void {
    if (this.callForm.invalid || !this.lead?.key || this.isSavingCall) return;
    this.isSavingCall = true;
    const uid = this.publicService.getCurrentUserUid() || '';
    this.firebaseService.addCallLog(this.lead.key, {
      ...this.callForm.value,
      leadKey: this.lead.key,
      versionKey: this.lead.versionKey,
      type: 'sales' as const,
      createdBy: uid
    }).then(() => {
      this.isSavingCall = false;
      this.showCallForm = false;
      this.buildCallForm();
      this.toastr.showSuccess('Call logged');
    }).catch(() => {
      this.isSavingCall = false;
      this.toastr.showError('Failed to save call');
    });
  }

  // ─── Helpers ─────────────────────────────────────
  getCallTypeLabel(t: string): string { return CALL_TYPE_LABELS[t as CallType] || t; }
  getCallStatusLabel(s: string): string { return CALL_STATUS_LABELS[s as keyof typeof CALL_STATUS_LABELS] || s; }

  getCallStatusConfig(status: string) {
    return this.callStatusOptions.find(o => o.value === status) || this.callStatusOptions[0];
  }

  getInitial(): string {
    return this.lead?.fullName ? this.lead.fullName.trim().charAt(0).toUpperCase() : '?';
  }

  getAnswers(): { label: string; value: string }[] {
    const a = this.lead?.answers;
    if (!a) return [];
    return [
      { label: 'كم عمرك؟', value: a.age || '' },
      { label: 'وضعك الحالي شغل؟', value: a.workStatus || '' },
      { label: 'دخلك الشهري؟', value: a.monthlyIncome || '' },
      { label: 'جربت التداول؟', value: a.tradingExperience || '' },
      { label: 'أكبر مشكلة مالية؟', value: a.financialProblem || '' },
      { label: 'كم تقدر تخصص؟', value: a.investBudget || '' },
      { label: 'هدفك الأساسي؟', value: a.systemGoal || '' },
    ].filter(x => !!x.value?.trim());
  }

  goBack(): void { this.router.navigate(['/dashboard/leads']); }
}
