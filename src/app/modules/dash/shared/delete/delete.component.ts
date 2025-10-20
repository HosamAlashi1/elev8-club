import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { ApiAdminService } from '../../../services/api.admin.service';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.css']
})
export class DeleteComponent {

  @Input() id: number;
  @Input() type: string;
  @Input() message: string;
  @Input() extraData: any; // ✅ إضافة جديدة

  alertMessage: string;
  messageType: string;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private apiAdmin: ApiAdminService,
    private apiPortal: ApiPortalService,
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
        url = this.apiAdmin.admins.delete(this.id);
        break;
      case 'category':
        url = this.apiAdmin.categories.delete(this.id);
        break;
      case 'book':
        url = this.apiAdmin.books.delete(this.id);
        break;
      case 'book-delete-all':
        url = this.apiAdmin.books.delete_all;
        data = this.extraData || {};
        break;
      case 'user':
        url = this.apiAdmin.users.delete(this.id);
        break;
      case 'files':
        url = this.apiAdmin.files.delete(this.id);
        break;
      case 'testimonials':
        url = this.apiAdmin.testimonials.delete(this.id);
        break;
      case 'chapter':
        url = this.apiPortal.chapters.delete(this.id);
        break;
      case 'paragraph':
        url = this.apiPortal.paragraphs.delete(this.id);
        break;
      case 'note':
        url = this.apiPortal.notes.delete(this.id);
        break;
      default:
        this.showMsg(false, 'Invalid delete type');
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
