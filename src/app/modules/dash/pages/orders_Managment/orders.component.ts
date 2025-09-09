// orders.component.ts
import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PublicService } from 'src/app/modules/services/public.service';

type Status =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'refunded'
  | 'cancelled';

type PaymentMethod = 'Credit Card' | 'PayPal' | 'Bank Transfer' | 'Cash';

interface OrderRow {
  id: string; // e.g. ORD-2024-001
  customer: { name: string; avatar?: string };
  item: { title: string; qty: number; cover: string };
  date: string; // ISO: 2024-01-15
  payment: PaymentMethod;
  amount: number; // 29.99
  status: Status;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, AfterViewInit {
  // ====== حالة التحميل ======
  isLoading$ = new BehaviorSubject<boolean>(false);

  // ====== حجم الصفحة الموحد ======
  pageSize = 0; // سيتم حسابه في constructor

  // ====== التابات ======
  activeTab: 'all' | 'pending' | 'paid' | 'shipped' | 'refunds' = 'all';
  @ViewChildren('tabBtn', { read: ElementRef }) tabBtns!: QueryList<ElementRef>;
  underlineLeft = 0;
  underlineWidth = 0;

  // ====== بيانات الجدول (جاهزة للتمرير) ======
  orders: OrderRow[] = [
    {
      id: 'ORD-2024-001',
      customer: { name: 'Emma Thompson' },
      item: {
        title: 'The Midnight Library',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book1.png'
      },
      date: '2024-01-15',
      payment: 'Credit Card',
      amount: 29.99,
      status: 'pending'
    },
    {
      id: 'ORD-2024-002',
      customer: { name: 'James Wilson' },
      item: {
        title: 'Project Hail Mary',
        qty: 2,
        cover: 'assets/img/dashboard/catalog/books/book2.png'
      },
      date: '2024-01-14',
      payment: 'PayPal',
      amount: 45.98,
      status: 'paid'
    },
    {
      id: 'ORD-2024-003',
      customer: { name: 'Sarah Parker' },
      item: {
        title: 'Atomic Habits',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book3.png'
      },
      date: '2024-01-14',
      payment: 'Credit Card',
      amount: 19.99,
      status: 'shipped'
    },
    {
      id: 'ORD-2024-004',
      customer: { name: 'Michael Brown' },
      item: {
        title: 'The Psychology of Money',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book4.png'
      },
      date: '2024-01-13',
      payment: 'Credit Card',
      amount: 24.99,
      status: 'completed'
    },
    {
      id: 'ORD-2024-001',
      customer: { name: 'Emma Thompson' },
      item: {
        title: 'The Midnight Library',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book1.png'
      },
      date: '2024-01-15',
      payment: 'Credit Card',
      amount: 29.99,
      status: 'pending'
    },
    {
      id: 'ORD-2024-002',
      customer: { name: 'James Wilson' },
      item: {
        title: 'Project Hail Mary',
        qty: 2,
        cover: 'assets/img/dashboard/catalog/books/book2.png'
      },
      date: '2024-01-14',
      payment: 'PayPal',
      amount: 45.98,
      status: 'paid'
    },
    {
      id: 'ORD-2024-003',
      customer: { name: 'Sarah Parker' },
      item: {
        title: 'Atomic Habits',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book3.png'
      },
      date: '2024-01-14',
      payment: 'Credit Card',
      amount: 19.99,
      status: 'shipped'
    },
    {
      id: 'ORD-2024-004',
      customer: { name: 'Michael Brown' },
      item: {
        title: 'The Psychology of Money',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book4.png'
      },
      date: '2024-01-13',
      payment: 'Credit Card',
      amount: 24.99,
      status: 'completed'
    },
    {
      id: 'ORD-2024-001',
      customer: { name: 'Emma Thompson' },
      item: {
        title: 'The Midnight Library',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book1.png'
      },
      date: '2024-01-15',
      payment: 'Credit Card',
      amount: 29.99,
      status: 'pending'
    },
    {
      id: 'ORD-2024-002',
      customer: { name: 'James Wilson' },
      item: {
        title: 'Project Hail Mary',
        qty: 2,
        cover: 'assets/img/dashboard/catalog/books/book2.png'
      },
      date: '2024-01-14',
      payment: 'PayPal',
      amount: 45.98,
      status: 'paid'
    },
    {
      id: 'ORD-2024-003',
      customer: { name: 'Sarah Parker' },
      item: {
        title: 'Atomic Habits',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book3.png'
      },
      date: '2024-01-14',
      payment: 'Credit Card',
      amount: 19.99,
      status: 'shipped'
    },
    {
      id: 'ORD-2024-004',
      customer: { name: 'Michael Brown' },
      item: {
        title: 'The Psychology of Money',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book4.png'
      },
      date: '2024-01-13',
      payment: 'Credit Card',
      amount: 24.99,
      status: 'completed'
    },
    {
      id: 'ORD-2024-001',
      customer: { name: 'Emma Thompson' },
      item: {
        title: 'The Midnight Library',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book1.png'
      },
      date: '2024-01-15',
      payment: 'Credit Card',
      amount: 29.99,
      status: 'pending'
    },
    {
      id: 'ORD-2024-002',
      customer: { name: 'James Wilson' },
      item: {
        title: 'Project Hail Mary',
        qty: 2,
        cover: 'assets/img/dashboard/catalog/books/book2.png'
      },
      date: '2024-01-14',
      payment: 'PayPal',
      amount: 45.98,
      status: 'paid'
    },
    {
      id: 'ORD-2024-003',
      customer: { name: 'Sarah Parker' },
      item: {
        title: 'Atomic Habits',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book3.png'
      },
      date: '2024-01-14',
      payment: 'Credit Card',
      amount: 19.99,
      status: 'shipped'
    },
    {
      id: 'ORD-2024-004',
      customer: { name: 'Michael Brown' },
      item: {
        title: 'The Psychology of Money',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book4.png'
      },
      date: '2024-01-13',
      payment: 'Credit Card',
      amount: 24.99,
      status: 'completed'
    },
    {
      id: 'ORD-2024-001',
      customer: { name: 'Emma Thompson' },
      item: {
        title: 'The Midnight Library',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book1.png'
      },
      date: '2024-01-15',
      payment: 'Credit Card',
      amount: 29.99,
      status: 'pending'
    },
    {
      id: 'ORD-2024-002',
      customer: { name: 'James Wilson' },
      item: {
        title: 'Project Hail Mary',
        qty: 2,
        cover: 'assets/img/dashboard/catalog/books/book2.png'
      },
      date: '2024-01-14',
      payment: 'PayPal',
      amount: 45.98,
      status: 'paid'
    },
    {
      id: 'ORD-2024-003',
      customer: { name: 'Sarah Parker' },
      item: {
        title: 'Atomic Habits',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book3.png'
      },
      date: '2024-01-14',
      payment: 'Credit Card',
      amount: 19.99,
      status: 'shipped'
    },
    {
      id: 'ORD-2024-004',
      customer: { name: 'Michael Brown' },
      item: {
        title: 'The Psychology of Money',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book4.png'
      },
      date: '2024-01-13',
      payment: 'Credit Card',
      amount: 24.99,
      status: 'completed'
    },
    {
      id: 'ORD-2024-001',
      customer: { name: 'Emma Thompson' },
      item: {
        title: 'The Midnight Library',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book1.png'
      },
      date: '2024-01-15',
      payment: 'Credit Card',
      amount: 29.99,
      status: 'pending'
    },
    {
      id: 'ORD-2024-002',
      customer: { name: 'James Wilson' },
      item: {
        title: 'Project Hail Mary',
        qty: 2,
        cover: 'assets/img/dashboard/catalog/books/book2.png'
      },
      date: '2024-01-14',
      payment: 'PayPal',
      amount: 45.98,
      status: 'paid'
    },
    {
      id: 'ORD-2024-003',
      customer: { name: 'Sarah Parker' },
      item: {
        title: 'Atomic Habits',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book3.png'
      },
      date: '2024-01-14',
      payment: 'Credit Card',
      amount: 19.99,
      status: 'shipped'
    },
    {
      id: 'ORD-2024-004',
      customer: { name: 'Michael Brown' },
      item: {
        title: 'The Psychology of Money',
        qty: 1,
        cover: 'assets/img/dashboard/catalog/books/book4.png'
      },
      date: '2024-01-13',
      payment: 'Credit Card',
      amount: 24.99,
      status: 'completed'
    },
    {
      id: 'ORD-2024-005',
      customer: { name: 'Lisa Anderson' },
      item: { title: 'Dune', qty: 1, cover: 'assets/img/dashboard/catalog/books/book1.png' },
      date: '2024-01-13',
      payment: 'PayPal',
      amount: 32.99,
      status: 'refunded'
    }
  ];

  // مصفوفة جاهزة للتمرير للجدول بعد الفلترة
  rows: OrderRow[] = [];
  totalCount = 0; // إجمالي عدد النتائج بعد الفلترة
  page = 1; // الصفحة الحالية

  // عدّادات التابات
  counts: { all: number; pending: number; paid: number; shipped: number; refunds: number } = {
    all: 0,
    pending: 0,
    paid: 0,
    shipped: 0,
    refunds: 0
  };

  // خيارات الفلاتر (لاستخدام app-modern-select لاحقًا)
  statusFilter: '' | Status = '';
  paymentFilter: '' | PaymentMethod = '';
  dateRangeStart = '';
  dateRangeEnd = '';

  statusOptions: { label: string; value: '' | Status }[] = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Paid', value: 'paid' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Completed', value: 'completed' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  paymentOptions: { label: string; value: '' | PaymentMethod }[] = [
    { label: 'All Payment Methods', value: '' },
    { label: 'Credit Card', value: 'Credit Card' },
    { label: 'PayPal', value: 'PayPal' },
    { label: 'Bank Transfer', value: 'Bank Transfer' },
    { label: 'Cash', value: 'Cash' }
  ];

  // Tabs meta (قراءة فقط، تتحدث من counts)
  get tabsMeta() {
    return [
      { key: 'all', label: 'All Orders', count: this.counts.all },
      { key: 'pending', label: 'Pending', count: this.counts.pending },
      { key: 'paid', label: 'Paid/Processing', count: this.counts.paid },
      { key: 'shipped', label: 'Shipped/Completed', count: this.counts.shipped },
      { key: 'refunds', label: 'Refunds & Cancellations', count: this.counts.refunds }
    ] as Array<{ key: 'all' | 'pending' | 'paid' | 'shipped' | 'refunds'; label: string; count: number }>;
  }

  // ====== الكروت ======
  cards = [
    { label: 'Total Revenue', icon: 'fe fe-dollar-sign', prefix: '$', target: 45231.89, change: '+12.5%', changeColor: '#22C55E', decimals: 2 },
    { label: 'Total Orders', icon: 'fe fe-shopping-bag', prefix: '', target: 1234, change: '+8.3%', changeColor: '#22C55E', decimals: 0 },
    { label: 'Total Customers', icon: 'fe fe-users', prefix: '', target: 892, change: '+5.7%', changeColor: '#22C55E', decimals: 0 },
    { label: 'Avg. Order Value', icon: 'fe fe-package', prefix: '$', target: 36.72, change: '+2.4%', changeColor: '#22C55E', decimals: 2 }
  ];
  numbers: number[] = this.cards.map(() => 0);
  duration = 2000;
  startTime = 0;

  // ---------- الشارتات ----------
  revenueData: { month: string; sales: number }[] = [];
  lineCats: string[] = [];
  lineVals: number[] = [];
  barCats: string[] = ['Fiction', 'Academic', 'Children', 'Business'];
  barVals: number[] = [];

  constructor(private publicService: PublicService) {
    // حساب حجم الصفحة مرة واحدة فقط
    this.pageSize = this.publicService.getNumOfRows(450, 85);
  }

  // ====== Lifecycle ======
  ngOnInit(): void {
    // كروت
    this.startTime = performance.now();
    this.animateNumbers();

    // Line defaults
    this.lineCats = this.getLastSixMonthsLabels();
    this.lineVals = Array(6).fill(0);

    // Bar defaults
    this.barVals = Array(4).fill(0);

    // بيانات الشارتات (محاكاة)
    this.loadRevenueData();
    this.loadBarData();

    // جهّز العدّادات والصفوف
    this.updateCountsFromOrders();
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    this.moveUnderline();
  }

  // ====== تبويب + فلترة الصفوف ======
  setTab(tab: 'all' | 'pending' | 'paid' | 'shipped' | 'refunds') {
    this.activeTab = tab;
    this.page = 1; // إعادة تعيين للصفحة الأولى عند تغيير التاب
    this.moveUnderline();
    this.applyFilters();
  }

  onStatusChange(val: '' | Status) {
    this.statusFilter = val;
    this.page = 1; // إعادة تعيين للصفحة الأولى عند تغيير الفلتر
    this.applyFilters();
  }

  onPaymentChange(val: '' | PaymentMethod) {
    this.paymentFilter = val;
    this.page = 1; // إعادة تعيين للصفحة الأولى عند تغيير الفلتر
    this.applyFilters();
  }

  // معالج تغيير نطاق التاريخ
  onDateRangeChange(range: { start: string; end: string }) {
    this.dateRangeStart = range.start;
    this.dateRangeEnd = range.end;
    this.page = 1; // إعادة تعيين للصفحة الأولى عند تغيير الفلتر
    this.applyFilters();
  }

  // معالج تغيير الصفحة
  onPageChange(newPage: number) {
    this.page = newPage;
    this.applyFilters();
  }

  private applyFilters() {
    // تشغيل skeleton loader
    this.isLoading$.next(true);
    
    // محاكاة API call مع تأخير
    setTimeout(() => {
      const paidGroup: Status[] = ['paid', 'processing'];
      const shippedGroup: Status[] = ['shipped', 'completed'];
      const refundGroup: Status[] = ['refunded', 'cancelled'];

      let filteredData = [...this.orders];

      // تبويب
      if (this.activeTab === 'pending') filteredData = filteredData.filter(o => o.status === 'pending');
      else if (this.activeTab === 'paid') filteredData = filteredData.filter(o => paidGroup.includes(o.status));
      else if (this.activeTab === 'shipped') filteredData = filteredData.filter(o => shippedGroup.includes(o.status));
      else if (this.activeTab === 'refunds') filteredData = filteredData.filter(o => refundGroup.includes(o.status));
      // else all

      // فلاتر إضافية
      if (this.statusFilter) filteredData = filteredData.filter(o => o.status === this.statusFilter);
      if (this.paymentFilter) filteredData = filteredData.filter(o => o.payment === this.paymentFilter);
      
      // فلتر التاريخ
      if (this.dateRangeStart && this.dateRangeEnd) {
        filteredData = filteredData.filter(o => {
          const orderDate = new Date(o.date);
          const startDate = new Date(this.dateRangeStart);
          const endDate = new Date(this.dateRangeEnd);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }

      // حفظ إجمالي العدد بعد الفلترة
      this.totalCount = filteredData.length;

      // تطبيق الـ pagination - استخدام الـ size الموحد
      const size = this.pageSize;
      const startIndex = (this.page - 1) * size;
      const endIndex = startIndex + size;
      this.rows = filteredData.slice(startIndex, endIndex);

      this.isLoading$.next(false);
    }, 500); // تأخير واقعي مثل جدول الكتب
  }

  // حساب حجم الصفحة (نفس الطريقة المستخدمة في orders-table)
  private getPageSize(): number {
    // إرجاع القيمة المحسوبة مسبقاً
    return this.pageSize;
  }

  private updateCountsFromOrders() {
    const paidGroup: Status[] = ['paid', 'processing'];
    const shippedGroup: Status[] = ['shipped', 'completed'];
    const refundGroup: Status[] = ['refunded', 'cancelled'];

    this.counts.all = this.orders.length;
    this.counts.pending = this.orders.filter(o => o.status === 'pending').length;
    this.counts.paid = this.orders.filter(o => paidGroup.includes(o.status)).length;
    this.counts.shipped = this.orders.filter(o => shippedGroup.includes(o.status)).length;
    this.counts.refunds = this.orders.filter(o => refundGroup.includes(o.status)).length;
  }

  private moveUnderline() {
    setTimeout(() => {
      const activeEl = this.tabBtns.find(el => el.nativeElement.classList.contains('active'));
      if (activeEl) {
        this.underlineLeft = activeEl.nativeElement.offsetLeft;
        this.underlineWidth = activeEl.nativeElement.offsetWidth;
      }
    });
  }

  // ------- بيانات الشارتات -------
  loadRevenueData(): void {
    setTimeout(() => {
      this.revenueData = this.generateLastSixMonthsRevenue();
      this.lineCats = this.revenueData.map(x => x.month);
      this.lineVals = this.revenueData.map(x => x.sales);
    }, 800);
  }

  loadBarData(): void {
    setTimeout(() => {
      this.barVals = [4100, 3000, 2800, 1900];
    }, 1200);
  }

  generateLastSixMonthsRevenue(): { month: string; sales: number }[] {
    const currentDate = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData: { month: string; sales: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      const baseSales = 50000;
      const variation = Math.floor(Math.random() * 40000);
      const growth = i * 5000;
      const sales = baseSales + variation + growth;
      revenueData.push({ month: monthName, sales });
    }
    return revenueData;
  }

  private getLastSixMonthsLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' }));
    }
    return labels;
  }

  getDigits(i: number): string {
    const d = this.cards[i].decimals ?? 0;
    return `1.${d}-${d}`;
  }

  // عدّاد الكروت
  animateNumbers(): void {
    const animateFrame = (timestamp: number) => {
      const elapsed = timestamp - this.startTime;
      let p = elapsed / this.duration;
      p = 1 - Math.pow(1 - Math.min(p, 1), 3);
      this.numbers = this.cards.map(c => Math.min(c.target, c.target * p));
      if (elapsed < this.duration) requestAnimationFrame(animateFrame);
    };
    requestAnimationFrame(animateFrame);
  }
}
