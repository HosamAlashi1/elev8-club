import { Component, Input, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as AOS from 'aos';
import { Lead, SalesStatus, SalesPackage, SALES_STATUS_LABELS, SALES_PACKAGE_LABELS, CallLog, CALL_TYPE_LABELS, CALL_STATUS_LABELS, CallType, LeadSource, LEAD_SOURCE_LABELS, LEAD_QUALIFICATION_LABELS } from '../../../../../core/models';
import { FirebaseService } from '../../../../services/firebase.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';

interface LeadWithAffiliate extends Lead {
  affiliateName?: string;
  affiliateCode?: string;
  assigned_sales?: {
    sales_id: string;
    whatsapp_number: string;
    group_id?: string;
    group_name?: string;
    group_link?: string;
    group_order?: number;
    assigned_at: number;
    assigned_via: string;
    versionKey?: string;
  };
  salesName?: string;
}

interface AnswerDisplay {
  label: string;
  value: string;
}

@Component({
  selector: 'app-view-lead',
  templateUrl: './view-lead.component.html',
  styleUrls: ['./view-lead.component.css']
})
export class ViewLeadComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() lead!: LeadWithAffiliate;

  newQuestionnaireAnswers: AnswerDisplay[] = [];
  legacyQuestionnaireAnswers: AnswerDisplay[] = [];

  // Role
  isAdmin = false;
  isSales = false;

  // Call logs
  callLogs: CallLog[] = [];
  isLoadingLogs = false;
  showAddCallForm = false;
  isSavingCall = false;
  showPackageSelector = false;
  selectedSalesPackage: SalesPackage | null = null;
  isSavingStatus = false;
  callForm!: FormGroup;
  private destroy$ = new Subject<void>();

  readonly salesSteps: { key: SalesStatus; label: string }[] = [
    { key: 'new', label: 'New' },
    { key: 'pre_meeting', label: 'Pre-Meeting' },
    { key: 'post_meeting', label: 'Post-Meeting' },
    { key: 'follow_up', label: 'Follow-up' },
    { key: 'closed', label: 'Closed' },
  ];

  readonly salesPackages: { value: SalesPackage; label: string }[] = [
    { value: 'starter', label: SALES_PACKAGE_LABELS.starter },
    { value: 'pro', label: SALES_PACKAGE_LABELS.pro },
    { value: 'ai', label: SALES_PACKAGE_LABELS.ai },
  ];

  readonly callTypeOptions: { value: CallType; label: string }[] = [
    { value: 'invitation', label: 'Invitation Call' },
    { value: 'presentation_confirmation', label: 'Presentation Confirmation' },
    { value: 'presentation_followup', label: 'Presentation Follow-up' },
    { value: 'offer', label: 'Offer Call' },
    { value: 'followup', label: 'Follow-up Call' },
  ];

  readonly callStatusOptions = [
    { value: 'answered', label: 'Answered' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'busy', label: 'Busy' },
  ];

  private modalScrollEl: Element | null = null;
  private scrollHandler = () => AOS.refresh();

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private publicService: PublicService,
    private toastr: ToastrsService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.newQuestionnaireAnswers = this.buildNewQuestionnaireAnswers();
    this.legacyQuestionnaireAnswers = this.buildLegacyQuestionnaireAnswers();
    this.isAdmin = this.publicService.isAdmin();
    this.isSales = this.publicService.isSales();
    this.buildCallForm();
    if (this.lead?.key) {
      this.loadCallLogs();
    }
  }

  ngAfterViewInit(): void {
    // Refresh AOS immediately so modal elements in the initial view animate
    setTimeout(() => AOS.refresh(), 80);

    // Listen to the modal-body scroll to trigger AOS for off-screen elements
    this.ngZone.runOutsideAngular(() => {
      this.modalScrollEl = document.querySelector('ngb-modal-window .modal-body');
      if (this.modalScrollEl) {
        this.modalScrollEl.addEventListener('scroll', this.scrollHandler, { passive: true });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.modalScrollEl) {
      this.modalScrollEl.removeEventListener('scroll', this.scrollHandler);
    }
    this.destroy$.next();
    this.destroy$.complete();
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

  loadCallLogs(): void {
    this.isLoadingLogs = true;
    this.firebaseService.getCallLogs(this.lead.key!)
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.callLogs = logs;
        this.isLoadingLogs = false;
      });
  }

  // ─── Sales Status ────────────────────────────────

  get currentSalesStatus(): SalesStatus {
    return (this.lead.sales_status as SalesStatus) || 'new';
  }

  getStepClass(stepKey: SalesStatus): string {
    const order = ['new', 'pre_meeting', 'post_meeting', 'follow_up', 'closed'];
    const current = order.indexOf(this.currentSalesStatus);
    const target = order.indexOf(stepKey);
    if (target < current) return 'step-done';
    if (target === current) return 'step-active';
    return 'step-pending';
  }

  canChangeTo(status: SalesStatus): boolean {
    return this.isSales || this.isAdmin;
  }

  changeStatus(status: SalesStatus): void {
    if (!this.lead.key || !this.canChangeTo(status) || this.isSavingStatus) return;
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
    if (!this.lead.key) return;
    this.isSavingStatus = true;
    this.firebaseService.updateLeadSalesStatus(this.lead.key, status, salesPackage).then(() => {
      this.lead.sales_status = status;
      this.lead.sales_package = status === 'closed' ? salesPackage : undefined;
      this.showPackageSelector = false;
      this.selectedSalesPackage = null;
      const packageLabel = salesPackage ? ` - ${SALES_PACKAGE_LABELS[salesPackage]}` : '';
      this.toastr.showSuccess(`${SALES_STATUS_LABELS[status]}${packageLabel}`);
    }).catch(() => this.toastr.showError('Failed to update status'))
      .finally(() => this.isSavingStatus = false);
  }

  markNotInterested(): void {
    if (!this.lead.key) return;
    this.firebaseService.updateLeadSalesStatus(this.lead.key, 'not_interested').then(() => {
      this.lead.sales_status = 'not_interested';
      this.lead.sales_package = undefined;
      this.toastr.showSuccess('Marked as Not Interested');
    }).catch(() => this.toastr.showError('Failed to update status'));
  }

  // ─── Call Logs ────────────────────────────────────

  toggleAddCallForm(): void {
    this.showAddCallForm = !this.showAddCallForm;
    if (!this.showAddCallForm) this.buildCallForm();
  }

  saveCall(): void {
    if (this.callForm.invalid || !this.lead.key) return;
    this.isSavingCall = true;
    const uid = this.publicService.getCurrentUserUid() || '';
    const data = {
      ...this.callForm.value,
      leadKey: this.lead.key,
      versionKey: this.lead.versionKey,
      type: 'sales' as const,
      createdBy: uid
    };

    this.firebaseService.addCallLog(this.lead.key, data).then(() => {
      this.isSavingCall = false;
      this.showAddCallForm = false;
      this.buildCallForm();
      this.toastr.showSuccess('Call logged successfully');
    }).catch(() => {
      this.isSavingCall = false;
      this.toastr.showError('Failed to save call');
    });
  }

  getCallTypeLabel(type: string): string {
    return CALL_TYPE_LABELS[type as CallType] || type;
  }

  getCallStatusLabel(status: string): string {
    return CALL_STATUS_LABELS[status as keyof typeof CALL_STATUS_LABELS] || status;
  }

  getCallStatusClass(status: string): string {
    const map: Record<string, string> = {
      answered: 'badge-answered',
      no_answer: 'badge-no-answer',
      busy: 'badge-busy'
    };
    return map[status] || '';
  }

  formatCallDate(date: string, time: string): string {
    return `${date} at ${time}`;
  }

  // ─── Existing helpers ──────────────────────────────

  getCreatedDate(): string {
    return new Date(this.lead.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getCompletedDate(): string {
    if (!this.lead.completedAt) return 'N/A';
    return new Date(this.lead.completedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getGoalLabel(goal?: string): string {
    const goals: { [key: string]: string } = {
      ready_trades: 'Ready Trades', trading_bot: 'Trading Bot',
      learn_trading: 'Learn Trading', steady_income: 'Steady Income'
    };
    return goal ? goals[goal] || goal : 'N/A';
  }

  getExperienceLabel(level?: string): string {
    if (!level) return 'N/A';
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  private buildNewQuestionnaireAnswers(): AnswerDisplay[] {
    const answers = this.lead?.answers;
    if (!answers) return [];
    return [
      { label: 'كم عمرك؟', value: answers.age || '' },
      { label: 'شو وضعك الحالي شغل؟', value: answers.workStatus || '' },
      { label: 'قديش دخلك الشهري بالدولار؟', value: answers.monthlyIncome || '' },
      { label: 'هل جربت التداول قبل؟', value: answers.tradingExperience || '' },
      { label: 'شو أكبر مشكلة مالية عندك حاليا؟', value: answers.financialProblem || '' },
      { label: 'قديش تقدر تخصص من دخلك؟', value: answers.investBudget || '' },
      { label: 'شو هدفك الأساسي من دخولك السيستم اليوم؟', value: answers.systemGoal || '' }
    ].filter(a => !!a.value?.trim());
  }

  private buildLegacyQuestionnaireAnswers(): AnswerDisplay[] {
    const answers = this.lead?.answers;
    if (!answers) return [];
    return [
      { label: 'Experience Level', value: this.getExperienceLabel(answers.experienceLevel) },
      { label: 'Ready Amount', value: answers.readyAmount || '' },
      { label: 'Ready in 24h', value: answers.readyIn24h ? (answers.readyIn24h === 'yes' ? 'Yes' : 'No') : '' },
      { label: 'Tried Elev8 Before', value: answers.triedElev8Before ? (answers.triedElev8Before === 'yes' ? 'Yes' : 'No') : '' },
      { label: 'Main Goal', value: this.getGoalLabel(answers.mainGoal) },
      { label: 'Preferred Location', value: answers.location || '' }
    ].filter(a => !!a.value?.trim() && a.value !== 'N/A');
  }

  hasNewQuestionnaireAnswers(): boolean {
    return this.newQuestionnaireAnswers.length > 0;
  }

  getInitial(): string {
    const name = this.lead?.fullName;
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  /** Missing `source` predates the field — treat as 'v1' (Webinar). */
  getSourceLabel(): string {
    return LEAD_SOURCE_LABELS[(this.lead?.source as LeadSource) || 'v1'];
  }

  /** v2 only — leads from v1 have no qualification result. */
  getQualificationLabel(): string {
    return this.lead?.qualification ? LEAD_QUALIFICATION_LABELS[this.lead.qualification] : '';
  }

  getStatusLabel(): string {
    return this.lead.step === 2 ? 'Completed' : 'Pending';
  }

  getStatusClass(): string {
    return this.lead.step === 2 ? 'status-pill completed' : 'status-pill pending';
  }

  getAssignedDate(): string {
    if (!this.lead.assigned_sales?.assigned_at) return 'N/A';
    return new Date(this.lead.assigned_sales.assigned_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  hasAssignedSales(): boolean {
    return !!this.lead.assigned_sales;
  }

  getAssignedGroupLabel(): string {
    return this.lead.assigned_sales?.group_name || this.lead.salesName || 'Assigned Group';
  }

  getAssignedGroupLink(): string {
    const groupLink = this.lead.assigned_sales?.group_link;
    if (groupLink) return groupLink;
    const legacyNumber = (this.lead.assigned_sales?.whatsapp_number || '').replace(/[^0-9]/g, '');
    return legacyNumber ? `https://wa.me/${legacyNumber}` : '';
  }
}
