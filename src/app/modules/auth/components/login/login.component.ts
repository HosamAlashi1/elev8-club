import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrsService } from '../../../services/toater.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {

  form: ReturnType<FormBuilder['group']>;
  uiState = signal({
    submitted: false,
    message: '',
    type: 'success' as 'success' | 'danger'
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public authService: AuthService,
    private toast: ToastrsService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() {
    return this.form.controls;
  }

  showMsg(success: boolean, msg: string) {
    this.uiState.update(state => ({
      ...state,
      message: msg,
      type: success ? 'success' : 'danger'
    }));
  }

  submit() {
    this.uiState.update(state => ({ ...state, submitted: true }));

    if (this.form.valid) {
      const { email, password } = this.form.value;
      this.showMsg(false, '');

      this.authService.login(email, password).subscribe({
        next: (res: any) => {
          if (res?.status === true && res?.data?.token) {
            // Save user and token in localStorage
            localStorage.setItem('EDKD-data', JSON.stringify({
              user: res.data.user,
              token: res.data.token
            }));
            this.router.navigate(['/dashboard']);
          } else {
            this.showMsg(false, res?.message ?? 'Login failed');
          }
        },
        error: (err: any) => {
          if (err.status === 422) {
            this.showMsg(false, 'The credentials you entered are incorrect.');
          } else if (err?.error?.message) {
            this.showMsg(false, err.error.message);
          } else {
            this.showMsg(false, 'Something went wrong. Please try again.');
          }
        }
      });
    }
  }


}
