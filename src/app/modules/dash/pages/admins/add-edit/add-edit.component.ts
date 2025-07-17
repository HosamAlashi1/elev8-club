import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';
import { ToastrsService } from '../../../services/toater.service';

@Component({
  selector: 'app-add-edit-user',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public user: any;
  form: FormGroup;
  submitted = false;
  roles: any[] = [];
  selectedFile: File | null = null;
  isLoadingRoles = false;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private toastrsService: ToastrsService
  ) { }

  ngOnInit() {
    this.loadRoles();
    this.initForm();
  }

  // Custom validators
  private rolesArrayValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { required: true };
    }
    return null;
  }

  private passwordMatchValidator(group: AbstractControl): { [key: string]: any } | null {
    const formGroup = group as FormGroup;
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('password_confirmation')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      formGroup.get('password_confirmation')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      const confirmControl = formGroup.get('password_confirmation');
      if (confirmControl?.errors?.['passwordMismatch']) {
        delete confirmControl.errors['passwordMismatch'];
        if (Object.keys(confirmControl.errors).length === 0) {
          confirmControl.setErrors(null);
        }
      }
    }
    return null;
  }

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.form = new FormGroup({
      name: new FormControl(this.user?.name || '', Validators.required),
      username: new FormControl(this.user?.username || '', Validators.required),
      email: new FormControl(this.user?.email || '', [Validators.required, Validators.email]),
      password: new FormControl('', this.user ? [] : [Validators.required, Validators.minLength(6)]),
      password_confirmation: new FormControl('', this.user ? [] : Validators.required),
      roles: new FormControl([], this.rolesArrayValidator.bind(this)),
      status: new FormControl(this.user?.status || 'active', Validators.required),
      logo: new FormControl(null)
    }, this.passwordMatchValidator.bind(this));
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('name', this.form.value.name);
      formData.append('username', this.form.value.username);
      formData.append('email', this.form.value.email);
      formData.append('status', this.form.value.status);

      // Add password fields for new users or when password is provided
      if (!this.user || this.form.value.password) {
        formData.append('password', this.form.value.password);
        formData.append('password_confirmation', this.form.value.password_confirmation);
      }

      // Handle roles array (role_ids[])
      if (this.form.value.roles && Array.isArray(this.form.value.roles)) {
        this.form.value.roles.forEach((roleId: any, index: number) => {
          const id = typeof roleId === 'object' && roleId.id ? roleId.id : roleId;
          formData.append(`role_ids[${index}]`, id.toString());
        });
      }

      if (this.selectedFile) {
        formData.append('logo', this.selectedFile);
      }

      const url = this.user ? this.api.admin.edit(this.user.id) : this.api.admin.add;
      this.httpService.action(url, formData, 'addEditUser').subscribe({
        next: (res: any) => {
          if (res.success || res.status) {
            this.toastrsService.Showsuccess(res.msg || res.message || 'Operation completed successfully');
            this.activeModal.close(true);
          } else {
            this.toastrsService.Showerror(res.msg || res.message || 'Operation failed');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Operation failed';
          this.toastrsService.Showerror(errorMessage);
        }
      });
    }
  }


  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  loadRoles() {
    this.isLoadingRoles = true;
    const payload = {
      perPage: 100, // Get all roles
      page: 1
    };

    this.httpService.list(this.api.roles.list, payload, 'rolesList').subscribe({
      next: (res) => {
        if (res?.status && res?.items?.data) {
          this.roles = res.items.data.map((role: any) => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions
          }));
        }
        this.isLoadingRoles = false;
        this.updateFormWithUserRole(); // Update form with user role after roles are loaded
      },
      error: () => {
        this.toastrsService.Showerror('Failed to load roles');
        this.isLoadingRoles = false;
        // Fallback to static roles if API fails
        this.roles = [
          { id: 1, name: 'Administrator' },
          { id: 2, name: 'Manager' },
          { id: 3, name: 'Editor' }
        ];
        this.updateFormWithUserRole(); // Update form with user role even if static roles are used
      }
    });
  }

  updateFormWithUserRole() {
    if (this.user && this.user.roles && this.roles.length > 0) {
      // Extract role IDs from user.roles array
      const userRoleIds = this.user.roles.map((role: any) => role.id);
      this.form.patchValue({
        roles: userRoleIds
      });
    }
  }

}
