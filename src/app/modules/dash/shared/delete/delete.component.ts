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
  ) { }

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
        url = this.api.admins.delete(this.id);
        break;
        case 'category':
        url = this.api.categories.delete(this.id);
        break;
      case 'testimonials':
        url = this.api.testimonials.delete(this.id);
        break;
      default:
        this.showMsg(false, 'نوع غير مدعوم!');
        return;
    }

    this.httpService.action(url, data, 'deleteAction').subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.alertMessage = res.msg;
          this.messageType = 'success';
          this.changeDetectorRef.detectChanges();

          setTimeout(() => {
            this.activeModal.close('deleted');
          }, 500);
        } else {
          this.showMsg(false, res?.msg || 'Operation failed');
        }
      },
      error: () => this.showMsg(false, 'Error occurred. Please try again.')
    });
  }

}
