import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PublicService } from '../../services/public.service';
import { ToastrsService } from '../../services/toater.service';
import { AddEditComponent } from './add-edit/add-edit.component';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css'],
})
export class AdminsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);
  users: any[] = [];

  page = 1;
  size = 10;
  totalCount = 0;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  statusFilter: string = '';

  // Options for status filter
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  constructor(
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal,
    private api: ApiService,
    private httpService: HttpService
  ) {
    this.size = this.publicService.getNumOfRows(313, 73.24);
  }

  ngOnInit(): void {
    this.loadData();

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  loadData(): void {
    this.list(this.page);
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);
    const payload = {
      perPage: this.size,
      page: this.page,
      search: this.searchText.trim(),
      status: this.statusFilter || undefined
    };

    const url = `${this.api.admin.list}`;
    this.httpService.list(url, payload, 'usersList').subscribe({
      next: (res) => {
        if (res?.status && res?.items?.data) {
          this.users = res.items.data.map((u: any) => ({
            ...u,
            image: u.logo,
            account_type: u.account_type,
            status: u.status.charAt(0).toUpperCase() + u.status.slice(1),
            rolesDisplay: u.roles?.map((role: any) => role.name).join(', ') || 'No roles assigned'
          }));
          this.totalCount = res.items.total_records;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.toastr.Showerror('Failed to load users');
        this.isLoading$.next(false);
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  reset(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.page = 1;
    this.list(this.page);
  }

  toggleStatus(user: any): void {
    const newStatus = user.status === 'Active' ? 'inactive' : 'active';
    
    // Prepare form data for the API
    const formData = new FormData();
    formData.append('name', user.name);
    formData.append('username', user.username);
    formData.append('email', user.email);
    formData.append('status', newStatus);
    
    // Add roles if they exist
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role: any, index: number) => {
        formData.append(`role_ids[${index}]`, role.id.toString());
      });
    }

    const url = this.api.admin.edit(user.id);
    this.httpService.action(url, formData, 'toggleUserStatus').subscribe({
      next: (res: any) => {
        if (res.success || res.status) {
          user.status = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
          this.toastr.Showsuccess(`User "${user.name}" status updated to ${user.status}`);
        } else {
          this.toastr.Showerror(res.msg || res.message || 'Failed to update status');
        }
      },
      error: (error: any) => {
        console.error('Error updating status:', error);
        const errorMessage = error?.error?.message || error?.error?.msg || error?.message || 'Failed to update status';
        this.toastr.Showerror(errorMessage);
      }
    });
  }

  add() {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.user = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'admin';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} ?`;
    modalRef.result.then(() => this.list(1));
  }

  openImageModal(image: string) {
    this.publicService.openImage('Admin Image', image);
  }
}
