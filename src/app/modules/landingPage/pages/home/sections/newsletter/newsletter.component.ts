import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.css']
})
export class NewsletterComponent {
  @Input() title: string = 'Join Our Literary Community';
  @Input() subtitle: string = 'Subscribe to receive new releases, author events, special offers, and exclusive content.';
}
