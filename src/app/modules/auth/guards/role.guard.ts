import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { PublicService } from '../../services/public.service';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private publicService: PublicService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const sessionData = this.publicService.getUserData();

    if (!sessionData) {
      this.authService.SignOut();
      return false;
    }

    const userRole = sessionData.role || '';
    const allowedRoles: string[] = route.data['roles'] || ['admin'];

    if (allowedRoles.includes(userRole)) {
      return true;
    }

    // Redirect to dashboard home if not allowed
    this.router.navigate(['/dashboard']);
    return false;
  }
}
