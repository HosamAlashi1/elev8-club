import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../../../services/firebase.service';
import { ToastrsService } from '../../../../../services/toater.service';

interface SalesItem {
  id?: string;
  whatsapp_number: string;
  counter: number;
}

@Component({
  selector: 'app-add-edit-sales-item',
  templateUrl: './add-edit-sales-item.component.html',
  styleUrls: ['./add-edit-sales-item.component.css']
})
export class AddEditSalesItemComponent implements OnInit {
  @Input() salesItem?: SalesItem;

  form!: FormGroup;
  submitted = false;
  isSubmitting = false;

  get isEdit(): boolean {
    return !!this.salesItem;
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
    if (this.isEdit && this.salesItem) {
      this.patchForm();
    }
  }

  initForm(): void {
    this.form = new FormGroup({
      whatsapp_number: new FormControl('', [Validators.required, Validators.maxLength(20)]),
    //   counter: new FormControl(0, [Validators.required, Validators.min(0)])
    });
  }

  patchForm(): void {
    if (!this.salesItem) return;
    
    this.form.patchValue({
      whatsapp_number: this.salesItem.whatsapp_number,
    //   counter: this.salesItem.counter
    });
  }

  submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.toastr.showError('Please fill all required fields correctly');
      return;
    }

    this.isSubmitting = true;

    const data = {
      whatsapp_number: this.form.value.whatsapp_number.trim(),
    //   counter: Number(this.form.value.counter) || 0
    };

    if (this.isEdit && this.salesItem?.id) {
      // Update
      this.firebaseService.update('sales', this.salesItem.id, data)
        .then(() => {
          this.toastr.showSuccess('Sales item updated successfully');
          this.activeModal.close('updated');
        })
        .catch(error => {
          console.error('Error updating sales item:', error);
          this.toastr.showError('Failed to update sales item');
          this.isSubmitting = false;
        });
    } else {
      // Add
      this.firebaseService.add('sales', data)
        .then(() => {
          this.toastr.showSuccess('Sales item added successfully');
          this.activeModal.close('added');
        })
        .catch(error => {
          console.error('Error adding sales item:', error);
          this.toastr.showError('Failed to add sales item');
          this.isSubmitting = false;
        });
    }
  }
}
