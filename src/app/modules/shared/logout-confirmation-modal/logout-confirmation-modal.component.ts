import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-logout-confirmation-modal',
  templateUrl: './logout-confirmation-modal.component.html',
  styleUrls: ['./logout-confirmation-modal.component.css']
})
export class LogoutConfirmationModalComponent {
  constructor(public activeModal: NgbActiveModal) {}

  confirm() {
    this.activeModal.close(true);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
