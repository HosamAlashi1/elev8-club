import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FirebaseService } from '../../../../services/firebase.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';
import {
  Lead, SalesStatus, SalesPackage, SALES_STATUS_LABELS, SALES_PACKAGE_LABELS,
  CallLog, CALL_TYPE_LABELS, CALL_STATUS_LABELS, CallType
} from '../../../../../core/models';

interface LeadWithAffiliate extends Lead {
  affiliateName?: string;
  affiliateCode?: string;
  salesMemberName?: string;
  assigned_sales?: any;
}

@Component({
  selector: 'app-lead-sales-panel',
  templateUrl: './lead-sales-panel.component.html',
  styleUrls: ['./lead-sales-panel.component.css']
})
export class LeadSalesPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() lead!: LeadWithAffiliate;
  @Output() closed = new EventEmitter<void>();

  callLogs: CallLog[] = [];
  isLoadingLogs = false;
  showCallForm = false;
  isSavingCall = false;
  callForm!: FormGroup;
  isAdmin = false;
  isSales = false;
  showPackageSelector = false;
  selectedSalesPackage: SalesPackage | null = null;
  isSavingStatus = false;

  // Edit state
  editingLogKey: string | null = null;
  editForm!: FormGroup;
  isSavingEdit = false;

  private destroy$ = new Subject<void>();
  private currentLeadKey = '';

  readonly salesSteps: { key: SalesStatus; label: string; icon: string }[] = [
    { key: 'new',          label: 'New',          icon: 'fe-user' },
    { key: 'pre_meeting',  label: 'Pre-Meeting',  icon: 'fe-calendar' },
    { key: 'post_meeting', label: 'Post-Meeting', icon: 'fe-check-square' },
    { key: 'follow_up',   label: 'Follow-up',    icon: 'fe-phone' },
    { key: 'closed',      label: 'Closed',       icon: 'fe-award' },
  ];

  readonly salesPackages: { value: SalesPackage; label: string; icon: string }[] = [
    { value: 'starter', label: SALES_PACKAGE_LABELS.starter, icon: 'fe-zap' },
    { value: 'pro', label: SALES_PACKAGE_LABELS.pro, icon: 'fe-star' },
    { value: 'ai', label: SALES_PACKAGE_LABELS.ai, icon: 'fe-cpu' },
  ];

  readonly callTypeOptions: { value: CallType; label: string }[] = [
    { value: 'invitation',               label: 'Invitation Call' },
    { value: 'presentation_confirmation', label: 'Presentation Confirmation' },
    { value: 'presentation_followup',    label: 'Presentation Follow-up' },
    { value: 'offer',                    label: 'Offer Call' },
    { value: 'followup',                 label: 'Follow-up Call' },
  ];

  readonly callStatusOptions = [
    { value: 'answered',  label: 'Answered',  icon: 'fe-check-circle' },
    { value: 'no_answer', label: 'No Answer', icon: 'fe-phone-missed' },
    { value: 'busy',      label: 'Busy',      icon: 'fe-phone-off' },
  ];

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private publicService: PublicService,
    private toastr: ToastrsService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.publicService.isAdmin();
    this.isSales = this.publicService.isSales();
    this.buildCallForm();
    this.loadCallLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lead'] && !changes['lead'].firstChange) {
      const newKey = changes['lead'].currentValue?.key;
      if (newKey && newKey !== this.currentLeadKey) {
        this.callLogs = [];
        this.showCallForm = false;
        this.showPackageSelector = false;
        this.selectedSalesPackage = null;
        this.editingLogKey = null;
        this.buildCallForm();
        this.loadCallLogs();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCallLogs(): void {
    if (!this.lead?.key) return;
    this.currentLeadKey = this.lead.key;
    this.isLoadingLogs = true;
    this.destroy$.next();
    this.firebaseService.getCallLogs(this.lead.key)
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.callLogs = [...logs].sort((a, b) =>
          new Date(b.callDate + 'T' + b.callTime).getTime() -
          new Date(a.callDate + 'T' + a.callTime).getTime()
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
      status:   ['answered', Validators.required],
      notes:    ['']
    });
  }

  // ── Status ──────────────────────────────────────
  get currentStatus(): SalesStatus {
    return (this.lead?.sales_status as SalesStatus) || 'new';
  }

  getStepState(key: SalesStatus): 'done' | 'active' | 'pending' {
    const order: SalesStatus[] = ['new', 'pre_meeting', 'post_meeting', 'follow_up', 'closed'];
    const curr = order.indexOf(this.currentStatus);
    const idx  = order.indexOf(key);
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
    if (!this.lead?.key || !confirm('Mark as Not Interested?')) return;
    this.firebaseService.updateLeadSalesStatus(this.lead.key, 'not_interested').then(() => {
      this.lead.sales_status = 'not_interested';
      this.lead.sales_package = undefined;
      this.toastr.showSuccess('Marked as Not Interested');
    });
  }

  resetStatus(): void {
    if (!this.lead?.key) return;
    this.firebaseService.updateLeadSalesStatus(this.lead.key, 'new').then(() => {
      this.lead.sales_status = 'new';
      this.lead.sales_package = undefined;
      this.toastr.showSuccess('Status reset');
    });
  }

  // ── Add Call ─────────────────────────────────────
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

  // ── Edit Call ─────────────────────────────────────
  startEdit(log: CallLog): void {
    this.showCallForm = false;
    this.editingLogKey = log.key!;
    this.editForm = this.fb.group({
      callType: [log.callType, Validators.required],
      callDate: [log.callDate, Validators.required],
      callTime: [log.callTime, Validators.required],
      status:   [log.status,   Validators.required],
      notes:    [log.notes || '']
    });
  }

  cancelEdit(): void {
    this.editingLogKey = null;
  }

  saveEdit(): void {
    if (!this.lead?.key || !this.editingLogKey || this.editForm.invalid || this.isSavingEdit) return;
    this.isSavingEdit = true;
    this.firebaseService.updateCallLog(this.lead.key, this.editingLogKey, this.editForm.value)
      .then(() => {
        this.isSavingEdit = false;
        this.editingLogKey = null;
        this.toastr.showSuccess('Call updated');
      })
      .catch(() => {
        this.isSavingEdit = false;
        this.toastr.showError('Failed to update call');
      });
  }

  deleteCall(log: CallLog): void {
    if (!this.lead?.key || !log.key || !confirm('Delete this call?')) return;
    this.firebaseService.deleteCallLog(this.lead.key, log.key)
      .then(() => this.toastr.showSuccess('Call deleted'))
      .catch(() => this.toastr.showError('Failed to delete'));
  }

  // ── Helpers ──────────────────────────────────────
  getCallTypeLabel(t: string): string { return CALL_TYPE_LABELS[t as CallType] || t; }
  getCallStatusLabel(s: string): string { return CALL_STATUS_LABELS[s as keyof typeof CALL_STATUS_LABELS] || s; }
  getCallStatusIcon(s: string): string {
    return this.callStatusOptions.find(o => o.value === s)?.icon || 'fe-phone';
  }

  getInitial(): string {
    return this.lead?.fullName?.trim().charAt(0).toUpperCase() || '?';
  }

  close(): void { this.closed.emit(); }
}
