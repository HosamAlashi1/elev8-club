import { PublicService } from './../../../services/public.service';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LandingAuthSessionService } from 'src/app/modules/services/auth-session.service';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  form: ReturnType<FormBuilder['group']>;
  showPassword = false;
  selectedRole = 4;
  isLoading = false;
  rememberMe = false; //  حالة التذكّر

  uiState = signal({
    submitted: false,
    message: '',
    type: 'success' as 'success' | 'danger',
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public session: LandingAuthSessionService,
    public publicService: PublicService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      auth_type: [this.selectedRole],
    });

    //  تحميل بيانات محفوظة لو كانت موجودة
    const savedData = localStorage.getItem(`${environment.prefix}-remember-me`);
    if (savedData) {
      try {
        const decrypted = CryptoJS.AES.decrypt(savedData, environment.cryptoKey).toString(CryptoJS.enc.Utf8);
        const credentials = JSON.parse(decrypted);
        if (credentials.email && credentials.password) {
          this.form.patchValue({
            email: credentials.email,
            password: credentials.password,
          });
          this.rememberMe = true;
        }
      } catch {
        // بيانات تالفة، احذفها
        localStorage.removeItem(`${environment.prefix}-remember-me`);
      }
    }
  }

  get f() {
    return this.form.controls;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  setRole(role: number) {
    this.selectedRole = role;
    this.form.patchValue({ auth_type: role });
  }

  showMsg(success: boolean, msg: string) {
    this.uiState.update((state) => ({
      ...state,
      message: msg,
      type: success ? 'success' : 'danger',
    }));
  }

  toggleRemember(event: any) {
    this.rememberMe = event.target.checked;
  }

  async submit() {
    this.uiState.update((state) => ({ ...state, submitted: true }));
    if (this.form.invalid) return;

    const fcm_token = await this.publicService.getFCMToken();
    const device_id = this.publicService.getDeviceId();

    const { email, password, auth_type } = this.form.value as any;
    this.showMsg(false, '');
    this.isLoading = true;

    this.session.login(email, password, Number(auth_type || 4), fcm_token || '', device_id).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res?.success === true && res?.data?.access_token) {
          if (this.rememberMe) {
            const data = { email, password };
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), environment.cryptoKey).toString();
            localStorage.setItem(`${environment.prefix}-remember-me`, encrypted);
          } else {
            localStorage.removeItem(`${environment.prefix}-remember-me`);
          }
          const userType = res?.data?.data?.auth_type;
          

          if (userType == 3 || userType == 2) { // Editor
            this.router.navigate(['/audio-portal/my-projects']);
          } else {
            this.router.navigate(['/audio-portal/my-books']);
          }

        } else {
          this.showMsg(false, res?.msg || 'Login failed');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.showMsg(false, err?.error?.msg || 'Something went wrong. Please try again.');
      }
    });
  }
}
