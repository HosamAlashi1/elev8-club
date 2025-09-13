import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// src/app/modules/dash/pages/admins/admins.component.ts
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from '../../../services/http.service';
import { ApiService } from '../../../services/api.service';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { AddEditAdminComponent } from './add-edit/add-edit.component';

interface AdminRow {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: string;
  image: string;
}

@Component({
  selector: 'app-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent implements OnInit {

  isLoading$ = new BehaviorSubject<boolean>(true);

  // data
  admins: AdminRow[] = [];
  totalCount = 0;

  // paging & search & filters
  page = 1;
  size = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();
  roleId = 0; // 0 = All

  // selection
  selectedIds = new Set<number>();
  selectAll = false;

  constructor(
    private http: HttpService,
    private api: ApiService,
    public publicService: PublicService,
    private modalService: NgbModal,
    private toastr: ToastrsService
  ) {
    // تقدير حجم الصفحة حسب ارتفاع الشاشة (نفس منطقك)
    this.size = this.publicService.getNumOfRows(450, 77);
  }

  ngOnInit(): void {
    this.list(this.page);

    // ديباونس للبحث
    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    return `${this.api.admins.list}?q=${q}&role_id=${this.roleId}&size=${this.size}&page=${this.page}`;
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);
    this.selectedIds.clear();
    this.selectAll = false;

    const url = this.buildUrl();
    this.http.listGet(url, 'admins-list').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.totalCount = res.data.total_count ?? 0;
          this.admins = (res.data.data || []) as AdminRow[];
        } else {
          this.totalCount = 0;
          this.admins = [];
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.totalCount = 0;
        this.admins = [];
        this.isLoading$.next(false);
      }
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onRoleChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  reset(): void {
    this.searchText = '';
    this.roleId = 0;
    this.page = 1;
    this.list(this.page);
  }

  // UI helpers
  fullName(a: AdminRow): string {
    return [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' ');
  }

  statusPillClass(a: AdminRow): string {
    return a.is_active ? 'pill-success' : 'pill-secondary';
  }

  openImageModal(image: string) {
    this.publicService.openImage('Admin', image);
  }

  // selection
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedIds.clear();
    if (this.selectAll) this.admins.forEach(x => this.selectedIds.add(x.id));
  }

  toggleRow(id: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement | null)?.checked ?? false;
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.selectAll = this.selectedIds.size === this.admins.length && this.admins.length > 0;
  }

  add() {
    const modalRef = this.modalService.open(AddEditAdminComponent, { size: 'lg', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditAdminComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.admin = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'admin';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} admin ?`;
    modalRef.result.then(() => this.list(1));
  }

  toggleActive(admin: any) {
    const url = this.api.admins.active(admin.id);
    this.http.action(url, {}, 'toggleActive').subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastr.showSuccess(res.msg || 'Status updated successfully');
          // حدّث القيمة مباشرة بدون ما تعمل ريفريش كامل
          admin.is_active = !admin.is_active;
        } else {
          this.toastr.showError(res?.msg || 'Operation failed');
        }
      },
      error: () => {
        this.toastr.showError('Error occurred. Please try again.');
      }
    });
  }

}
