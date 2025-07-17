import { Component } from '@angular/core';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css'],
})
export class ErrorComponent {

  options = {
    path: '/assets/json/error.json',
    autoplay: true,
    loop: true
  };

  
}
