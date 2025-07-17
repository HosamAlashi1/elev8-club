import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../../services/toater.service';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from 'src/app/modules/dash/services/api.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  form: FormGroup;
  submitted = false;

  constructor(
    public activeModal: NgbActiveModal,
    private toastr: ToastrsService,
    public httpService: HttpService,
    private api: ApiService
  ) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', Validators.required)
    });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.submitted = true;

    const newPass = this.f['newPassword'].value;
    const confirmPass = this.f['confirmPassword'].value;

    if (this.form.invalid || newPass !== confirmPass) {
      this.toastr.ShowWarning('Passwords do not match or are invalid');
      return;
    }

    const data = JSON.parse(localStorage.getItem('Turbo-eat-data') || '{}');
    const userId = data?.user?.id;

    if (!userId) {
      this.toastr.Showerror('User ID not found');
      return;
    }

    const formData = new FormData();
    formData.append('password', newPass);
    formData.append('password_confirmation', confirmPass);

    this.httpService.setLoading('changePassword', true);

    this.httpService.action(this.api.admin.edit(userId), formData, 'changePassword').subscribe({
      next: (res) => {
        this.httpService.setLoading('changePassword', false);
        // this.toastr.Showsuccess('Password changed successfully');
        this.activeModal.close(true);
      },
      error: () => {
        this.httpService.setLoading('changePassword', false);
        this.toastr.Showerror('Failed to change password');
      }
    });
  }

}
