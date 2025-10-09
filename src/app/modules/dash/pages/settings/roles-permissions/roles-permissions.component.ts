import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject, debounceTime } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../services/http.service';
import { ApiAdminService } from '../../../../services/api.admin.service';
import { PublicService } from '../../../../services/public.service';
import { ToastrsService } from '../../../../services/toater.service';
import { DeleteComponent } from '../../../shared/delete/delete.component';
// لاحقاً رح تعمل كومبوننت AddEditRoleComponent
import { AddEditRoleComponent } from './add-edit/add-edit.component';

interface RoleRow {
  id: number;
  name: string;
  insert_user?: string | null;
  insert_date?: string | null;
  update_date?: string | null;
}

@Component({
  selector: 'app-roles-permissions',
  templateUrl: './roles-permissions.component.html',
  styleUrls: ['./roles-permissions.component.css']
})
export class RolesPermissionsComponent implements OnInit {

  isLoading$ = new BehaviorSubject<boolean>(true);
  roles: RoleRow[] = [];
  totalCount = 0;

  page = 1;
  size = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  sizeOptions: { value: number; label: string }[] = [];

  constructor(
    private http: HttpService,
    private api: ApiAdminService,
    public publicService: PublicService,
    private modalService: NgbModal,
    private toastr: ToastrsService
  ) {
    // احسب الافتراضي
    this.size = this.publicService.getNumOfRows(490, 77);

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

  ngOnInit(): void {
    this.list(this.page);

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    return `${this.api.roles.list}?q=${q}&size=${this.size}&page=${this.page}`;
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);

    const url = this.buildUrl();
    this.http.listGet(url, 'roles-list').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.roles = res.data.data || [];
          this.totalCount = res.data.total_count || 0;
        } else {
          this.roles = [];
          this.totalCount = 0;
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.roles = [];
        this.totalCount = 0;
        this.isLoading$.next(false);
      }
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.searchText);
  }

  onSizeChange() {
    this.page = 1;
    this.list(this.page);
  }

  reset(): void {
    this.searchText = '';
    this.page = 1;
    this.size = this.publicService.getNumOfRows(490, 77);
    this.list(this.page);
  }

  add() {
    const modalRef = this.modalService.open(AddEditRoleComponent, { size: 'md', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: RoleRow) {
    const modalRef = this.modalService.open(AddEditRoleComponent, { size: 'md', centered: true });
    modalRef.componentInstance.role = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: RoleRow) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'role';
    modalRef.componentInstance.message = `Do you want to delete role "${item.name}" ?`;
    modalRef.result.then((res) => {
      if (res) {
        this.list(1);
      }
    });
  }

  // مبدئياً، للـ Permissions رح نعمل دالة تجيبهم عند فتح المودال أو الصفحة
  loadPermissions() {
    this.http.listGet(this.api.common.permissions, 'permissions-list').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          console.log('permissions', res.data);
        }
      }
    });
  }

}
