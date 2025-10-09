import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { LandingAuthSessionService } from '../../services/auth-session.service';
import { LandingAccountModalComponent } from '../shared/account/landing-account-modal/landing-account-modal.component';

@Injectable({ providedIn: 'root' })
export class LandingAuthGuard implements CanActivate {

  constructor(
    private session: LandingAuthSessionService,
    private router: Router,
    private modal: NgbModal
  ) {}

  canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    if (this.session.isLoggedIn) {
      return true;
    }

    // ✨ المستخدم مش مسجل دخول → نفتح المودال بدل التحويل
    const modalRef = this.modal.open(LandingAccountModalComponent, {
      centered: true,
      size: 'xl'
    });
    modalRef.componentInstance.initialTab = 'login';
    modalRef.componentInstance.defaultAuthType = 4;

    // Option 1: نرجّع false علشان ما يدخل على الصفحة
    return false;
  }
}
