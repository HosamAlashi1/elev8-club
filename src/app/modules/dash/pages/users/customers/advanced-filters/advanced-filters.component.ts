import { Component, HostListener, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


// استيراد الأنواع من مكون التاريخ
interface DateRange {
  start: string;
  end: string;
}

@Component({
    selector: 'app-advanced-filters',
    templateUrl: './advanced-filters.component.html',
    styleUrls: ['./advanced-filters.component.css']
})
export class AdvancedFiltersComponent implements OnInit {

    // Filters data
    minOrders: number | null = null;
    minSpend: number | null = null;
    minLastOrder: string = '';
    statusFilter: '' | 'active' | 'inactive' = '';

    // 🗓️ Last Order Date Picker Properties
    showLastOrderDatePicker = false;
    lastOrderCurrentCalendarDate = new Date();
    lastOrderCalendarDays: any[] = [];
    dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    lastOrderDateFormatted = '';




    // 🔹 Host Listener to close date picker when clicking outside
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const target = event.target as HTMLElement;
        const datePickerContainer = target.closest('.custom-date-container');
        const modalBackdrop = target.closest('.modal-backdrop');
        const modalContent = target.closest('.modal-content');

        // إذا كان النقر على modal backdrop، أغلق التقويم فقط
        if (modalBackdrop) {
            this.showLastOrderDatePicker = false;
            return;
        }

        // إذا لم يكن النقر داخل التقويم أو المودال، أغلق التقويم
        if (!datePickerContainer && !modalContent && this.showLastOrderDatePicker) {
            this.showLastOrderDatePicker = false;
        }
    }

    // 🔹 Host Listener for Escape key to close date picker
    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent): void {
        if (this.showLastOrderDatePicker) {
            this.showLastOrderDatePicker = false;
            event.stopPropagation();
        }
    }

    // وظيفة التعامل مع تغيير التاريخ
    onLastOrderDateChange(date: string | string[] | DateRange): void {
        // بما أن الوضع 'single'، المتوقع أن يكون string
        if (typeof date === 'string') {
            this.minLastOrder = date;
            console.log('Last order date changed:', date);

            // إعادة تطبيق الفلاتر عند تغيير التاريخ
            // this.applyAdvancedFilters();
        } else {
            console.warn('غير متوقع: تم استلام نوع غير صحيح من التاريخ:', typeof date);
        }
    }

    // 🔹 دالة للتعامل مع HTML5 date input البسيط
    onSimpleDateChange(date: string): void {
        this.minLastOrder = date;
        console.log('Simple date changed:', date);
        // تطبيق الفلاتر مباشرة
        // this.applyAdvancedFilters();
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

    selectLastOrderDate(day: any, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        if (!day.currentMonth) return;

        const selectedDate = day.fullDate;
        this.minLastOrder = this.formatDateToString(selectedDate);
        this.lastOrderDateFormatted = this.formatDateDisplay(selectedDate);
        this.generateLastOrderCalendarDays(); // Refresh to show selection
    }

    setLastOrderQuickDate(type: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
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

    previousLastOrderMonth(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.lastOrderCurrentCalendarDate.setMonth(this.lastOrderCurrentCalendarDate.getMonth() - 1);
        this.generateLastOrderCalendarDays();
    }

    nextLastOrderMonth(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.lastOrderCurrentCalendarDate.setMonth(this.lastOrderCurrentCalendarDate.getMonth() + 1);
        this.generateLastOrderCalendarDays();
    }

    getLastOrderMonthYear(): string {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[this.lastOrderCurrentCalendarDate.getMonth()]} ${this.lastOrderCurrentCalendarDate.getFullYear()}`;
    }

    applyLastOrderDate(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.showLastOrderDatePicker = false;
        // this.applyAdvancedFilters();
    }

    clearLastOrderDate(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.minLastOrder = '';
        this.lastOrderDateFormatted = '';
        this.showLastOrderDatePicker = false;
        this.generateLastOrderCalendarDays();
        // this.applyAdvancedFilters();
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


    // 🔹 دالة لإعادة تعيين حالة التقويم في حالة حدوث مشاكل
    resetDatePickerState(): void {
        this.showLastOrderDatePicker = false;
    }

    constructor(
        public activeModal: NgbActiveModal
    ) { }

    ngOnInit(): void {
        // Initialize any required data
    }

    // Apply filters and close modal
    applyFilters(): void {
        const filters = {
            minOrders: this.minOrders,
            minSpend: this.minSpend,
            minLastOrder: this.minLastOrder,
            statusFilter: this.statusFilter
        };

        this.activeModal.close(filters);
    }

    // Close modal without applying
    close(): void {
        this.activeModal.dismiss();
    }

    // Clear all filters
    clearAll(): void {
        this.minOrders = null;
        this.minSpend = null;
        this.minLastOrder = '';
        this.statusFilter = '';
    }

    // 🗓️ Last Order Date Picker Methods
    toggleLastOrderDatePicker(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.showLastOrderDatePicker = !this.showLastOrderDatePicker;
        if (this.showLastOrderDatePicker) {
            this.generateLastOrderCalendarDays();
        }
    }
}