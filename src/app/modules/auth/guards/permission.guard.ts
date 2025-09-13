import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PublicService } from '../../services/public.service';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {

  constructor(
    private publicService: PublicService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'] as string | string[];

    // لو ما في يوزر أو توكن → logout
    const token = this.publicService.getToken();
    if (!token) {
      this.authService.logout();
      return false;
    }

    // لو permission undefined → اعتبره مفتوح
    if (!requiredPermission) {
      return true;
    }

    // فحص الصلاحيات
    if (Array.isArray(requiredPermission)) {
      if (this.publicService.hasAnyPermission(requiredPermission)) {
        return true;
      }
    } else {
      if (this.publicService.hasPermission(requiredPermission)) {
        return true;
      }
    }

    // لو ما عنده صلاحية → رجعه على dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
