import { Component } from '@angular/core';

@Component({
  selector: 'app-solution',
  templateUrl: './solution.component.html',
  styleUrls: ['./solution.component.css']
})
export class SolutionComponent {

  solutionData = {
    title: 'Revolutionary Home Testing Solution',
    description: `Our AI-powered system combines the convenience of at-home 
    testing with professional medical expertise. Using advanced image recognition 
    technology, we analyze your test results instantly and connect you with certified medical centers.`,
    image: 'assets/img/testing.jpg',
    features: [
      'Professional-grade testing kits',
      'Instant AI analysis',
      'Direct connection with medical centers',
      'Secure and private results'
    ]
  };

}
