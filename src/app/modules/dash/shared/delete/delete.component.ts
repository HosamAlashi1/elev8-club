import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../services/http.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.css']
})
export class DeleteComponent {

  public id: number;
  public comment_id: number;
  public type: string;
  public message: string;
  alertMessage: string;
  messageType: string;

  constructor(public activeModal: NgbActiveModal, public httpService: HttpService, private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  showMsg(success: boolean, msg: string) {
    this.alertMessage = msg;
    this.messageType = success ? 'success' : 'danger';
    this.changeDetectorRef.detectChanges();
  }

  delete() {
    let url: string = '';
    let data: any = {};

    switch (this.type) {
      case 'user':
        url = this.api.user.delete(this.id);
        break;
      case 'admin':
        url = this.api.admin.delete(this.id);
        break;
      case 'category':
        url = this.api.category.delete(this.id);
        break;
      case 'meal':
        url = this.api.meal.delete(this.id);
        break;
      case 'restaurant':
        url = this.api.restaurants.delete(this.id);
        break;
      case 'role':
        url = this.api.roles.delete(this.id);
        break;
      case 'option':
        url = this.api.options.delete(this.id);
        break;
    }

    this.httpService.action(url, data, 'deleteAction').subscribe({
      next: (res: any) => {
        if (res.status) {
          this.alertMessage = res.message;
          this.messageType = 'success';
          this.changeDetectorRef.detectChanges();

          setTimeout(() => {
            this.activeModal.close('deleted');
          }, 500); // نصف ثانية تكفي لإظهار الرسالة
        } else {
          this.showMsg(false, res.message);
        }
      }

    });
  }
}
