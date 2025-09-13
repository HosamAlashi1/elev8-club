import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from '../../../../services/http.service';
import { ApiService } from '../../../../services/api.service';
import { PublicService } from '../../../../services/public.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from '../../../shared/delete/delete.component';
import { AddEditCustomerComponent } from './add-edit/add-edit.component';
import { ToastrsService } from 'src/app/modules/services/toater.service';

type UserStatus = 'active' | 'inactive';

// استيراد الأنواع من مكون التاريخ
interface DateRange {
  start: string;
  end: string;
}

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

interface CategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {

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

  // قيم الفلاتر المتقدمة
  categoryFilter: number | '' = '';
  minOrders: number | null = null;
  minSpend: number | null = null;
  minLastOrder: string = '';
  statusAdvFilter: '' | UserStatus = '';

  // 🗓️ Last Order Date Picker Properties
  showLastOrderDatePicker = false;
  lastOrderDateFormatted = '';
  lastOrderCurrentCalendarDate = new Date();
  lastOrderCalendarDays: any[] = [];
  dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // وظيفة التعامل مع تغيير التاريخ
  onLastOrderDateChange(date: string | string[] | DateRange): void {
    // بما أن الوضع 'single'، المتوقع أن يكون string
    if (typeof date === 'string') {
      this.minLastOrder = date;
      console.log('Last order date changed:', date);

      // إعادة تطبيق الفلاتر عند تغيير التاريخ
      this.applyAdvancedFilters();
    } else {
      console.warn('غير متوقع: تم استلام نوع غير صحيح من التاريخ:', typeof date);
    }
  }

  // 🗓️ Last Order Date Picker Methods
  toggleLastOrderDatePicker(): void {
    this.showLastOrderDatePicker = !this.showLastOrderDatePicker;
    if (this.showLastOrderDatePicker) {
      this.generateLastOrderCalendarDays();
    }
  }

  generateLastOrderCalendarDays(): void {
    const year = this.lastOrderCurrentCalendarDate.getFullYear();
    const month = this.lastOrderCurrentCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    this.lastOrderCalendarDays = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = this.isSameDay(currentDate, new Date());
      const isSelected = this.minLastOrder && this.isSameDay(currentDate, new Date(this.minLastOrder));

      this.lastOrderCalendarDays.push({
        date: currentDate.getDate(),
        fullDate: new Date(currentDate),
        currentMonth: isCurrentMonth,
        isToday: isToday,
        selected: isSelected
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  selectLastOrderDate(day: any): void {
    if (!day.currentMonth) return;

    const selectedDate = day.fullDate;
    this.minLastOrder = this.formatDateToString(selectedDate);
    this.lastOrderDateFormatted = this.formatDateDisplay(selectedDate);
    this.generateLastOrderCalendarDays(); // Refresh to show selection
  }

  setLastOrderQuickDate(type: string): void {
    const today = new Date();
    let targetDate: Date;

    switch (type) {
      case 'today':
        targetDate = today;
        break;
      case 'week':
        targetDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        targetDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case '3months':
        targetDate = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      default:
        return;
    }

    this.minLastOrder = this.formatDateToString(targetDate);
    this.lastOrderDateFormatted = this.formatDateDisplay(targetDate);
    this.lastOrderCurrentCalendarDate = new Date(targetDate);
    this.generateLastOrderCalendarDays();
  }

  previousLastOrderMonth(): void {
    this.lastOrderCurrentCalendarDate.setMonth(this.lastOrderCurrentCalendarDate.getMonth() - 1);
    this.generateLastOrderCalendarDays();
  }

  nextLastOrderMonth(): void {
    this.lastOrderCurrentCalendarDate.setMonth(this.lastOrderCurrentCalendarDate.getMonth() + 1);
    this.generateLastOrderCalendarDays();
  }

  getLastOrderMonthYear(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[this.lastOrderCurrentCalendarDate.getMonth()]} ${this.lastOrderCurrentCalendarDate.getFullYear()}`;
  }

  applyLastOrderDate(): void {
    this.showLastOrderDatePicker = false;
    this.applyAdvancedFilters();
  }

  clearLastOrderDate(): void {
    this.minLastOrder = '';
    this.lastOrderDateFormatted = '';
    this.showLastOrderDatePicker = false;
    this.generateLastOrderCalendarDays();
    this.applyAdvancedFilters();
  }

  // Helper methods
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  private formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // 🟢 قائمة الفئات من الـ API
  categoriesList: CategoryOption[] = [];

  constructor(
    private http: HttpService,
    private api: ApiService,
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
    this.loadCategories(); // 🟢 جلب الفئات
    this.generateLastOrderCalendarDays(); // 🗓️ تهيئة الكالندر

    this.searchChanged.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.list(this.page);
    });
  }

  // 🟢 جلب الفئات من الـ API
  loadCategories(): void {
    this.http.listGet(this.api.categories.list, 'categories-list').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data?.data) {
          this.categoriesList = res.data.data.map((c: any) => ({
            id: c.id,
            name: c.name
          }));
        } else {
          this.categoriesList = [];
        }
      },
      error: () => {
        this.categoriesList = [];
      }
    });
  }

  getCategoryOptions() {
    return [
      { value: '', label: 'All Categories' },
      ...this.categoriesList.map(c => ({
        value: c.id,
        label: c.name
      }))
    ];
  }

  buildUrl(): string {
    const q = encodeURIComponent(this.searchText.trim());
    return `${this.api.users.list}?q=${q}&auth_type=4&size=${this.size}&page=${this.page}`;
  }

  list(page: number): void {
    this.page = page;
    this.isLoading$.next(true);

    const url = this.buildUrl();
    this.http.listGet(url, 'users-list').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.totalCount = res.data.total_records ?? 0;

          this.originalUsers = (res.data.data || []).map((u: any) => ({
            ...u,
          }));

          // فلترة الداتا بس للعرض
          this.applyAdvancedFilters();
        } else {
          this.totalCount = 0;
          this.originalUsers = [];
          this.users = [];
        }
        this.isLoading$.next(false);
      },
      error: () => {
        this.totalCount = 0;
        this.originalUsers = [];
        this.users = [];
        this.isLoading$.next(false);
      }
    });
  }

  // 🔹 تطبيق الفلاتر بعد جلب البيانات
  applyAdvancedFilters() {
    let data = [...this.originalUsers]; // 🟢 اشتغل على نسخة من الأصل

    if (this.categoryFilter) {
      data = data.filter(u => String(u.category) === String(this.categoryFilter));
    }
    if (this.minOrders !== null) {
      data = data.filter(u => (u.total_orders || 0) >= this.minOrders!);
    }
    if (this.minSpend !== null) {
      data = data.filter(u => (u.total_spend || 0) >= this.minSpend!);
    }
    if (this.minLastOrder) {
      data = data.filter(u => u.last_order && u.last_order >= this.minLastOrder);
    }
    if (this.statusAdvFilter) {
      data = data.filter(u => (u.is_active ? 'active' : 'inactive') === this.statusAdvFilter);
    }

    this.users = data; // بس غيّر الـ users للعرض
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
    this.categoryFilter = '';
    this.minOrders = null;
    this.minSpend = null;
    this.minLastOrder = '';
    this.statusAdvFilter = '';
    this.lastOrderDateFormatted = '';
    this.showLastOrderDatePicker = false;

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
        if (res?.success) {
          this.toastr.showSuccess(res.msg || 'Status updated successfully');
          // حدّث القيمة مباشرة بدون ما تعمل ريفريش كامل
          user.is_active = !user.is_active;
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
