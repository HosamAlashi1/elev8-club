import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view-map',
  templateUrl: './view-map.component.html',
  styleUrls: ['./view-map.component.scss']
})
export class ViewMapComponent {
  @Input() location: { lat: number, lng: number, firstAddress: string, secondAddress: string };
  
  constructor(public activeModal: NgbActiveModal) {}
}
