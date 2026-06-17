import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../../../services/firebase.service';
import { ToastrsService } from '../../../../../services/toater.service';

interface SalesItem {
  id?: string;
  group_name: string;
  group_link: string;
  group_order: number;
  counter: number;
  whatsapp_number?: string;
  versionKey?: string;
}

@Component({
  selector: 'app-add-edit-sales-item',
  templateUrl: './add-edit-sales-item.component.html',
  styleUrls: ['./add-edit-sales-item.component.css']
})
export class AddEditSalesItemComponent implements OnInit {
  @Input() salesItem?: SalesItem;
  @Input() versionKey?: string;
  @Input() nextOrder = 1;

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
      group_name: new FormControl(`WhatsApp Group ${this.nextOrder}`, [Validators.required, Validators.maxLength(80)]),
      group_link: new FormControl('', [Validators.required, Validators.maxLength(500)])
    });
  }

  patchForm(): void {
    if (!this.salesItem) return;
    
    this.form.patchValue({
      group_name: this.salesItem.group_name,
      group_link: this.salesItem.group_link
    });
  }

  submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.toastr.showError('Please fill all required fields correctly');
      return;
    }

    this.isSubmitting = true;
    const itemVersionKey = this.versionKey || this.salesItem?.versionKey;

    if (!itemVersionKey) {
      this.toastr.showError('No active version found');
      this.isSubmitting = false;
      return;
    }

    const groupLink = this.normalizeGroupLink(this.form.value.group_link);

    const data = {
      group_name: this.form.value.group_name.trim(),
      group_link: groupLink,
      group_order: this.salesItem?.group_order || this.nextOrder,
      versionKey: itemVersionKey,
      counter: this.salesItem?.counter || 0,
      whatsapp_number: this.salesItem?.whatsapp_number || ''
    };

    if (this.isEdit && this.salesItem?.id) {
      // Update
      this.firebaseService.update('sales', this.salesItem.id, data)
        .then(() => {
          this.toastr.showSuccess('WhatsApp group updated successfully');
          this.activeModal.close('updated');
        })
        .catch(error => {
          console.error('Error updating WhatsApp group:', error);
          this.toastr.showError('Failed to update WhatsApp group');
          this.isSubmitting = false;
        });
    } else {
      // Add
      this.firebaseService.add('sales', data)
        .then(() => {
          this.toastr.showSuccess('WhatsApp group added successfully');
          this.activeModal.close('added');
        })
        .catch(error => {
          console.error('Error adding WhatsApp group:', error);
          this.toastr.showError('Failed to add WhatsApp group');
          this.isSubmitting = false;
        });
    }
  }

  private normalizeGroupLink(value: string): string {
    const link = (value || '').trim();
    if (!link) return '';
    return /^https?:\/\//i.test(link) ? link : `https://${link}`;
  }
}
