import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { ApiAdminService } from '../../../services/api.admin.service';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.css']
})
export class DeleteComponent {

  @Input() id: number;
  @Input() type: string;
  @Input() message: string;
  @Input() extraData: any;
  @Input() firebaseKey: string; // للـ Firebase items

  alertMessage: string;
  messageType: string;
  isDeleting = false;

  constructor(
    public activeModal: NgbActiveModal,
    public httpService: HttpService,
    private apiAdmin: ApiAdminService,
    private firebaseService: FirebaseService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  showmessage(success: boolean, message: string) {
    this.alertMessage = message;
    this.messageType = success ? 'success' : 'danger';
    this.changeDetectorRef.detectChanges();
  }

  delete() {
    // Handle Firebase types
    if (this.type === 'affiliate' || this.type === 'lead') {
      this.deleteFromFirebase();
      return;
    }

    // Handle HTTP types
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
      default:
        this.showmessage(false, 'Invalid delete type');
        return;
    }

    this.httpService.action(url, data, 'deleteAction').subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.alertMessage = res.message;
          this.messageType = 'success';
          this.changeDetectorRef.detectChanges();

          setTimeout(() => {
            this.activeModal.close('deleted');
          }, 500);
        } else {
          this.showmessage(false, res?.message || 'Operation failed');
        }
      },
      error: () => this.showmessage(false, 'Error occurred. Please try again.')
    });
  }

  deleteFromFirebase() {
    if (!this.firebaseKey) {
      this.showmessage(false, 'Invalid item key');
      return;
    }

    this.isDeleting = true;
    this.changeDetectorRef.detectChanges();

    let deletePromise: Promise<void>;

    switch (this.type) {
      case 'affiliate':
        deletePromise = this.firebaseService.deleteAffiliate(this.firebaseKey);
        break;
      case 'lead':
        deletePromise = this.firebaseService.delete('leads', this.firebaseKey);
        break;
      default:
        this.showmessage(false, 'Invalid Firebase type');
        this.isDeleting = false;
        return;
    }

    deletePromise.then(() => {
      this.alertMessage = 'Deleted successfully';
      this.messageType = 'success';
      this.isDeleting = false;
      this.changeDetectorRef.detectChanges();

      setTimeout(() => {
        this.activeModal.close('deleted');
      }, 500);
    }).catch(error => {
      console.error('Error deleting from Firebase:', error);
      this.showmessage(false, 'Failed to delete. Please try again.');
      this.isDeleting = false;
    });
  }
}
