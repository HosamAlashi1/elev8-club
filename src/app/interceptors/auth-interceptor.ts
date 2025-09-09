import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../modules/auth/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const data = JSON.parse(localStorage.getItem('Dorrance-data') || '{}');
    // دعم شكل الرسبونس الجديد: { user, token } داخل data
    const token = data?.token || data?.data?.token;
    if (token) {
      req = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (err: HttpErrorResponse) => {
          // الحالة الأولى: حالة HTTP 401 من الهيدر
          if (err.status === 401) {
            this.authService.logout();
            return;
          }

          // الحالة الثانية: status 401 أو رسالة انتهاء الجلسة من body حسب شكل الرسبونس الجديد
          const backendStatus = err?.error?.status;
          const backendMessage = err?.error?.message;
          if (backendStatus === false && backendMessage && backendMessage.toLowerCase().includes('unauth')) {
            this.authService.logout();
            return;
          }
          // دعم statusCode 401 القديم
          const backendStatusCode = err?.error?.statusCode;
          if (backendStatusCode === 401) {
            this.authService.logout();
          }
        }
      })
    );
  }
}
