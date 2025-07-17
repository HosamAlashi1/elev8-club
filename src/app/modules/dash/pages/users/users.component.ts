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
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
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
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' }
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

    const url = `${this.api.user.list}`;
    this.httpService.list(url, payload, 'usersList').subscribe({
      next: (res) => {
        console.log('Users API Response:', res); // Debug log
        
        if (res?.status && res?.items?.data) {
          this.users = res.items.data.map((u: any) => ({
            ...u,
            image: u.photo,
            status: u.status === 1 ? 'Active' : 'Inactive',
            name: u.name || 'N/A',
            email: u.email || 'N/A',
            phone: u.phone || 'N/A'
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
    const newStatus = user.status === 'Active' ? 0 : 1;
    const url = this.api.user.edit(user.id);
    
    this.httpService.action(url, { status: newStatus }, 'toggleUserStatus').subscribe({
      next: (res: any) => {
        if (res?.status) {
          user.status = newStatus === 1 ? 'Active' : 'Inactive';
          this.toastr.Showsuccess(`User "${user.name}" is now marked as ${user.status}`);
        }
      },
      error: () => {
        this.toastr.Showerror('Failed to update user status');
      }
    });
  }

  add() {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    modalRef.result.then((result) => {
      if (result) {
        this.list(this.page); // Refresh the current page
      }
    }).catch(() => {});
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditComponent, { size: 'lg', centered: true });
    // Pass the original user data with proper mapping
    modalRef.componentInstance.user = {
      ...item,
      photo: item.image || item.photo, // Ensure we have the photo field
      status: item.status // Keep the string status for display
    };
    modalRef.result.then((result) => {
      if (result) {
        this.list(this.page); // Refresh the current page
      }
    }).catch(() => {});
  }

  delete(item: any) {
      const modalRef = this.modalService.open(DeleteComponent, {});
      modalRef.componentInstance.id = item.id;
      modalRef.componentInstance.type = 'user';
      modalRef.componentInstance.message = `Do you want to delete user ${item.name} ?`;
      modalRef.result.then(() => this.list(1));
    }

  openImageModal(image: string) {
    this.publicService.openImage('User Image', image);
  }
}
