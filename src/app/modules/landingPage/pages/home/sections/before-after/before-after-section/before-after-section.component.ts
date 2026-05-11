import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-before-after-section',
  templateUrl: './before-after-section.component.html',
  styleUrls: ['./before-after-section.component.css']
})
export class BeforeAfterSectionComponent {
  @Input() onOpenRegistration!: () => void;
}
