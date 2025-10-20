import { Component } from '@angular/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css', './animations.component.css'],
})
export class AuthComponent {
  currentYear: number;
  
  constructor() {
    this.currentYear = new Date().getFullYear();
  }
}
