import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-top-progress-bar',
  templateUrl: './top-progress-bar.component.html',
  styleUrls: ['./top-progress-bar.component.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class TopProgressBarComponent implements OnInit {
  progressValue = 70;

  constructor() { }

  ngOnInit(): void {
  }

}
