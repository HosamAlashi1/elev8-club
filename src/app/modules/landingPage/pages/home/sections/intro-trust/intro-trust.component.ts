import { Component, Input } from '@angular/core';

export interface TrustItem {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-intro-trust',
  templateUrl: './intro-trust.component.html',
  styleUrls: ['./intro-trust.component.css']
})
export class IntroTrustComponent {
  @Input() sectionTitle: string = 'Trusted Publishing Services';
  @Input() sectionDescription: string = 'Trusted for 100+ Years';
  @Input() items: TrustItem[] = [];
}
