import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { LandingAuthSessionService } from '../../services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private session: LandingAuthSessionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {

    // 🔸 1. نتأكد أن المستخدم مسجل دخول
    const user = this.session.user;
    if (!this.session.isLoggedIn || !user) {
      return this.router.parseUrl('/auth-audio-portal/login');
    }

    // 🔸 2. نجيب الأدوار المطلوبة من الـ route
    const allowedRoles = route.data['roles'] as number[]; 
    // auth_type:
    // 2 = Author | 3 = Editor | 4 = Customer

    // 🔸 3. نتحقق هل المستخدم من ضمن الأدوار المسموح فيها
    if (allowedRoles && allowedRoles.length > 0) {
      const hasAccess = allowedRoles.includes(user.auth_type);
      if (!hasAccess) {
        // نقدر نرجعه لصفحة مناسبة حسب نوعه
        switch (user.auth_type) {
          case 2:
            return this.router.parseUrl('/audio-portal/author');
          case 3:
            return this.router.parseUrl('/audio-portal/editor');
          case 4:
            return this.router.parseUrl('/audio-portal/my-books');
          default:
            return this.router.parseUrl('/audio-portal');
        }
      }
    }

    //  إذا الدور صحيح، اسمح بالدخول
    return true;
  }
}
