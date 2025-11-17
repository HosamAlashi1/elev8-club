import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-big-cta-section',
  templateUrl: './big-cta-section.component.html',
  styleUrls: ['./big-cta-section.component.css']
})
export class BigCtaSectionComponent {
  @Input() onOpenRegistration!: () => void;

  particles: number[] = Array.from({ length: 20 }, (_, i) => i);
}
