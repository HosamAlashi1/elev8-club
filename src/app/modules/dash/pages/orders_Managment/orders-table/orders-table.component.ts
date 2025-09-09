import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { PublicService } from 'src/app/modules/services/public.service';

// ===== Types =====
export type Status =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 'Credit Card' | 'PayPal' | 'Bank Transfer' | 'Cash';

export interface OrderRow {
  id: string; // e.g. ORD-2024-001
  customer: { name: string; avatar?: string };
  item: { title: string; qty: number; cover: string };
  date: string; // ISO date e.g. 2024-01-15
  payment: PaymentMethod;
  amount: number; // e.g. 29.99
  status: Status;
}

@Component({
  selector: 'app-orders-table',
  templateUrl: './orders-table.component.html',
  styleUrls: ['./orders-table.component.css']
})
export class OrdersTableComponent implements OnInit, OnDestroy {
  // ===== Inputs (data) =====
  @Input() rows: OrderRow[] = [];
  @Input() totalCount = 0;

  // paging
  @Input() page = 1;
  @Input() pageSize = 10; // حجم الصفحة الموحد

  // loading (اختياري – لو حابب تظهر سكلتون/لودر بالتمبليت)
  @Input() isLoading = false;

  // filters via app-modern-select
  @Input() statusOptions: Array<{ label: string; value: '' | Status }> = [];
  @Input() paymentOptions: Array<{ label: string; value: '' | PaymentMethod }> = [];

  @Input() statusFilter: '' | Status = '';
  @Input() paymentFilter: '' | PaymentMethod = '';

  // Date range filter
  dateRangeStart: string = '';
  dateRangeEnd: string = '';
  showDatePicker = false;
  showMiniCalendar = false;
  currentCalendarDate = new Date();
  calendarType: 'start' | 'end' = 'start';
  
  // Calendar data
  dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  calendarDays: any[] = [];

  // Formatted date strings for display
  get dateRangeStartFormatted(): string {
    return this.dateRangeStart ? this.formatDisplayDate(this.dateRangeStart) : '';
  }

  set dateRangeStartFormatted(value: string) {
    // This setter is needed for two-way binding, but we'll handle it via calendar
  }

  get dateRangeEndFormatted(): string {
    return this.dateRangeEnd ? this.formatDisplayDate(this.dateRangeEnd) : '';
  }

  set dateRangeEndFormatted(value: string) {
    // This setter is needed for two-way binding, but we'll handle it via calendar
  }

  // ===== Outputs (events to parent) =====
  @Output() statusChange = new EventEmitter<'' | Status>();
  @Output() paymentChange = new EventEmitter<'' | PaymentMethod>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() dateRangeChange = new EventEmitter<{ start: string; end: string }>();

  // bulk / row actions
  @Output() bulkAction = new EventEmitter<'archive' | 'delete' | 'export' | 'apply'>();
  @Output() rowAction = new EventEmitter<{ type: 'edit' | 'delete' | 'view' | 'open'; row: OrderRow }>();
  @Output() imageOpen = new EventEmitter<string>(); // full image url

  // ===== Local state =====
  searchText = '';
  private searchChanged$ = new Subject<string>();
  private sub?: Subscription;

  selectedIds = new Set<string>();
  selectAll = false;

  // ===== Lifecycle =====
  ngOnInit(): void {
    // ديباونس للبحث
    this.sub = this.searchChanged$.pipe(debounceTime(300)).subscribe((term) => {
      this.searchChange.emit(term.trim());
    });

    // إغلاق date picker عند النقر خارجه
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  constructor(private publicService: PublicService) {
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    // إزالة event listener
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  // إغلاق date picker عند النقر خارجه
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const datePickerContainer = target.closest('.position-relative');
    
    if (!datePickerContainer && this.showDatePicker) {
      this.showDatePicker = false;
      this.showMiniCalendar = false;
    }
  }  // ===== Handlers for template =====
  onSearchModelChange(term: string) {
    this.searchText = term;
    this.searchChanged$.next(term);
  }

  onStatusModelChange(val: '' | Status) {
    this.statusFilter = val;
    this.statusChange.emit(val);
  }

  onPaymentModelChange(val: '' | PaymentMethod) {
    this.paymentFilter = val;
    this.paymentChange.emit(val);
  }

  onApplyClick() {
    this.bulkAction.emit('apply');
  }

  // Date range methods
  toggleDatePicker() {
    this.showDatePicker = !this.showDatePicker;
    this.showMiniCalendar = false;
  }

  onDateRangeApply() {
    if (this.dateRangeStart && this.dateRangeEnd) {
      this.dateRangeChange.emit({
        start: this.dateRangeStart,
        end: this.dateRangeEnd
      });
      this.showDatePicker = false;
    }
  }

  clearDateRange() {
    this.dateRangeStart = '';
    this.dateRangeEnd = '';
    this.dateRangeChange.emit({ start: '', end: '' });
    this.showDatePicker = false;
    this.showMiniCalendar = false;
  }

  get dateRangeLabel(): string {
    if (this.dateRangeStart && this.dateRangeEnd) {
      return `${this.formatDisplayDate(this.dateRangeStart)} - ${this.formatDisplayDate(this.dateRangeEnd)}`;
    }
    return 'Date range';
  }

  // Calendar helper methods
  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  openCalendar(type: 'start' | 'end') {
    this.calendarType = type;
    this.showMiniCalendar = true;
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    const startRange = this.dateRangeStart ? new Date(this.dateRangeStart) : null;
    const endRange = this.dateRangeEnd ? new Date(this.dateRangeEnd) : null;

    this.calendarDays = [];
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = (startRange && currentDate.toDateString() === startRange.toDateString()) ||
                        (endRange && currentDate.toDateString() === endRange.toDateString());
      const isInRange = startRange && endRange && currentDate >= startRange && currentDate <= endRange;

      this.calendarDays.push({
        date: currentDate.getDate(),
        fullDate: currentDate,
        currentMonth: isCurrentMonth,
        isToday,
        selected: isSelected,
        inRange: isInRange && !isSelected
      });
    }
  }

  selectDate(day: any) {
    const selectedDate = day.fullDate.toISOString().split('T')[0];
    
    if (this.calendarType === 'start') {
      this.dateRangeStart = selectedDate;
      // Clear end date if it's before start date
      if (this.dateRangeEnd && new Date(this.dateRangeEnd) < new Date(selectedDate)) {
        this.dateRangeEnd = '';
      }
    } else {
      this.dateRangeEnd = selectedDate;
      // Clear start date if it's after end date
      if (this.dateRangeStart && new Date(this.dateRangeStart) > new Date(selectedDate)) {
        this.dateRangeStart = '';
      }
    }
    
    this.generateCalendar();
    this.showMiniCalendar = false;
  }

  previousMonth() {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
    this.generateCalendar();
  }

  getMonthYear(): string {
    return this.currentCalendarDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  setQuickDate(period: string) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (period) {
      case 'today':
        this.dateRangeStart = today.toISOString().split('T')[0];
        this.dateRangeEnd = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        this.dateRangeStart = yesterday.toISOString().split('T')[0];
        this.dateRangeEnd = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        this.dateRangeStart = startOfWeek.toISOString().split('T')[0];
        this.dateRangeEnd = today.toISOString().split('T')[0];
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dateRangeStart = startOfMonth.toISOString().split('T')[0];
        this.dateRangeEnd = today.toISOString().split('T')[0];
        break;
    }
    this.generateCalendar();
  }

  // Paging
  goToPage(p: number) {
    if (p && p !== this.page) this.pageChange.emit(p);
  }

  // Selection
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedIds.clear();
    if (this.selectAll) this.rows.forEach((r) => this.selectedIds.add(r.id));
  }

  toggleRow(row: OrderRow, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) this.selectedIds.add(row.id);
    else this.selectedIds.delete(row.id);

    this.selectAll = this.selectedIds.size === this.rows.length && this.rows.length > 0;
  }


  doBulkArchive() {
    if (this.selectedIds.size > 0) this.bulkAction.emit('archive');
  }
  doBulkDelete() {
    if (this.selectedIds.size > 0) this.bulkAction.emit('delete');
  }
  doBulkExport() {
    this.bulkAction.emit('export');
  }

  // Row actions
  openImage(src?: string) {
    if (src) {
      this.publicService.openImage('Book Cover', src);
    }
  }
  editRow(row: OrderRow) {
    this.rowAction.emit({ type: 'edit', row });
  }
  deleteRow(row: OrderRow) {
    this.rowAction.emit({ type: 'delete', row });
  }
  viewRow(row: OrderRow) {
    this.rowAction.emit({ type: 'view', row });
  }

  // ===== UI helpers (للاستخدام داخل التمبليت) =====
  getStatusPillClass(status: Status): string {
    switch (status) {
      case 'pending':
        return 'pill pill-yellow';
      case 'processing':
        return 'pill pill-blue';
      case 'paid':
        return 'pill pill-green';
      case 'shipped':
        return 'pill pill-blue';
      case 'completed':
        return 'pill pill-green';
      case 'refunded':
        return 'pill pill-red';
      case 'cancelled':
        return 'pill pill-gray';
      default:
        return 'pill pill-gray';
    }
  }

  formatAmount(val: number): string {
    // $29.99
    return `$${(val ?? 0).toFixed(2)}`;
  }

  formatDateLines(iso: string): { top: string; bottom: string } {
    // لتحاكي الشكل: 2024-01- \n 15
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const top = `${y}-${m}-`;
    const bottom = d.getDate().toString().padStart(2, '0');
    return { top, bottom };
  }

  customerInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }


  onResetClick() {
    // إعادة تعيين جميع الفلاتر
    this.statusFilter = '';
    this.paymentFilter = '';
    this.dateRangeStart = '';
    this.dateRangeEnd = '';
    this.showDatePicker = false;

    // إرسال الأحداث لإعادة تعيين الفلاتر في المكون الرئيسي
    this.statusChange.emit('');
    this.paymentChange.emit('');
    this.dateRangeChange.emit({ start: '', end: '' });
  }
}
