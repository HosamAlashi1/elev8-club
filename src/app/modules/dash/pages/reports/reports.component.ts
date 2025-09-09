import { Component, OnInit } from '@angular/core';

type StatCard = {
  label: string;
  icon: string;
  prefix?: string;
  target: number;
  change: string;      // "+12.5%" أو "-2.4%"
  decimals?: number;   // عدد المنازل العشرية
  changeColor?: string; // سيُهمل لو استخدمنا getChangeColor()
};

type TopBook = {
  rank: number; title: string; author: string;
  units: number; revenue: number; cover: string;
};

type DownloadItem = {
  title: string; author: string; downloads: number;
  revenue: number; last: string; cover: string;
};

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

  /** لون البراند */
  readonly brandColor = '#5BBDB7';

  // ====== الكروت ======
  cards: StatCard[] = [
    { label: 'Total Revenue',        icon: 'fe fe-dollar-sign',   prefix: '$', target: 124567, change: '+12.5%', decimals: 0 },
    { label: 'Total Orders',         icon: 'fe fe-shopping-cart', prefix: '',  target: 1234,   change: '+8.2%',  decimals: 0 },
    { label: 'Average Order Value',  icon: 'fe fe-bar-chart-2',   prefix: '$', target: 101,    change: '-2.4%',  decimals: 0 },
    { label: 'Digital Downloads',    icon: 'fe fe-download',      prefix: '',  target: 456,    change: '+15.3%', decimals: 0 }
  ];
  numbers: number[] = this.cards.map(() => 0);
  duration = 2000;
  startTime = 0;

  // ---------- الشارتات ----------
  lineCats: string[] = ['Jan','Feb','Mar','Apr','May','Jun'];
  lineVals: number[]  = [60000,70000,75000,82000,90000,100000];

  barCats: string[] = ['Fiction','Non-Fiction','Children','Academic'];
  barVals: number[]  = [48000,34000,22000,18000];

  pieData = [
    { name: 'Credit Card', value: 60 },
    { name: 'PayPal',      value: 25 },
    { name: 'Cash',        value: 15 }
  ];
  /** تحضير للدونات */
  pieLabels = this.pieData.map(x => x.name);
  pieValues = this.pieData.map(x => x.value);
  pieColors = [this.brandColor, '#22C55E', '#0F766E'];

  // ---------- Top Books ----------
  topBooks: TopBook[] = [
    { rank: 1, title: 'The Great Adventure', author: 'John Smith', units: 234, revenue: 2340, cover: 'assets/img/dashboard/reports/top-books/book1.png' },
    { rank: 2, title: 'The Great Adventure', author: 'John Smith', units: 234, revenue: 2340, cover: 'assets/img/dashboard/reports/top-books/book2.png' },
    { rank: 3, title: 'The Great Adventure', author: 'John Smith', units: 234, revenue: 2340, cover: 'assets/img/dashboard/reports/top-books/book3.png' }
  ];

  // ---------- Digital Downloads ----------
  downloads: DownloadItem[] = [
    { title: 'The Great Adventure', author: 'John Smith', downloads: 123, revenue: 1230, last: '2024-01-15', cover: 'assets/img/dashboard/reports/digital-downloads/book1.png' },
    { title: 'The Great Adventure', author: 'John Smith', downloads: 123, revenue: 1230, last: '2024-01-15', cover: 'assets/img/dashboard/reports/digital-downloads/book2.png' },
    { title: 'The Great Adventure', author: 'John Smith', downloads: 123, revenue: 1230, last: '2024-01-15', cover: 'assets/img/dashboard/reports/digital-downloads/book3.png' },
    { title: 'The Great Adventure', author: 'John Smith', downloads: 123, revenue: 1230, last: '2024-01-15', cover: 'assets/img/dashboard/reports/digital-downloads/book4.png' }
  ];

  ngOnInit(): void {
    this.startTime = performance.now();
    this.animateNumbers();
  }

  /** تنسيق الأرقام حسب الديسمالز */
  getDigits(i: number): string {
    const d = this.cards[i].decimals ?? 0;
    return `1.${d}-${d}`;
  }

  /** لون التغيير تلقائيًا */
  getChangeColor(change: string): string {
    return this.isPositive(change) ? '#22C55E' : '#EF4444';
  }
  /** أيقونة السهم للتغيير */
  getChangeIcon(change: string): string {
    return this.isPositive(change) ? 'fe fe-arrow-up' : 'fe fe-arrow-down';
  }
  /** موجب/سالب */
  private isPositive(change: string): boolean {
    return change.trim().startsWith('+');
  }

  /** لتحسين أداء *ngFor */
  trackByCard = (_: number, c: StatCard) => c.label;

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
