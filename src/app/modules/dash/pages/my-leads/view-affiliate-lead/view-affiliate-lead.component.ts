import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Lead, RenewalStatus, RenewalCycle, AFFILIATE_STATUS_LABELS,
  CallLog, CALL_STATUS_LABELS, SalesPackage, SALES_PACKAGE_LABELS
} from '../../../../../core/models';
import { FirebaseService } from '../../../../services/firebase.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';
import { ConfirmationDialogService } from '../../../components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-view-affiliate-lead',
  templateUrl: './view-affiliate-lead.component.html',
  styleUrls: ['./view-affiliate-lead.component.css']
})
export class ViewAffiliateLeadComponent implements OnInit, OnDestroy {
  @Input() lead!: Lead;
  @Input() readOnly = false;

  callLogs: CallLog[] = [];
  renewalCycles: RenewalCycle[] = [];
  isLoadingLogs = false;
  isLoadingRenewals = false;
  showAddCallForm = false;
  isSavingCall = false;
  callForm!: FormGroup;
  isUpdatingStatus = false;
  isStartingCycle = false;
  showPackageSelector = false;
  selectedRenewalPackage: SalesPackage | null = null;
  isCreatingInitialCycle = false;
  private destroy$ = new Subject<void>();

  readonly renewalStatuses: { key: RenewalStatus; label: string }[] = [
    { key: 'renewal_followup', label: 'Renewal Follow-up' },
    { key: 'renew_later', label: 'Renew Later' },
    { key: 'renewed', label: 'Renewed' },
    { key: 'not_renewed', label: 'Not Renewed' },
  ];

  readonly renewalPackages: { key: SalesPackage; label: string }[] = [
    { key: 'starter', label: SALES_PACKAGE_LABELS.starter },
    { key: 'pro', label: SALES_PACKAGE_LABELS.pro },
    { key: 'ai', label: SALES_PACKAGE_LABELS.ai },
  ];

  readonly callStatusOptions = [
    { value: 'answered', label: 'Answered' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'busy', label: 'Busy' },
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private publicService: PublicService,
    private toastr: ToastrsService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.readOnly = this.readOnly || this.publicService.isAffiliate();
    this.buildCallForm();
    if (this.lead?.key) {
      this.loadRenewalCycles();
      this.loadCallLogs();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildCallForm(): void {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    this.callForm = this.fb.group({
      callDate: [today, Validators.required],
      callTime: [now, Validators.required],
      status: ['answered', Validators.required],
      notes: ['']
    });
  }

  private loadRenewalCycles(): void {
    this.isLoadingRenewals = true;
    this.firebaseService.getRenewalCycles(this.lead.key!)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cycles => {
        this.renewalCycles = cycles;
        this.isLoadingRenewals = false;
        if (!cycles.length && !this.readOnly && !this.isCreatingInitialCycle) {
          this.isCreatingInitialCycle = true;
          const uid = this.publicService.getCurrentUserUid() || '';
          this.firebaseService.ensureInitialRenewalCycle(this.lead, uid)
            .catch(() => this.toastr.showError('Failed to initialize renewal tracking'))
            .finally(() => this.isCreatingInitialCycle = false);
        }
      });
  }

  loadCallLogs(): void {
    this.isLoadingLogs = true;
    this.firebaseService.getCallLogs(this.lead.key!)
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.callLogs = logs.filter(l => l.type === 'affiliate' || l.type === 'renewal');
        this.isLoadingLogs = false;
      });
  }

  get currentCycle(): RenewalCycle | null {
    return this.renewalCycles.length
      ? this.renewalCycles[this.renewalCycles.length - 1]
      : null;
  }

  get currentStatus(): RenewalStatus {
    return this.currentCycle?.status || this.lead.renewal_status || this.lead.affiliate_status || 'renewal_followup';
  }

  getStatusLabel(status?: string): string {
    return AFFILIATE_STATUS_LABELS[(status as RenewalStatus)] || 'Renewal Follow-up';
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      renewal_followup: 'pill-warning',
      renew_later: 'pill-info',
      renewed: 'pill-success',
      not_renewed: 'pill-danger'
    };
    return map[status || 'renewal_followup'] || 'pill-warning';
  }

  async changeStatus(status: RenewalStatus): Promise<void> {
    if (this.readOnly || !this.currentCycle || this.isUpdatingStatus || status === this.currentStatus) return;
    if (status === 'renewed') {
      this.selectedRenewalPackage = this.currentCycle.package || this.lead.renewal_package || null;
      this.showPackageSelector = true;
      return;
    }
    const confirmed = await this.confirmRenewalAction(
      'Change Renewal Status',
      `Are you sure you want to change the Renewal Status to "${AFFILIATE_STATUS_LABELS[status]}"?`
    );
    if (!confirmed) return;
    this.persistStatus(status);
  }

  async saveRenewedStatus(): Promise<void> {
    if (!this.selectedRenewalPackage) return;
    const label = SALES_PACKAGE_LABELS[this.selectedRenewalPackage];
    const confirmed = await this.confirmRenewalAction(
      'Confirm Renewal',
      `Are you sure you want to confirm renewal with the ${label} package?`
    );
    if (!confirmed) return;
    this.persistStatus('renewed', this.selectedRenewalPackage);
  }

  private async confirmRenewalAction(title: string, message: string): Promise<boolean> {
    try {
      return await this.confirmationDialog.confirm(
        title,
        message,
        'Confirm',
        'fe fe-check',
        'btn-custom',
        'Cancel',
        'btn-light'
      );
    } catch {
      return false;
    }
  }

  cancelPackageSelection(): void {
    this.showPackageSelector = false;
    this.selectedRenewalPackage = null;
  }

  private persistStatus(status: RenewalStatus, salesPackage?: SalesPackage): void {
    if (!this.currentCycle) return;
    const wasRenewed = this.currentCycle.status === 'renewed';
    const willBeRenewed = status === 'renewed';
    this.isUpdatingStatus = true;
    this.firebaseService.updateRenewalCycleStatus(this.lead, this.currentCycle, status, salesPackage).then(() => {
      this.lead.renewal_status = status;
      this.lead.affiliate_status = status;
      this.lead.renewal_package = status === 'renewed' ? salesPackage : undefined;
      this.lead.renewal_count = Math.max(
        0,
        (this.lead.renewal_count || 0) + (willBeRenewed ? 1 : 0) - (wasRenewed ? 1 : 0)
      );
      this.currentCycle!.status = status;
      this.currentCycle!.package = status === 'renewed' ? salesPackage : undefined;
      this.showPackageSelector = false;
      this.selectedRenewalPackage = null;
      this.toastr.showSuccess('Renewal status updated');
    }).catch(() => {
      this.toastr.showError('Failed to update status');
    }).finally(() => this.isUpdatingStatus = false);
  }

  async startNextRenewal(): Promise<void> {
    if (this.readOnly || !this.currentCycle || this.currentStatus === 'renewal_followup' || this.isStartingCycle) return;
    const nextNumber = this.currentCycle.cycleNumber + 1;
    const confirmed = await this.confirmRenewalAction(
      'Start Renewal Follow-up',
      `Are you sure you want to start Renewal Follow-up #${nextNumber}?`
    );
    if (!confirmed) return;
    this.isStartingCycle = true;
    const uid = this.publicService.getCurrentUserUid() || '';
    this.firebaseService.createRenewalCycle(this.lead, nextNumber, uid)
      .then(cycle => {
        this.lead.current_renewal_cycle_key = cycle.key;
        this.lead.renewal_status = 'renewal_followup';
        this.lead.affiliate_status = 'renewal_followup';
        this.lead.renewal_package = undefined;
        this.toastr.showSuccess(`Renewal Follow-up #${nextNumber} started`);
      })
      .catch(() => this.toastr.showError('Failed to start the next renewal'))
      .finally(() => this.isStartingCycle = false);
  }

  toggleAddCallForm(): void {
    if (!this.canAddCall()) return;
    this.showAddCallForm = !this.showAddCallForm;
    if (!this.showAddCallForm) this.buildCallForm();
  }

  saveCall(): void {
    if (this.callForm.invalid || !this.lead.key || !this.currentCycle || !this.canAddCall()) return;
    this.isSavingCall = true;
    const uid = this.publicService.getCurrentUserUid() || '';

    const data = {
      ...this.callForm.value,
      callType: 'affiliate_followup' as const,
      leadKey: this.lead.key,
      versionKey: this.lead.versionKey,
      type: 'renewal' as const,
      createdBy: uid
    };

    this.firebaseService.addRenewalCall(this.lead.key, this.currentCycle, data).then(() => {
      this.isSavingCall = false;
      this.showAddCallForm = false;
      this.buildCallForm();
      this.toastr.showSuccess('Call logged');
    }).catch((error: Error) => {
      this.isSavingCall = false;
      this.toastr.showError(error?.message || 'Failed to save call');
    });
  }

  getCycleCalls(cycle: RenewalCycle, cycleIndex: number): CallLog[] {
    return this.callLogs.filter(log =>
      log.renewalCycleKey === cycle.key ||
      (cycleIndex === 0 && log.type === 'affiliate' && !log.renewalCycleKey)
    );
  }

  canAddCall(): boolean {
    if (this.readOnly || !this.currentCycle || this.currentStatus !== 'renewal_followup') return false;
    const index = this.renewalCycles.length - 1;
    return this.getCycleCalls(this.currentCycle, index).length < 4;
  }

  getCurrentCycleCallCount(): number {
    if (!this.currentCycle) return 0;
    return this.getCycleCalls(this.currentCycle, this.renewalCycles.length - 1).length;
  }

  getPackageLabel(salesPackage?: SalesPackage): string {
    return salesPackage ? SALES_PACKAGE_LABELS[salesPackage] : '';
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

  formatDate(date: string, time: string): string {
    return `${date} at ${time}`;
  }

  getInitial(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
