import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-preview-modal',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewModalComponent {
  @Input() file: any;

  constructor(public activeModal: NgbActiveModal) {}

  replaceFile() {
    // منطق الاستبدال: ممكن تفتح مودال الرفع أو تبعت Event
    this.activeModal.close({ action: 'replace', file: this.file });
  }
}
