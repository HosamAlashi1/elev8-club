import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrsService } from '../../../services/toater.service';
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js';

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
          if (res?.success === true && res?.data?.access_token) {
            // Prepare data
            const payload = {
              user: res.data.data,
              token: res.data.access_token,
              permissions: res.data.permissions
            };

            // Encrypt before saving
            const encrypted = CryptoJS.AES.encrypt(
              JSON.stringify(payload),
              environment.cryptoKey
            ).toString();

            localStorage.setItem(`${environment.prefix}-data`, encrypted);

            this.router.navigate(['/dashboard']);
          } else {
            this.showMsg(false, res?.msg ?? 'Login failed');
          }
        },
        error: (err: any) => {
          if (err.status === 422) {
            this.showMsg(false, 'The credentials you entered are incorrect.');
          } else if (err?.error?.msg) {
            this.showMsg(false, err.error.msg);
          } else {
            this.showMsg(false, 'Something went wrong. Please try again.');
          }
        }
      });
    }
  }

}
