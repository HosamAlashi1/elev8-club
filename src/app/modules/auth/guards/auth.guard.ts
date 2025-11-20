import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {

  constructor(private authService: AuthService) { }

  canActivate() {
    const currentUser = localStorage.getItem('elev8-club-data');
    if (currentUser) {
      return true;
    }

    this.authService.SignOut();
    return false; 
  }
}
