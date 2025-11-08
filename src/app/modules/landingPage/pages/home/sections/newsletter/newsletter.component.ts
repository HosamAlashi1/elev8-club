
import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiLandingService } from 'src/app/modules/services/api.landing.service';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.css']
})
export class NewsletterComponent {
  @Input() title: string = 'Join Our Literary Community';
  @Input() subtitle: string = 'Subscribe to receive new releases, author events, special offers, and exclusive content.';

  email: string = '';
  isLoading = false;
  message: string | null = null;
  isSuccess = false;

  constructor(
    private http: HttpClient,
    private api: ApiLandingService
  ) {}

  subscribe() {
    if (!this.email || !this.email.includes('@')) {
      this.message = 'Please enter a valid email address.';
      this.isSuccess = false;
      return;
    }

    this.isLoading = true;
    this.message = null;

    this.http.post(this.api.home.subscribe, { email: this.email }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isSuccess = res.status;
        this.message = res.message;
        if (res.status) this.email = '';
      },
      error: () => {
        this.isLoading = false;
        this.isSuccess = false;
        this.message = 'Something went wrong. Please try again.';
      }
    });
  }
}
