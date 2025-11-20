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

  form!: FormGroup;
  submitted = false;
  isSubmitting = false;

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
      code: new FormControl('', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9]+$/)]),
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

  submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.toastr.showError('Please fill all required fields correctly');
      return;
    }

    this.isSubmitting = true;

    const data: Omit<Affiliate, 'key' | 'createdAt'> = {
      name: this.form.value.name.trim(),
      email: this.form.value.email.trim(),
      code: this.form.value.code.trim().toUpperCase(),
      whatsappNumber: this.form.value.whatsappNumber.trim()
    };

    if (this.isEdit && this.affiliate) {
      // Update
      this.firebaseService.updateAffiliate(this.affiliate.key, data)
        .then(() => {
          this.toastr.showSuccess('Affiliate updated successfully');
          this.activeModal.close('updated');
        })
        .catch(error => {
          console.error('Error updating affiliate:', error);
          this.toastr.showError('Failed to update affiliate');
          this.isSubmitting = false;
        });
    } else {
      // Add
      this.firebaseService.addAffiliate(data)
        .then(() => {
          this.toastr.showSuccess('Affiliate added successfully');
          this.activeModal.close('added');
        })
        .catch(error => {
          console.error('Error adding affiliate:', error);
          this.toastr.showError('Failed to add affiliate');
          this.isSubmitting = false;
        });
    }
  }
}
