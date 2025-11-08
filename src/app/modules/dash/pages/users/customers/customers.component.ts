import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { HttpService } from '../../../../services/http.service';
import { ApiAdminService } from '../../../../services/api.admin.service';
import { PublicService } from '../../../../services/public.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { AddEditCustomerComponent } from './add-edit/add-edit.component';
import { AdvancedFiltersComponent } from './advanced-filters/advanced-filters.component';
import { ToastrsService } from 'src/app/modules/services/toater.service';

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

  // إضافات ستاتيك مؤقتة (إلى أن يرجعها الـ API)
  total_orders?: number;
  total_spend?: number;
  last_order?: string;
  category?: string;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  isLoading$ = new BehaviorSubject<boolean>(true);
  users: UserRow[] = [];
  originalUsers: UserRow[] = [];
  totalCount = 0;

  page = 1;
  size = 10;
  searchText = '';
  searchChanged: Subject<string> = new Subject<string>();

  sizeOptions: { value: number; label: string }[] = [];

  // قيم الفلاتر المتقدمة
  minOrders: number | null = null;
  minSpend: number | null = null;
  minLastOrder: string = '';
  statusFilter: '' | UserStatus = '';




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

  ngOnInit(): void {
    this.list(this.page);

    this.searchChanged.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }


  buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    let url = `${this.api.users.list}?q=${q}&auth_type=4&size=${this.size}&page=${this.page}`;

    if (this.minOrders !== null && this.minOrders !== undefined) {
      url += `&min_orders=${this.minOrders}`;
    }

    if (this.minSpend !== null && this.minSpend !== undefined) {
      url += `&min_spend=${this.minSpend}`;
    }

    if (this.minLastOrder) {
      url += `&min_last_order=${this.minLastOrder}`;
    }

    if (this.statusFilter) {
      const statusValue = this.statusFilter === 'active' ? '1' : '2';
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
          this.totalCount = res.data.total_count ?? res.data.total_records ?? 0;
          this.users = res.data.data || [];
        } else {
          this.totalCount = 0;
          this.users = [];
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.totalCount = 0;
        this.users = [];
        this.isLoading$.next(false);
      }
    });
  }



  // 🔹 دالة لفتح مودال الفلاتر المتقدمة
  openFiltersModal(): void {
    const modalRef = this.modalService.open(AdvancedFiltersComponent, { size: 'lg', centered: true });

    // تمرير البيانات الحالية للمودال
    modalRef.componentInstance.minOrders = this.minOrders;
    modalRef.componentInstance.minSpend = this.minSpend;
    modalRef.componentInstance.minLastOrder = this.minLastOrder;
    modalRef.componentInstance.statusFilter = this.statusFilter;

    // التعامل مع النتيجة
    modalRef.result.then((filters: any) => {
      if (filters) {
        this.minOrders = filters.minOrders;
        this.minSpend = filters.minSpend;
        this.minLastOrder = filters.minLastOrder;
        this.statusFilter = filters.statusFilter;

        // 🔹 نعيد تحميل الداتا من الـ API
        this.page = 1;
        this.list(this.page);
      }
    });
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
    this.publicService.openImage('User', image);
  }

  // Helper لعرض الاسم الكامل
  fullName(u: UserRow): string {
    return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ');
  }

  reset(): void {
    // 🟢 إعادة تعيين الفلاتر الأساسية
    this.searchText = '';
    this.statusFilter = '';
    this.page = 1;
    this.size = this.publicService.getNumOfRows(490, 77);

    // 🟢 إعادة تعيين الفلاتر المتقدمة
    this.minOrders = null;
    this.minSpend = null;
    this.minLastOrder = '';
    this.statusFilter = '';
    // this.lastOrderDateFormatted = '';
    // this.showLastOrderDatePicker = false;

    // // 🟢 إعادة تعيين التقويم
    // this.resetDatePickerState();

    // 🟢 إعادة جلب الداتا
    this.list(this.page);
  }

  add() {
    const modalRef = this.modalService.open(AddEditCustomerComponent, { size: 'md', centered: true });
    modalRef.result.then(() => this.list(1));
  }

  edit(item: any) {
    const modalRef = this.modalService.open(AddEditCustomerComponent, { size: 'md', centered: true });
    modalRef.componentInstance.customer = item;
    modalRef.result.then(() => this.list(1));
  }

  delete(item: any) {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.id = item.id;
    modalRef.componentInstance.type = 'customer';
    modalRef.componentInstance.message = `Do you want to delete ${item.name} customer ?`;
    modalRef.result.then((res) => {
      if (res === 'deleted') this.list(1);
    });
  }

  toggleActive(user: any) {
    const url = this.api.users.active(user.id);
    this.http.action(url, {}, 'toggleActive').subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.toastr.showSuccess(res.message || 'Status updated successfully');
          // حدّث القيمة مباشرة بدون ما تعمل ريفريش كامل
          user.is_active = !user.is_active;
        } else {
          this.toastr.showError(res?.message || 'Operation failed');
        }
      },
      error: () => {
        this.toastr.showError('Error occurred. Please try again.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // this.showLastOrderDatePicker = false;
  }

}
