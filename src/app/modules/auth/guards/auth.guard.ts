import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard {

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) { }

  canActivate(): Observable<boolean | UrlTree> {
    return this.afAuth.authState.pipe(
      take(1),
      map(user => {
        const dashboardSession = localStorage.getItem('elev8-club-data');
        if (user && dashboardSession) return true;

        localStorage.removeItem('elev8-club-data');
        return this.router.createUrlTree(['/auth/login']);
      })
    );
  }
}
