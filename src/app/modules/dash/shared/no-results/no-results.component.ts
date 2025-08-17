import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-no-results',
  templateUrl: './no-results.component.html',
  styleUrls: ['./no-results.component.css']
})
export class NoResultsComponent {

  @Input() isLoading$: Observable<boolean>;
  @Input() totalRecords: number;
}
