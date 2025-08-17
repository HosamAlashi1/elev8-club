import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent {

  @Input() title: string;
  @Input() message: string;
  @Input() btnOkText: string;
  @Input() btnOkIcon: string;
  @Input() btnOkClass: string;
  @Input() btnCancelText: string;
  @Input() btnCancelClass: string;

  constructor(public activeModal: NgbActiveModal) { }
}
