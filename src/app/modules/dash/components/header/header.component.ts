import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { PublicService } from '../../../services/public.service';
import { NotificationService } from '../../../shared/notifications/notification.service';
import { LogoutConfirmationModalComponent } from '../../../shared/logout-confirmation-modal/logout-confirmation-modal.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  user: any;
  isNotificationsOpen = false;
  unreadCount$: Observable<number>;

  constructor(
    private authService: AuthService,
    private publicService: PublicService,
    private notificationService: NotificationService,
    private modalService: NgbModal
  ) {
    this.user = this.publicService.getUserData();
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    // Load unread count for admin
    this.notificationService.refreshUnreadCount('admin').subscribe();
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  logout() {
    const modalRef = this.modalService.open(LogoutConfirmationModalComponent, {
      size: 'md'
    });

    modalRef.result.then(
      (confirmed) => {
        if (confirmed) {
          this.authService.logout();
        }
      },
      () => {
        // dismissed
      }
    );
  }
}
