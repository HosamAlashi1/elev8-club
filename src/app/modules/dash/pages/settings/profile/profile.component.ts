import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrsService } from '../../../services/toater.service';
import { HttpService } from '../../../services/http.service';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = {};
  isEditing = false;
  newPassword = '';

  constructor(
    private modalService: NgbModal,
    private toastr: ToastrsService,
    public httpService: HttpService,
    private api: ApiService
  ) { }

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.httpService.listGet(this.api.admin.profile).subscribe({
      next: (res: any) => {
        if (res?.status && res?.items?.user) {
          this.user = res.items.user;
        }
      },
      error: () => {
        this.toastr.Showerror('Failed to load profile data');
      }
    });
  }

  toggleEdit() {
    this.isEditing = true;
  }

  saveChanges() {
    const phonePattern = /^\+?[1-9]\d{1,14}$/;
    if (this.user.phone && !phonePattern.test(this.user.phone)) {
      this.toastr.Showerror('Please enter a valid phone number.');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.user.name || '');
    formData.append('email', this.user.email || '');
    formData.append('phone', this.user.phone || '');

    this.httpService.setLoading('editProfile', true);

    this.httpService.action(this.api.admin.edit(this.user.id), formData, 'editProfile').subscribe({
      next: () => {
        this.toastr.Showsuccess('Profile updated successfully');
        this.isEditing = false;
      },
      error: () => {
        this.toastr.Showerror('Failed to update profile');
      }
    });
  }



  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.user.logo = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.user.image = reader.result as string;
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('logo', file);

      this.httpService.setLoading('editProfile', true);
      this.httpService.action(this.api.admin.edit(this.user.id), formData, 'editProfile').subscribe({
        next: () => {
          this.toastr.Showsuccess('Profile image updated successfully');
        },
        error: () => {
          this.toastr.Showerror('Failed to update profile image');
        }
      });
    }
  }


  changePassword(): void {
    const modalRef = this.modalService.open(ChangePasswordComponent, { centered: true, size: 'md' });

    modalRef.result.then((confirmed) => {
      if (confirmed) {
        this.toastr.Showsuccess('Password changed successfully');
      }
    }).catch(() => { });
  }
}
