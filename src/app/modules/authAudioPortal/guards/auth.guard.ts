import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { LandingAuthSessionService } from '../../services/auth-session.service';
import { AuthType } from 'src/app/core/enums/auth-type.enum';

@Injectable({ providedIn: 'root' })
export class AudioPortalAuthGuard implements CanActivate {

  constructor(
    private session: LandingAuthSessionService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {

    const isLoggedIn = this.session.isLoggedIn || (this.session.snapshot?.isLoggedIn && this.session.snapshot.token);
    const user = this.session.user;

    // الحالة 1: المستخدم داخل وبيحاول يفتح صفحة اللوجن
    if (isLoggedIn && state.url.startsWith('/auth-audio-portal')) {
      this.router.navigate(['/audio-portal/my-books']);
      return false;
    }

    // الحالة 2: المستخدم مش داخل
    if (!isLoggedIn || !user) {
      this.router.navigate(['/auth-audio-portal/login'], {
        queryParams: { redirect: state.url }
      });
      return false;
    }

    // الحالة 3: تحقق من الأدوار لو محددة في route.data
    const requiredRoles = route.data['roles'] as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = this.mapAuthTypeToRole(user.auth_type);
      if (!requiredRoles.includes(userRole)) {
        // رفض الوصول وتحويل المستخدم
        this.router.navigate(['/audio-portal/my-books']);
        return false;
      }
    }

    // الحالة 4: المستخدم داخل ومسموح له بالدخول
    return true;
  }

  private mapAuthTypeToRole(authType: AuthType): string {
    switch (authType) {
      case AuthType.Admin: return 'Admin';
      case AuthType.Author: return 'Author';
      case AuthType.Editor: return 'Editor';
      case AuthType.Customer: return 'Customer';
      default: return '';
    }
  }
}
