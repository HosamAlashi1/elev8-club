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

  showmessage(success: boolean, message: string) {
    this.uiState.update(state => ({
      ...state,
      message: message,
      type: success ? 'success' : 'danger'
    }));
  }

  submit() {
    this.uiState.update(state => ({ ...state, submitted: true }));

    if (this.form.valid) {
      const { email, password } = this.form.value;
      this.showmessage(false, '');

      this.authService.login(email, password ,1).subscribe({ // 1 for admin login , 2 for author , 3 for editor , 4 for customer login
        next: (res: any) => {
          if (res?.status === true && res?.data?.access_token) {
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
            this.showmessage(false, res?.message ?? 'Login failed');
          }
        },
        error: (err: any) => {
          if (err.status === 422) {
            this.showmessage(false, 'The credentials you entered are incorrect.');
          } else if (err?.response?.message) {
            this.showmessage(false, err.errormessage);
          } else {
            this.showmessage(false, 'Something went wrong. Please try again.');
          }
        }
      });
    }
  }

}
