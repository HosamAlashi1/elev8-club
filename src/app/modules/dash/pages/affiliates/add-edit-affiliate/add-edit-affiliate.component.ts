import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../../services/firebase.service';
import { Affiliate } from '../../../../../core/models';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-affiliate',
  templateUrl: './add-edit-affiliate.component.html',
  styleUrls: ['./add-edit-affiliate.component.css']
})
export class AddEditAffiliateComponent implements OnInit {
  @Input() affiliate?: Affiliate;
  @Input() versionKey?: string;

  form!: FormGroup;
  submitted = false;
  isSubmitting = false;
  showPassword = false;

  get isEdit(): boolean {
    return !!this.affiliate;
  }

  get f() {
    return this.form.controls;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private firebaseService: FirebaseService,
    private toastr: ToastrsService
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.isEdit && this.affiliate) {
      this.patchForm();
    }
  }

  initForm(): void {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(190)]),
      password: new FormControl('', Validators.minLength(8)),
      code: new FormControl('', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9]+$/)]),
      whatsappNumber: new FormControl('', [Validators.required, Validators.maxLength(20)])
    });
  }

  patchForm(): void {
    if (!this.affiliate) return;
    
    this.form.patchValue({
      name: this.affiliate.name,
      email: this.affiliate.email,
      code: this.affiliate.code,
      whatsappNumber: this.affiliate.whatsappNumber
    });
  }

  async submit(): Promise<void> {
    this.submitted = true;

    if (this.form.invalid) {
      this.toastr.showError('Please fill all required fields correctly');
      return;
    }

    this.isSubmitting = true;

    if (!this.isEdit && !this.versionKey) {
      this.toastr.showError('No active version found');
      this.isSubmitting = false;
      return;
    }

    if (!this.affiliate?.userId && !this.form.value.password) {
      this.toastr.showError('An initial password is required for the affiliate login');
      this.isSubmitting = false;
      return;
    }

    const data: Omit<Affiliate, 'key' | 'createdAt'> = {
      versionKey: this.affiliate?.versionKey || this.versionKey,
      name: this.form.value.name.trim(),
      email: this.form.value.email.trim(),
      code: this.form.value.code.trim().toUpperCase(),
      whatsappNumber: this.form.value.whatsappNumber.trim()
    };

    try {
      if (this.isEdit && this.affiliate) {
        if (this.affiliate.userId) {
          await this.firebaseService.updateDashboardAuthUser({
            uid: this.affiliate.userId,
            name: data.name,
            email: data.email,
            password: this.form.value.password || undefined
          });
        } else {
          const result = await this.firebaseService.createDashboardAuthUser({
            email: data.email,
            password: this.form.value.password,
            name: data.name,
            role: 'affiliate',
            versionKey: data.versionKey,
            affiliateKey: this.affiliate.key
          });
          data.userId = result.uid;
        }
        await this.firebaseService.updateAffiliate(this.affiliate.key, data);
        this.toastr.showSuccess('Affiliate updated successfully');
        this.activeModal.close('updated');
      } else {
        const affiliateKey = await this.firebaseService.addAffiliate(data);
        try {
          const result = await this.firebaseService.createDashboardAuthUser({
            email: data.email,
            password: this.form.value.password,
            name: data.name,
            role: 'affiliate',
            versionKey: data.versionKey,
            affiliateKey
          });
          await this.firebaseService.updateAffiliate(affiliateKey, { userId: result.uid });
        } catch (error) {
          await this.firebaseService.deleteAffiliate(affiliateKey);
          throw error;
        }
        this.toastr.showSuccess('Affiliate and login created successfully');
        this.activeModal.close('added');
      }
    } catch (error: any) {
      console.error('Error saving affiliate:', error);
      this.toastr.showError(error?.message || 'Failed to save affiliate account');
      this.isSubmitting = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
