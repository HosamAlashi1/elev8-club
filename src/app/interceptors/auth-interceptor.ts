import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';
import { AuthService } from '../modules/auth/services/auth.service';
import { PublicService } from '../modules/services/public.service';
import { LandingAuthSessionService } from '../modules/services/auth-session.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService,
    private publicService: PublicService,
    private landingSession: LandingAuthSessionService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token: string | null = null;

    const currentUrl = this.router.url;

    const isDashboard = currentUrl.startsWith('/dashboard') || currentUrl.startsWith('/auth');

    const isLanding = currentUrl === '/' ||
                      currentUrl.startsWith('/shop') ||
                      currentUrl.startsWith('/cart') ||
                      currentUrl.startsWith('/shipping') ||
                      currentUrl.startsWith('/become-author') ||
                      currentUrl.startsWith('/featured-author') ||
                      currentUrl.startsWith('/author-events');

    if (isLanding) {
      token = this.landingSession.token ?? this.getLandingTokenFromStorage();
    } else if (isDashboard) {
      token = this.publicService.getToken();
    }

    if (token) {
      req = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (err: HttpErrorResponse) => {
          if (req.url.includes('/Auth/logout')) return;

          if (err.status === 401) {
            if (isLanding) {
              // 🧭 الزبون في واجهة الموقع
              this.landingSession.logout();
              // بإمكانك بدل الرجوع للصفحة الرئيسية تفتح مودال تسجيل دخول
              this.router.navigate(['/']);
            } else if (isDashboard) {
              // 🧭 موظف / مسؤول في لوحة التحكم
              this.authService.logout();
              this.router.navigate(['/auth/login']);
            }
          }
        }
      })
    );
  }

  private getLandingTokenFromStorage(): string | null {
    const key = `${environment.prefix}-landing-data`;
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, environment.cryptoKey).toString(CryptoJS.enc.Utf8);
      const data = JSON.parse(decrypted);
      return data?.token ?? null;
    } catch {
      return null;
    }
  }
}
