import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-error503',
  templateUrl: './error503.component.html',
  styleUrls: ['./error503.component.css']
})
export class Error503Component {

  constructor(private router: Router, private appComponent: AppComponent) { }

  relode() {
    if (this.appComponent.previousUrl) {
      this.router.navigateByUrl(this.appComponent.previousUrl);
    } else {
      // fallback in case previousUrl is not available
      this.router.navigate(['/']); // or any safe fallback route
    }
  }

}
