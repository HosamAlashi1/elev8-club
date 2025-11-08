import { NotificationService } from './../../../shared/notifications/notification.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LandingAuthSessionService } from '../../../services/auth-session.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { AuthType } from 'src/app/core/enums/auth-type.enum';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LogoutConfirmationModalComponent } from 'src/app/modules/shared/logout-confirmation-modal/logout-confirmation-modal.component';
import { Observable } from 'rxjs';

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

  // 🧭 Notifications
  isNotificationsOpen = false;
  unreadCount$!: Observable<number>;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private session: LandingAuthSessionService,
    private modalService: NgbModal,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // 👤 متابعة حالة المستخدم
    this.session.auth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isLoggedIn = state.isLoggedIn;
        this.user = state.user;
        this.isAuthor = this.user?.auth_type === AuthType.Author;
      });

    // 🔔 إشعارات المستخدم
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.notificationService.refreshUnreadCount('user').subscribe();
  }

  toggleNotifications(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  logout(): void {
    const modalRef = this.modalService.open(LogoutConfirmationModalComponent, {
      size: 'md',
    });

    modalRef.result.then(
      (confirmed: boolean) => {
        if (confirmed) {
          this.session.logout();
          this.router.navigate(['/auth-audio-portal/login']);
        }
      },
      () => {
        // Dismissed
      }
    );
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
