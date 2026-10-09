import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Affiliate, Lead, SalesMember, Version } from '../../../../../core/models';
import { FirebaseService } from '../../../../services/firebase.service';
import { ToastrsService } from '../../../../services/toater.service';
import { PublicService } from '../../../../services/public.service';

@Component({
  selector: 'app-add-edit-lead',
  templateUrl: './add-edit-lead.component.html',
  styleUrls: ['./add-edit-lead.component.css']
})
export class AddEditLeadComponent implements OnInit {
  @Input() lead: Lead | null = null;
  @Input() currentVersion: Version | null = null;
  @Input() affiliates: Affiliate[] = [];
  @Input() salesMembers: SalesMember[] = [];
  @Input() existingLeads: Lead[] = [];

  form!: FormGroup;
  submitted = false;
  isSaving = false;
  duplicateEmail = false;
  createdSubscriptionNumber: string | null = null;
  codeCopied = false;

  /** A sales member adds leads that are always their own, so the owner / affiliate pickers are hidden. */
  get isSales(): boolean {
    return this.publicService.isSales();
  }

  get isEdit(): boolean {
    return !!this.lead?.key;
  }

  get f() {
    return this.form.controls;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private toastr: ToastrsService,
    private publicService: PublicService
  ) {}

  ngOnInit(): void {
    this.affiliates = [...this.affiliates].sort((a, b) => a.name.localeCompare(b.name));
    this.salesMembers = this.salesMembers
      .filter(member => member.isActive || member.key === this.lead?.salesMemberKey)
      .sort((a, b) => a.name.localeCompare(b.name));

    this.form = this.fb.group({
      fullName: [this.lead?.fullName || '', [Validators.required, Validators.maxLength(120)]],
      email: [this.lead?.email || '', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phone: [this.lead?.phone || '', [Validators.required, Validators.maxLength(40)]],
      country: [this.lead?.country || '', Validators.maxLength(100)],
      city: [this.lead?.city || '', Validators.maxLength(100)],
      source: [this.lead?.source || 'v1', Validators.required],
      affiliateKey: [this.lead?.affiliateKey || ''],
      salesMemberKey: [this.isEdit ? (this.lead?.salesMemberKey || '') : '__auto__']
    });

    this.form.get('email')?.valueChanges.subscribe(() => this.duplicateEmail = false);
  }

  async submit(): Promise<void> {
    this.submitted = true;
    this.duplicateEmail = false;
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return;

    const versionKey = this.lead?.versionKey || this.currentVersion?.key;
    if (!versionKey) {
      this.toastr.showError('No active version is available');
      return;
    }

    const value = this.form.getRawValue();
    const email = String(value.email).trim().toLowerCase();
    const source = this.lead?.source || value.source;
    this.duplicateEmail = this.existingLeads.some(item =>
      item.key !== this.lead?.key &&
      item.versionKey === versionKey &&
      (item.source || 'v1') === source &&
      String(item.email || '').trim().toLowerCase() === email
    );
    if (this.duplicateEmail) return;

    const affiliate = this.affiliates.find(item => item.key === value.affiliateKey);
    const salesMemberKey = value.salesMemberKey === '__auto__'
      ? undefined
      : (value.salesMemberKey || null);
    const common = {
      fullName: String(value.fullName).trim(),
      email,
      phone: String(value.phone).trim(),
      country: String(value.country || '').trim(),
      city: String(value.city || '').trim()
    };

    this.isSaving = true;
    try {
      if (this.isEdit) {
        await this.firebaseService.updateAdminLead(this.lead!.key!, {
          ...common,
          country: common.country || null,
          city: common.city || null,
          affiliateKey: affiliate?.key || null,
          affiliateCode: affiliate?.code || null,
          salesMemberKey: salesMemberKey || null
        });
        this.toastr.showSuccess('Lead updated successfully');
      } else if (this.isSales) {
        const result = await this.firebaseService.addSalesLead({
          versionKey,
          ...common,
          source,
          country: common.country || undefined,
          city: common.city || undefined
        });
        this.toastr.showSuccess('Lead added successfully');
        if (result.subscriptionNumber) {
          this.createdSubscriptionNumber = result.subscriptionNumber;
          this.form.disable();
          return;
        }
      } else {
        const result = await this.firebaseService.addAdminLead({
          versionKey,
          ...common,
          source,
          country: common.country || undefined,
          city: common.city || undefined,
          affiliateKey: affiliate?.key,
          affiliateCode: affiliate?.code,
          salesMemberKey
        });
        this.toastr.showSuccess('Lead added successfully');
        if (result.subscriptionNumber) {
          this.createdSubscriptionNumber = result.subscriptionNumber;
          this.form.disable();
          return;
        }
      }
      this.activeModal.close(true);
    } catch (error: any) {
      this.toastr.showError(error?.message || 'Failed to save lead');
    } finally {
      this.isSaving = false;
    }
  }

  async copySubscriptionNumber(): Promise<void> {
    if (!this.createdSubscriptionNumber) return;
    try {
      await navigator.clipboard.writeText(this.createdSubscriptionNumber);
      this.codeCopied = true;
      this.toastr.showSuccess('Subscription code copied');
    } catch {
      this.toastr.showError('Could not copy the code');
    }
  }
}
