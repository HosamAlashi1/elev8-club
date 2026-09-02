import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { PublicService } from '../../../services/public.service';
import { LogoutConfirmationModalComponent } from '../../../shared/logout-confirmation-modal/logout-confirmation-modal.component';
import { SupportChatService } from '../../../services/support-chat.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  user: any;
  userRoleLabel: string = 'Admin';
  unreadCount$: Observable<number>;
  isAdmin = false;

  private readonly roleLabelMap: Record<string, string> = {
    admin: 'Admin',
    sales: 'Sales',
    account_manager: 'Account Manager',
    affiliate: 'Affiliate'
  };

  constructor(
    private authService: AuthService,
    private publicService: PublicService,
    private supportChat: SupportChatService,
    private modalService: NgbModal
  ) {
    this.user = this.publicService.getUserData();
    this.userRoleLabel = this.roleLabelMap[this.publicService.getUserRole()] || 'Admin';
    this.isAdmin = this.publicService.isAdmin();
    this.unreadCount$ = this.supportChat.unreadAdminCount$;

  }

  logout() {
    const modalRef = this.modalService.open(LogoutConfirmationModalComponent, {
      size: 'md'
    });

    modalRef.result.then(
      (confirmed) => {
        if (confirmed) {
          this.authService.SignOut();
        }
      },
      () => {
        // dismissed
      }
    );
  }
}
