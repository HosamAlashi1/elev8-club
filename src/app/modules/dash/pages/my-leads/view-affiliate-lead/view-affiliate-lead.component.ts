import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Lead, AffiliateStatus, AFFILIATE_STATUS_LABELS,
  CallLog, CALL_STATUS_LABELS
} from '../../../../../core/models';
import { FirebaseService } from '../../../../services/firebase.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-view-affiliate-lead',
  templateUrl: './view-affiliate-lead.component.html',
  styleUrls: ['./view-affiliate-lead.component.css']
})
export class ViewAffiliateLeadComponent implements OnInit, OnDestroy {
  @Input() lead!: Lead;

  callLogs: CallLog[] = [];
  isLoadingLogs = false;
  showAddCallForm = false;
  isSavingCall = false;
  callForm!: FormGroup;
  isUpdatingStatus = false;
  private destroy$ = new Subject<void>();

  readonly affiliateStatuses: { key: AffiliateStatus; label: string }[] = [
    { key: 'renewal_followup', label: 'Renewal Follow-up' },
    { key: 'renewed', label: 'Renewed' },
    { key: 'not_renewed', label: 'Not Renewed' },
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
    private toastr: ToastrsService
  ) {}

  ngOnInit(): void {
    this.buildCallForm();
    if (this.lead?.key) this.loadCallLogs();
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

  loadCallLogs(): void {
    this.isLoadingLogs = true;
    this.firebaseService.getCallLogs(this.lead.key!)
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.callLogs = logs.filter(l => l.type === 'affiliate');
        this.isLoadingLogs = false;
      });
  }

  get currentStatus(): AffiliateStatus {
    return (this.lead.affiliate_status as AffiliateStatus) || 'renewal_followup';
  }

  getStatusLabel(status?: string): string {
    return AFFILIATE_STATUS_LABELS[(status as AffiliateStatus)] || 'Renewal Follow-up';
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      renewal_followup: 'pill-warning',
      renewed: 'pill-success',
      not_renewed: 'pill-danger'
    };
    return map[status || 'renewal_followup'] || 'pill-warning';
  }

  changeStatus(status: AffiliateStatus): void {
    if (!this.lead.key || this.isUpdatingStatus) return;
    this.isUpdatingStatus = true;
    this.firebaseService.updateLeadAffiliateStatus(this.lead.key, status).then(() => {
      this.lead.affiliate_status = status;
      this.isUpdatingStatus = false;
      this.toastr.showSuccess('Status updated');
    }).catch(() => {
      this.isUpdatingStatus = false;
      this.toastr.showError('Failed to update status');
    });
  }

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
      callType: 'affiliate_followup' as const,
      leadKey: this.lead.key,
      versionKey: this.lead.versionKey,
      type: 'affiliate' as const,
      createdBy: uid
    };

    this.firebaseService.addCallLog(this.lead.key, data).then(() => {
      this.isSavingCall = false;
      this.showAddCallForm = false;
      this.buildCallForm();
      this.toastr.showSuccess('Call logged');
    }).catch(() => {
      this.isSavingCall = false;
      this.toastr.showError('Failed to save call');
    });
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
