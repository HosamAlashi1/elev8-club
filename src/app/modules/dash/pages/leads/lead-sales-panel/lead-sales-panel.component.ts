import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FirebaseService } from '../../../../services/firebase.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';
import { BotAccountService } from '../../../../services/bot-account.service';
import {
  Lead, SalesStatus, SalesPackage, SALES_STATUS_LABELS, SALES_PACKAGE_LABELS,
  CallLog, CALL_TYPE_LABELS, CALL_STATUS_LABELS, CallType,
  V1_SALES_PIPELINE, V2_SALES_PIPELINE, salesPipelineFor, effectiveSalesStatus,
  AccountVerificationDecision, AccountVerificationStatus, ACCOUNT_VERIFICATION_LABELS,
  LEAD_BOT_TYPE_LABELS, LeadBotType, BOT_TOTAL_STEPS, botStepLabel
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

  /**
   * Every step this dashboard knows about. Which of them a lead actually walks depends on where
   * it came from — see `salesSteps`, which is what the template renders.
   */
  private readonly stepDefinitions: Record<SalesStatus, { label: string; icon: string }> = {
    new:          { label: 'New',           icon: 'fe-user' },
    pre_meeting:  { label: 'Pre-Meeting',   icon: 'fe-calendar' },
    post_meeting: { label: 'Post-Meeting',  icon: 'fe-check-square' },
    follow_up:    { label: 'Follow-up',     icon: 'fe-phone' },
    closed:       { label: 'Closed',        icon: 'fe-award' },
    not_interested: { label: 'Not Interested', icon: 'fe-slash' },
    bot_followup: { label: 'Bot Follow-up', icon: 'fe-message-square' },
  };

  readonly salesPackages: { value: SalesPackage; label: string; icon: string }[] = [
    { value: 'starter', label: SALES_PACKAGE_LABELS.starter, icon: 'fe-zap' },
    { value: 'pro', label: SALES_PACKAGE_LABELS.pro, icon: 'fe-star' },
    { value: 'ai', label: SALES_PACKAGE_LABELS.ai, icon: 'fe-cpu' },
  ];

  /** v1's call types — the webinar funnel. Unchanged. */
  private readonly v1CallTypes: { value: CallType; label: string }[] = [
    { value: 'invitation',               label: 'Invitation Call' },
    { value: 'presentation_confirmation', label: 'Presentation Confirmation' },
    { value: 'presentation_followup',    label: 'Presentation Follow-up' },
    { value: 'offer',                    label: 'Offer Call' },
    { value: 'followup',                 label: 'Follow-up Call' },
  ];

  /**
   * v2 has no webinar, so none of the presentation/invitation types apply. It gets the two that
   * match its own pipeline: chasing the lead through the bot, then ordinary follow-up.
   */
  private readonly v2CallTypes: { value: CallType; label: string }[] = [
    { value: 'bot_followup', label: 'Bot Follow-up Call' },
    { value: 'followup',     label: 'Follow-up Call' },
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
    private toastr: ToastrsService,
    private botAccountService: BotAccountService
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
    // Date and time default to right now — a call is nearly always logged just after it
    // happened — and stay editable for one logged after the fact.
    this.callForm = this.fb.group({
      callType: [this.callTypeOptions[0].value, Validators.required],
      callDate: [today, Validators.required],
      callTime: [now, Validators.required],
      status:   ['answered', Validators.required],
      notes:    ['']
    });
  }

  // ── Source ──────────────────────────────────────
  /** A lead with no `source` predates the field and is a v1 lead. */
  get isV2(): boolean {
    return (this.lead?.source || 'v1') === 'v2';
  }

  private pipelineSource?: string;
  private pipelineSteps: { key: SalesStatus; label: string; icon: string }[] = [];

  /**
   * Three steps for a v2 lead, the original five for v1.
   *
   * Cached against the source rather than rebuilt on each read. `*ngFor` compares items by
   * identity, so a getter that returns a fresh array of fresh objects looks like "every row
   * changed" on every change-detection pass — Angular tears the whole stepper down and rebuilds
   * it each time, which locks the panel up. Returning the same reference until the source
   * actually changes is what makes it cheap.
   */
  get salesSteps(): { key: SalesStatus; label: string; icon: string }[] {
    const source = this.lead?.source || 'v1';
    if (source !== this.pipelineSource) {
      this.pipelineSource = source;
      this.pipelineSteps = salesPipelineFor(source)
        .map(key => ({ key, ...this.stepDefinitions[key] }));
    }
    return this.pipelineSteps;
  }

  get callTypeOptions(): { value: CallType; label: string }[] {
    return this.isV2 ? this.v2CallTypes : this.v1CallTypes;
  }

  // ── Status ──────────────────────────────────────
  get currentStatus(): SalesStatus {
    if (!this.lead) return 'new';
    return effectiveSalesStatus(this.lead);
  }

  getStepState(key: SalesStatus): 'done' | 'active' | 'pending' {
    const order = salesPipelineFor(this.lead?.source);
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
    // Back to the FIRST step of this lead's own pipeline, which is not 'new' for a v2 lead.
    const first = salesPipelineFor(this.lead.source)[0];
    this.firebaseService.updateLeadSalesStatus(this.lead.key, first).then(() => {
      this.lead.sales_status = first;
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

  // ── Bot progress (v2 only) ───────────────────────
  //
  // Everything here is READ-ONLY except the verify/reject decision, which goes through the bot's
  // API rather than Firebase — see BotAccountService for why. The lead's own record updates when
  // the bot's backend writes back, and the live Firebase subscription behind this panel picks
  // that up on its own, which is also what confirms the call actually landed.

  readonly botTotalSteps = BOT_TOTAL_STEPS;

  isSavingVerification = false;

  get botStepNumber(): number {
    return this.lead?.currentStepNumber || 0;
  }

  get botStepLabel(): string {
    return botStepLabel(this.lead?.currentStepNumber);
  }

  get botProgressPercent(): number {
    if (!this.botStepNumber) return 0;
    return Math.round((Math.min(this.botStepNumber, BOT_TOTAL_STEPS) / BOT_TOTAL_STEPS) * 100);
  }

  get botTypeLabel(): string {
    return LEAD_BOT_TYPE_LABELS[(this.lead?.type as LeadBotType) || 'free'];
  }

  get verificationStatus(): AccountVerificationStatus {
    return (this.lead?.accountVerificationStatus as AccountVerificationStatus) || 'not_submitted';
  }

  get verificationLabel(): string {
    return ACCOUNT_VERIFICATION_LABELS[this.verificationStatus];
  }

  /** Own classes rather than the leads table's `pill-*` — those are scoped to that component. */
  getVerificationClass(status?: string): string {
    const map: Record<AccountVerificationStatus, string> = {
      not_submitted: 'sp-pill--idle',
      pending: 'sp-pill--waiting',
      verified: 'sp-pill--ok',
      rejected: 'sp-pill--bad'
    };
    return map[(status as AccountVerificationStatus) || 'not_submitted'] || 'sp-pill--idle';
  }

  /** The lead has actually opened the bot, so the bot has a conversation to act on. */
  get hasBotConversation(): boolean {
    return !!this.lead?.telegramChatId;
  }

  /**
   * True once the lead has sent a trading-account number and is waiting on us. The buttons stay
   * available outside that state so a wrong decision can be corrected, but this is what drives
   * the "needs you" highlight.
   */
  get awaitingVerification(): boolean {
    return this.verificationStatus === 'pending';
  }

  setVerification(status: AccountVerificationDecision): void {
    if (!this.lead?.telegramChatId || !this.awaitingVerification || this.isSavingVerification) return;
    if (status === this.verificationStatus) return;

    const question = status === 'verified'
      ? `Verify ${this.lead.fullName}'s trading account? The bot will move them on to the community step.`
      : `Reject ${this.lead.fullName}'s trading account? The bot will tell them it was not accepted.`;
    if (!confirm(question)) return;

    this.isSavingVerification = true;
    this.botAccountService.updateAccountStatus(this.lead.telegramChatId, status)
      .then(() => {
        // Deliberately NOT written into the lead here — the bot's backend owns this field, and
        // the panel's live Firebase subscription shows the new value once it has actually
        // stored it. Painting it optimistically would hide a backend that accepted the request
        // and then failed to apply it.
        this.toastr.showSuccess(
          status === 'verified' ? 'Account verified — the bot has been told' : 'Account rejected — the bot has been told'
        );
      })
      .catch(err => {
        console.error('Bot account status update failed:', err);
        this.toastr.showError('Could not reach the bot. The status was not changed.');
      })
      .finally(() => this.isSavingVerification = false);
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
