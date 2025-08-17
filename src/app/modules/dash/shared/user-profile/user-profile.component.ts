import { Component } from '@angular/core';
import { PublicService } from '../../../services/public.service';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from '../delete/delete.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {

  public userId: any = {};
  userData: any = {};
  constructor(public activeModal: NgbActiveModal, public publicService: PublicService, public httpService: HttpService,
    private api: ApiService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.getUser();
  }

  getUser() {
    // this.httpService.instedList(this.api.users.profile(this.userId.id), {}).subscribe({
    //   next: (res: any) => {
    //     this.userData = res.data;
    //   }
    // });
  }

  delete(user: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = user.id;
    modalRef.componentInstance.type = 'user';
    modalRef.componentInstance.message = `Do you want to delete ${user.first_name} ${user.last_name} ?`;
    modalRef.result.then(() => this.modalService.dismissAll());
  }
}
