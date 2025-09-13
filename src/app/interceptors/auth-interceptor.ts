import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../modules/auth/services/auth.service';
import { Router } from '@angular/router';
import { PublicService } from '../modules/services/public.service'; // استدعاء السيرفس

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router,
    private publicService: PublicService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // جلب التوكن المفكوك
    const token = this.publicService.getToken();

    if (token) {
      req = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (err: HttpErrorResponse) => {
          // 1. تجاهل أخطاء logout نفسه
          if (req.url.includes('/Auth/logout')) {
            return;
          }

          // 2. لو 401 → اعمل logout بشرط ما أكون في صفحة login
          if (err.status === 401 && this.router.url !== '/auth/login') {
            this.authService.logout();
            return;
          }

          // 3. backend response الجديد (success + msg)
          const backendSuccess = err?.error?.success;
          const backendMsg = err?.error?.msg;

          if (backendSuccess === false && backendMsg?.toLowerCase().includes('unauth') && this.router.url !== '/auth/login') {
            this.authService.logout();
            return;
          }

          // 4. دعم statusCode القديم لو موجود
          const backendStatusCode = err?.error?.statusCode;
          if (backendStatusCode === 401 && this.router.url !== '/auth/login') {
            this.authService.logout();
          }
        }
      })
    );
  }
}
