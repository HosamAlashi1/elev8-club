import { PublicService } from 'src/app/modules/services/public.service';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../modules/auth/services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router,private publicService :PublicService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
   const token = this.publicService.getAuthToken();

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
          if (req.url.includes('/logout')) {
            return;
          }

          // 2. لو 401 → اعمل logout بشرط ما أكون في صفحة login
          if (err.status === 401 && this.router.url !== '/login') {
            this.authService.logout();
            return;
          }

          // 3. backend response الجديد
          const backendStatus = err?.error?.status;
          const backendMessage = err?.error?.message;
          if (backendStatus === false && backendMessage?.toLowerCase().includes('unauth') && this.router.url !== '/login') {
            this.authService.logout();
            return;
          }

          // 4. دعم statusCode 401 القديم
          const backendStatusCode = err?.error?.statusCode;
          if (backendStatusCode === 401 && this.router.url !== '/login') {
            this.authService.logout();
          }
        }
      })
    );
  }
}
