import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.css']
})
export class DeleteComponent {

  public id: number;
  public type: string;
  public message: string;
  alertMessage: string;
  messageType: string;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  showMsg(success: boolean, msg: string) {
    this.alertMessage = msg;
    this.messageType = success ? 'success' : 'danger';
    this.changeDetectorRef.detectChanges();
  }
delete() {
  let url: string = '';
  let data: any = {};

  switch (this.type) {
    case 'admin':
      url = this.api.admin.delete(this.id);
      break;
    case 'features':
      url = this.api.features.delete(this.id);
      break;
    case 'testimonials':
      url = this.api.testimonials.delete(this.id);
      break;
    case 'previews':
      url = this.api.previews.delete(this.id);
      break;
    case 'processes':
      url = this.api.processes.delete(this.id);
      break;
    default:
      this.showMsg(false, 'نوع غير مدعوم!');
      return;
  }

  this.httpService.action(url, data, 'deleteAction').subscribe({
    next: (res: any) => {
      if (res.status) {
        this.alertMessage = res.message;
        this.messageType = 'success';
        this.changeDetectorRef.detectChanges();

        setTimeout(() => {
          this.activeModal.close('deleted');
        }, 500);
      } else {
        this.showMsg(false, res.message);
      }
    },
    error: () => this.showMsg(false, 'حدث خطأ أثناء الحذف!')
  });
}

}
