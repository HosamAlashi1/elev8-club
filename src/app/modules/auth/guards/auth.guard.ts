import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PublicService } from '../../services/public.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {

  constructor(private authService: AuthService, private publicService: PublicService) { }

  canActivate(): boolean {
    const user = this.publicService.getUserData();
    if (user) {
      return true;
    }
    this.authService.logout();
    return false;
  }

}
