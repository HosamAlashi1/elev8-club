import { Component, OnDestroy, OnInit } from '@angular/core';
import { LandingAuthSessionService } from '../../../services/auth-session.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { AuthType } from 'src/app/core/enums/auth-type.enum';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  user: any = null;
  isLoggedIn = false;
  isAuthor = false;
  AuthType = AuthType;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private session: LandingAuthSessionService
  ) {}

  ngOnInit(): void {
    // 👤 متابعة حالة المستخدم
    this.session.auth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isLoggedIn = state.isLoggedIn;
        this.user = state.user;
        this.isAuthor = this.user?.auth_type === AuthType.Author;
      });
  }

  logout(): void {
    this.session.logout();
    this.router.navigate(['/auth-audio-portal/login']);
  }

  getUserRoleLabel(): string {
    if (!this.user) return 'Guest';
    
    switch (this.user.auth_type) {
      case AuthType.Admin:
        return 'Administrator';
      case AuthType.Author:
        return 'Author';
      case AuthType.Editor:
        return 'Editor';
      case AuthType.Customer:
        return 'Customer';
      default:
        return 'User';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
