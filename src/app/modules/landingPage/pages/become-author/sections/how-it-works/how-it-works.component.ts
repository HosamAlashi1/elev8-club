import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css']
})
export class HowItWorksComponent {
  @Input() title!: string;
  @Input() items: { icon: string; title: string; desc: string }[] = [];
}
