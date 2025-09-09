import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';

type OrderPoint = { month?: string; date?: string; total_orders?: number; sales?: number };

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css'],
  animations: [
    trigger('chartAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('chartUpdate', [
      transition('* => *', [
        style({ opacity: 0.7, transform: 'scale(0.98)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class LineChartComponent implements OnInit, OnChanges {
  /** طريقة 1: داتا جنريك */
  @Input() categories?: string[];          // مثل: ['Jan','Feb',...]
  @Input() values?: number[];              // مثل: [3800,3000,...]
  @Input() seriesName: string = 'sales';
  @Input() color: string = '#5BBDB7';

  /** طريقة 2: توافقًا مع القديم (تجميع شهري لآخر 6 شهور) */
  @Input() orderData: OrderPoint[] = [];   // { date, total_orders } أو { month, sales }

  chartOptionsRevenue: any;
  showChart = true;
  animationState = 'init';
  hasData = false; // للتحكم في عرض البيانات الحقيقية

  // افتراضي: آخر 6 شهور بقيم صفر (إلى أن تصل الداتا)
  private defaultCats = this.getLastSixMonthsLabels();
  private defaultVals = Array(6).fill(0);

  constructor() {
    this.loadInitialData();
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    // 1) إن وُجدت جنريك categories/values نستخدمها مباشرة
    if (this.categories?.length && this.values?.length) {
      // التحقق من وجود بيانات حقيقية (غير صفار)
      const hasRealData = this.values.some(v => v > 0);
      if (hasRealData && !this.hasData) {
        this.hasData = true;
        this.animationState = 'updated-' + Date.now();
        // تأخير بسيط لضمان الأنيميشن
        setTimeout(() => {
          this.chartOptionsRevenue = this.buildChart(this.categories!, this.values!);
        }, 100);
      } else if (!hasRealData) {
        // عرض القيم الصفرية
        this.chartOptionsRevenue = this.buildChart(this.categories, this.values);
      } else {
        // تحديث عادي
        this.chartOptionsRevenue = this.buildChart(this.categories, this.values);
      }
      return;
    }

    // 2) تحويل orderData (month/sales أو date/total_orders) لآخر 6 شهور
    if (changes['orderData']) {
      const { labels, series } = this.aggregateLastSixMonths(this.orderData);
      const hasRealData = series.some(v => v > 0);
      
      if (hasRealData && !this.hasData) {
        this.hasData = true;
        this.animationState = 'updated-' + Date.now();
        setTimeout(() => {
          this.chartOptionsRevenue = this.buildChart(labels, series);
        }, 100);
      } else {
        this.chartOptionsRevenue = this.buildChart(labels, series);
      }
      return;
    }
  }

  // ---------- داتا افتراضية ----------
  loadInitialData() {
    this.chartOptionsRevenue = this.buildChart(this.defaultCats, this.defaultVals);
  }

  getLastSixMonthsLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' })); // Jan
    }
    return labels;
  }

  /** تجميع آخر 6 شهور من orderData مع دعم month/sales أو date/total_orders */
  aggregateLastSixMonths(data: OrderPoint[]) {
    const labels = this.getLastSixMonthsLabels();

    // مفاتيح Y-M ثابتة لضمان الترتيب
    const keys = labels.map((_, idx) => {
      const base = new Date(); base.setMonth(base.getMonth() - (5 - idx), 1);
      return `${base.getFullYear()}-${base.getMonth()}`;
    });

    const bucket: Record<string, number> = {};
    keys.forEach(k => bucket[k] = 0);

    for (const p of data || []) {
      // لو جاي بصيغة month/sales
      if (p.month && (p.sales ?? p.total_orders) !== undefined) {
        // حوّل اسم الشهر لمفتاح Y-M تقريبي للسنة الحالية
        const monthIdx = new Date(`${p.month} 1, ${new Date().getFullYear()}`).getMonth();
        const key = `${new Date().getFullYear()}-${monthIdx}`;
        if (bucket[key] !== undefined) bucket[key] += Number(p.sales ?? p.total_orders) || 0;
        continue;
      }
      // لو جاي بصيغة date/total_orders
      if (p.date) {
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (bucket[key] !== undefined) bucket[key] += Number(p.total_orders ?? 0);
      }
    }

    const series = keys.map(k => bucket[k] ?? 0);
    return { labels, series };
  }

  // ---------- إعدادات الشارت (مطابقة للكود اللي أرسلته) ----------
  buildChart(categories: string[], data: number[]) {
    return {
      series: [{ name: this.seriesName, data }],
      chart: {
        type: 'line',
        height: window.innerHeight - 470,
        width: '100%',
        zoom: { enabled: false },
        toolbar: { show: false },
        parentHeightOffset: 0,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: this.hasData ? 1200 : 400, // أنيميشن أطول للبيانات الحقيقية
          animateGradually: { 
            enabled: true, 
            delay: this.hasData ? 200 : 50 
          },
          dynamicAnimation: { 
            enabled: true, 
            speed: this.hasData ? 500 : 200 
          }
        }
      },
      responsive: [
        {
          breakpoint: 768,
          options: { chart: { height: 250 }, legend: { position: 'bottom' } }
        },
        {
          breakpoint: 576,
          options: {
            chart: { height: window.innerHeight - 395 },
            xaxis: { labels: { style: { fontSize: '11px' } } }
          }
        }
      ],
      xaxis: {
        categories,
        labels: { style: { fontSize: '13px', colors: Array(categories.length).fill('#6b7280') } }
      },
      yaxis: {
        labels: {
          style: { colors: ['#6b7280'] },
          formatter: (v: number) => '$' + (v / 1000).toFixed(0) + 'k'
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3, colors: [this.color] },
      colors: [this.color],
      markers: {
        size: 5, colors: ['#fff'], strokeColors: this.color, strokeWidth: 2,
        hover: { size: 7 }
      },
      tooltip: {
        enabled: true,
        y: { formatter: (v: number) => '$' + v.toLocaleString() }
      },
      legend: { show: true, position: 'bottom', labels: { colors: this.color } },
      grid: { borderColor: '#f0f0f0', strokeDashArray: 3 }
    };
  }
}
