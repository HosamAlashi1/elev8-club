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

    // 🔹 لو ما في توكن → سجل خروج
    const token = this.publicService.getToken();
    if (!token) {
      this.authService.logout();
      return false;
    }

    // 🔹 لو ما في صلاحية مطلوبة، اعتبرها مفتوحة
    if (!requiredPermission) {
      return true;
    }

    // 🔹 لو كانت مصفوفة → لازم يملك واحدة منها على الأقل
    if (Array.isArray(requiredPermission)) {
      const hasAny = this.publicService.hasAnyPermission(requiredPermission);
      if (hasAny) return true;
    }
    // 🔹 لو قيمة مفردة
    else if (this.publicService.hasPermission(requiredPermission)) {
      return true;
    }

    // 🔹 لو ما عنده أي صلاحية مطلوبة → رجعه للداشبورد
    this.router.navigate(['/dashboard']);
    return false;
  }
}
