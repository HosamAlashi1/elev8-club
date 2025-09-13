import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {

  options = {
    path: '/assets/json/book-animation.json',
    autoplay: true
  };
}
