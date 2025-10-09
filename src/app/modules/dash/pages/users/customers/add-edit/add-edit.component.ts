import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../../services/http.service';
import { ApiAdminService } from '../../../../../services/api.admin.service';
import { ToastrsService } from '../../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-user',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditCustomerComponent implements OnInit {

  @Input() customer: any; // في حالة التعديل
  form!: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;

  get isEdit(): boolean {
    return !!this.customer?.id;
  }

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiAdminService,
    private toastr: ToastrsService
  ) {}

  ngOnInit() {
    this.initForm();

    if (this.isEdit) {
      this.httpService.listGet(this.api.users.details(this.customer.id), 'user-details').subscribe({
        next: (res: any) => {
          if (res?.success && res?.data) {
            this.patchForm(res.data);
          } else {
            this.toastr.showError(res?.msg || 'Failed to load user');
          }
        },
        error: () => this.toastr.showError('Failed to load user')
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      first_name: new FormControl(this.customer?.first_name || '', [Validators.required, Validators.maxLength(190)]),
      middle_name: new FormControl(this.customer?.middle_name || '', [Validators.maxLength(190)]),
      last_name: new FormControl(this.customer?.last_name || '', [Validators.required, Validators.maxLength(190)]),
      email: new FormControl(this.customer?.email || '', [Validators.required, Validators.email, Validators.maxLength(190)]),
      phone: new FormControl(this.customer?.phone || '', [Validators.required, Validators.maxLength(30)]),
      password: new FormControl('', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]),
      file: new FormControl(null, this.isEdit ? [] : [Validators.required]) // مطلوب فقط عند الإضافة
    });
  }

  patchForm(u: any) {
    this.form.patchValue({
      first_name: u.first_name || '',
      middle_name: u.middle_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      file: null
    });
    if (u.image) {
      this.imagePreview = u.image;
    }
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const formData = new FormData();
    formData.append('first_name', String(this.form.value.first_name).trim());
    formData.append('middle_name', String(this.form.value.middle_name || '').trim());
    formData.append('last_name', String(this.form.value.last_name).trim());
    formData.append('email', String(this.form.value.email).trim());
    formData.append('phone', String(this.form.value.phone).trim());
    formData.append('auth_type', '4'); // دايمًا 4

    if (!this.isEdit || this.form.value.password) {
      formData.append('password', String(this.form.value.password));
    }

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    const url = this.isEdit
      ? this.api.users.edit(this.customer.id)
      : this.api.users.add;

    this.httpService.action(url, formData, 'addEditUser').subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastr.showSuccess(res?.msg || 'Customer saved successfully');
          this.activeModal.close(true);
        } else {
          this.toastr.showError(res?.msg || 'Operation failed');
        }
      },
      error: (error: any) => {
        const msg = error?.error?.msg || error?.message || 'Operation failed';
        this.toastr.showError(msg);
      }
    });
  }

  // 📂 File Handling
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files?.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }
  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File) {
    this.selectedFile = file;
    this.form.patchValue({ file });
    const reader = new FileReader();
    reader.onload = (e: any) => (this.imagePreview = e.target.result);
    reader.readAsDataURL(file);
  }
}
