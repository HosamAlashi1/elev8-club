import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { ToastrsService } from '../../../../services/toater.service';

@Component({
  selector: 'app-add-edit-user',
  templateUrl: './add-edit.component.html',
  styleUrls: ['./add-edit.component.css']
})
export class AddEditComponent implements OnInit {

  public user: any;
  form: FormGroup;
  submitted = false;
  selectedFile: File | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private toastrsService: ToastrsService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  // Custom validators
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
      email: new FormControl(this.user?.email || '', [Validators.required, Validators.email]),
      password: new FormControl('', this.user ? [] : [Validators.required, Validators.minLength(6)]),
      password_confirmation: new FormControl('', this.user ? [] : Validators.required),
      image: new FormControl(null)
    }, this.passwordMatchValidator.bind(this));
  }

  submit() {
    this.submitted = true;
    if (this.form.valid) {
      const formData = new FormData();
      formData.append('name', this.form.value.name);
      formData.append('email', this.form.value.email);

      // Add password fields for new users or when password is provided
      if (!this.user || this.form.value.password) {
        formData.append('password', this.form.value.password);
      }

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const url = this.user ? this.api.admin.edit(this.user.id) : this.api.admin.add;
      this.httpService.action(url, formData, 'addEditUser').subscribe({
        next: (res: any) => {
          if (res.status) {
            this.toastrsService.showSuccess(res.message || 'Operation completed successfully');
            this.activeModal.close(true);
          } else {
            this.toastrsService.showError(res.message || 'Operation failed');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          const errorMessage = error?.error?.message || error?.message || 'Operation failed';
          this.toastrsService.showError(errorMessage);
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

}
