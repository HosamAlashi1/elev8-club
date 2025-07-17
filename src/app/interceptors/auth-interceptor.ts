import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../modules/auth/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const data = JSON.parse(localStorage.getItem('Turbo-eat-data') || '{}');

    if (data?.access_token) {
      req = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${data.access_token}`)
      });
    }

    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (err: HttpErrorResponse) => {
          // الحالة الأولى: حالة HTTP 401
          if (err.status === 401) {
            this.authService.logout();
            return;
          }

          // الحالة الثانية: statusCode 401 داخل body
          const backendStatusCode = err?.error?.statusCode;
          if (backendStatusCode === 401) {
            this.authService.logout();
          }
        }
      })
    );
  }
}
