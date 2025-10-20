import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiAdminService } from '../../services/api.admin.service';
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js';

const API_BASE_URL = `${environment.apiUrl}`;

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  isAuthLoading$: Observable<boolean>;
  isAuthLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private ApiAdminService: ApiAdminService
  ) {
    this.isAuthLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isAuthLoading$ = this.isAuthLoadingSubject.asObservable();
  }

  login(email: string, password: string, auth_type: string, fcm_token: string = '', device_id: string = ''): Observable<any> {
    this.isAuthLoadingSubject.next(true);
    return this.http.post<any>(`${API_BASE_URL}/Auth/login`, { email, password, auth_type, fcm_token, device_id }).pipe(
      tap({
        next: (res: any) => {
          if (res?.success === true && res?.data?.access_token) {
            // نجهز البايانات
            const payload = {
              user: res.data.data,
              token: res.data.access_token,
              permissions: res.data.permissions,
              device_id: device_id,
            };

            // تشفير قبل التخزين
            const encrypted = CryptoJS.AES.encrypt(
              JSON.stringify(payload),
              environment.cryptoKey
            ).toString();

            localStorage.setItem(`${environment.prefix}-data`, encrypted);
          }
        },
        error: (err: any) => (err)
      }),
      finalize(() => this.isAuthLoadingSubject.next(false))
    );
  }

  forget(email: string): Observable<any> {
    this.isAuthLoadingSubject.next(true);
    return this.http.post<any>(`${API_BASE_URL}/forget-password`, { email }).pipe(
      tap({
        next: (res: any) => res,
        error: (err: any) => err
      }),
      finalize(() => this.isAuthLoadingSubject.next(false))
    );
  }

  reset(id: string, password: string): Observable<any> {
    this.isAuthLoadingSubject.next(true);
    return this.http.post<any>(`${API_BASE_URL}/reset-password`, { id, password }).pipe(
      tap({
        next: (res: any) => res,
        error: (err: any) => err
      }),
      finalize(() => this.isAuthLoadingSubject.next(false))
    );
  }

  logout(): void {
    // جلب البيانات المشفّرة من localStorage
    const encrypted = localStorage.getItem(`${environment.prefix}-data`);

    let device_id = '';
    if (encrypted) {
      try {
        const bytes = CryptoJS.AES.decrypt(encrypted, environment.cryptoKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        const data = JSON.parse(decrypted);
        device_id = data?.device_id || '';
      } catch (e) {
        console.error('Error decrypting data in logout', e);
      }
    }

    // حتى لو ما قدرنا نقرأ → نمسح التخزين محلي
    localStorage.removeItem(`${environment.prefix}-data`);

    // نعمل call للـ API إذا في device_id
    if (device_id) {
      this.http.post(`${API_BASE_URL}/Auth/logout`, { device_id }).subscribe({
        next: () => this.router.navigate(['/auth/login']),
        error: () => this.router.navigate(['/auth/login'])
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
    this.router.navigate(['/auth/login']);
  }

}
