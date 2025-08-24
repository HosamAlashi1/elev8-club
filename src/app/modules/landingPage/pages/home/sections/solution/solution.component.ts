import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-solution',
  templateUrl: './solution.component.html',
  styleUrls: ['./solution.component.css']
})
export class SolutionComponent {
  @Input() title: string = 'Revolutionary Home Testing Solution';
  @Input() description: string = 'Our AI-powered system combines the convenience of at-home testing with professional medical expertise.';
  @Input() image: string = 'assets/img/testing.jpg';
  @Input() features: string[] = [
    'Professional-grade testing kits',
    'Instant AI analysis',
    'Direct connection with medical centers',
    'Secure and private results'
  ];
}
