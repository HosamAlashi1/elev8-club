import { Component } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { PublicService } from '../../../services/public.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  user: any;

  constructor(
    private authService: AuthService,
    private publicService: PublicService
  ) {
    this.user = this.publicService.getUserData();
  }

  logout() {
    this.authService.logout();
  }
}
