import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PublicService } from '../../services/public.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private publicService: PublicService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = this.publicService.getAuthToken();

    if (token) {
      return true;
    }

    this.authService.logout();
    return false;
  }
}

