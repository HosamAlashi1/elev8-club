import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-admin',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditAdminComponent implements OnInit {

  @Input() admin: any;
  @Input() adminId?: number;

  form!: FormGroup;
  submitted = false;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;

  roles: any[] = [];

  get isEdit(): boolean {
    return !!(this.admin?.id || this.adminId);
  }

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private toastr: ToastrsService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadRoles();

    // في حالة التعديل: جيب التفاصيل لو ما وصلك داتا كاملة
    if (this.isEdit) {
      const id = this.admin?.id || this.adminId!;
      if (this.admin && this.admin.first_name) {
        this.patchForm(this.admin);
      } else {
        this.httpService.listGet(this.api.admins.details(id), 'admin-details').subscribe({
          next: (res: any) => {
            if (res?.success && res?.data) {
              this.patchForm(res.data);
            } else {
              this.toastr.showError(res?.msg || 'Failed to load admin details');
            }
          },
          error: () => this.toastr.showError('Failed to load admin details')
        });
      }
    }
  }

  get f() { return this.form.controls; }

  initForm() {
    this.form = new FormGroup({
      first_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      middle_name: new FormControl('', [Validators.maxLength(100)]),
      last_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(190)]),
      phone: new FormControl('', [Validators.maxLength(30)]),
      password: new FormControl('', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]),
      role_id: new FormControl(null, [Validators.required]),
      file: new FormControl(null, this.isEdit ? [] : [Validators.required])
    });
  }

  patchForm(a: any) {
    this.form.patchValue({
      first_name: a.first_name || '',
      middle_name: a.middle_name || '',
      last_name: a.last_name || '',
      email: a.email || '',
      phone: a.phone || '',
      role_id: this.findRoleIdByName(a.role),
      file: null
    });
    if (a.image) this.imagePreview = a.image;
  }

  private findRoleIdByName(roleName?: string): number | null {
    if (!roleName) return null;
    const found = this.roles.find(r => r.name.toLowerCase() === String(roleName).toLowerCase());
    return found ? found.id : null;
  }

  loadRoles() {
    this.httpService.listGet(this.api.roles.list, 'roles-list').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data?.data) {
          this.roles = res.data.data;
        } else {
          this.toastr.showError(res?.msg || 'Failed to load roles');
        }
      },
      error: () => this.toastr.showError('Failed to load roles')
    });
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const fd = new FormData();
    fd.append('first_name', String(this.form.value.first_name).trim());
    fd.append('middle_name', String(this.form.value.middle_name || '').trim());
    fd.append('last_name', String(this.form.value.last_name).trim());
    fd.append('email', String(this.form.value.email).trim());
    fd.append('phone', String(this.form.value.phone || '').trim());
    fd.append('role_id', String(this.form.value.role_id));

    if (!this.isEdit || this.form.value.password) {
      fd.append('password', String(this.form.value.password || ''));
    }

    if (this.selectedFile) {
      fd.append('file', this.selectedFile);
    }

    const url = this.isEdit
      ? this.api.admins.edit(this.admin?.id || this.adminId!)
      : this.api.admins.add;

    this.httpService.action(url, fd, 'addEditAdmin').subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastr.showSuccess(res?.msg || (this.isEdit ? 'Admin updated successfully' : 'Admin added successfully'));
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

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragOver = false;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) this.handleFile(e.dataTransfer.files[0]);
  }
  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.handleFile(file);
  }
  private handleFile(file: File) {
    this.selectedFile = file;
    this.form.patchValue({ file });
    const reader = new FileReader();
    reader.onload = (ev: any) => this.imagePreview = ev.target.result;
    reader.readAsDataURL(file);
  }
}
