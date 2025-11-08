import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject, debounceTime } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiAdminService } from '../../../../services/api.admin.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { AddEditAuthorComponent } from './add-edit/add-edit.component';

type UserStatus = 'active' | 'inactive';

interface UserRow {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  image: string;
  category?: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.css']
})
export class AuthorsComponent implements OnInit {

  isLoading$ = new BehaviorSubject<boolean>(true);
  users: UserRow[] = [];
  originalUsers: UserRow[] = [];
  totalCount = 0;

  page = 1;
  size = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  statusFilter: '' | UserStatus = '';

  sizeOptions: { value: number; label: string }[] = [];

  statusAdvFilter: '' | UserStatus = '';


  constructor(
    private http: HttpService,
    private api: ApiAdminService,
    public publicService: PublicService,
    private modalService: NgbModal,
    private toastr: ToastrsService
  ) {
    // احسب الافتراضي
    this.size = this.publicService.getNumOfRows(490, 77);

    // أول خيار دايناميك
    this.sizeOptions = [
      { value: this.size, label: `${this.size} rows` },
      { value: 10, label: '10 rows' },
      { value: 25, label: '25 rows' },
      { value: 50, label: '50 rows' },
      { value: 100, label: '100 rows' },
      { value: 250, label: '250 rows' },
      { value: 500, label: '500 rows' }
    ];
  }

  getStatusOptions() {
    return [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ];
  }

  ngOnInit(): void {
    this.list(this.page);

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    let url = `${this.api.users.list}?q=${q}&auth_type=2&size=${this.size}&page=${this.page}`;

    if (this.statusFilter) {
      const statusValue = this.statusFilter === 'active' ? "1" : "2";
      url += `&is_active=${statusValue}`;
    }

    return url;
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);

    const url = this.buildUrl();
    this.http.listGet(url, 'users-list').subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          const payload = res.data;

          this.originalUsers = payload.data || [];

          this.totalCount =
            (payload.total_count ?? payload.totalRecords ?? payload.total_records) || 0;

          this.applyAdvancedFilters();
        } else {
          this.users = [];
          this.originalUsers = [];
          this.totalCount = 0;
        }

        this.isLoading$.next(false);
      },
      error: () => {
        this.users = [];
        this.originalUsers = [];
        this.totalCount = 0;
        this.isLoading$.next(false);
      }
    });
  }

  // تطبيق الفلاتر بعد جلب البيانات
  applyAdvancedFilters() {
    let data = [...this.originalUsers];

    if (this.statusAdvFilter) {
      data = data.filter(u => {
        const userStatus: UserStatus = u.is_active ? 'active' : 'inactive';
        return userStatus === this.statusAdvFilter;
      });
    }

    this.users = data;
  }

  // تغيير حجم الجدول
  onSizeChange() {
    this.page = 1;
    this.list(this.page);
  }

  // فتح المودال
  openFilters(modal: any) {
    modal.show();
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  getStatusPillClass(is_active: boolean): string {
    return is_active ? 'pill-success' : 'pill-secondary';
  }

  openImageModal(image: string) {
    this.publicService.openImage('Author', image);
  }

  // Helper لعرض الاسم الكامل
  fullName(u: UserRow): string {
    return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ');
  }

  reset(): void {
    // إعادة تعيين الفلاتر الأساسية
    this.searchText = '';
    this.statusFilter = '';
    this.page = 1;
    this.size = this.publicService.getNumOfRows(490, 77);

    // إعادة تعيين الفلاتر المتقدمة
    this.statusAdvFilter = '';

    // إعادة جلب الداتا
    this.list(this.page);
  }

  add() {
    const modalRef = this.modalService.open(AddEditAuthorComponent, { size: 'md', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditAuthorComponent, { size: 'md', centered: true });
    modalRef.componentInstance.author = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'author';
    modalRef.componentInstance.message = `Do you want to delete ${this.fullName(item)} author ?`;
    modalRef.result.then((res) => {
      if (res) {
        this.list(1);
      }
    });
  }

  toggleActive(user: any) {
    const url = this.api.users.active(user.id);
    this.http.action(url, {}, 'toggleActive').subscribe({
      next: (res: any) => {
        if (res?.status) {
          user.is_active = !user.is_active;
          this.toastr.showSuccess(res?.message || 'Status updated successfully');
        } else {
          this.toastr.showError(res?.message || 'Failed to update status');
        }
      },
      error: () => {
        this.toastr.showError('Failed to update status');
      }
    });
  }

}
