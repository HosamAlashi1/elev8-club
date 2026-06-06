import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-why-free-section',
  templateUrl: './why-free-section.component.html',
  styleUrls: ['./why-free-section.component.css']
})
export class WhyFreeSectionComponent {
  @Input() onOpenRegistration!: () => void;
}
