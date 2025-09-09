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
  /** مدخلات جنريك */
  @Input() categories?: string[];
  @Input() values?: number[];
  @Input() seriesName: string = 'revenue';
  @Input() color: string = '#5BBDB7';
  @Input() height: number = 320; // ← جديد

  /** توافق قديم (اختياري) */
  @Input() orderData: OrderPoint[] = [];

  chartOptionsRevenue: any;
  animationState = 'init';
  hasData = false;

  private defaultCats = this.getLastSixMonthsLabels();
  private defaultVals = Array(6).fill(0);

  constructor() { this.loadInitialData(); }
  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.categories?.length && this.values?.length) {
      const hasRealData = this.values.some(v => v > 0);
      if (hasRealData && !this.hasData) {
        this.hasData = true;
        this.animationState = 'updated-' + Date.now();
        setTimeout(() => this.chartOptionsRevenue = this.buildChart(this.categories!, this.values!), 100);
      } else {
        this.chartOptionsRevenue = this.buildChart(this.categories, this.values);
      }
      return;
    }

    if (changes['orderData']) {
      const { labels, series } = this.aggregateLastSixMonths(this.orderData);
      const hasRealData = series.some(v => v > 0);
      if (hasRealData && !this.hasData) {
        this.hasData = true;
        this.animationState = 'updated-' + Date.now();
        setTimeout(() => this.chartOptionsRevenue = this.buildChart(labels, series), 100);
      } else {
        this.chartOptionsRevenue = this.buildChart(labels, series);
      }
      return;
    }
  }

  loadInitialData() { this.chartOptionsRevenue = this.buildChart(this.defaultCats, this.defaultVals); }

  getLastSixMonthsLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' })); // Jan
    }
    return labels;
  }

  aggregateLastSixMonths(data: OrderPoint[]) {
    const labels = this.getLastSixMonthsLabels();
    const keys = labels.map((_, idx) => {
      const base = new Date(); base.setMonth(base.getMonth() - (5 - idx), 1);
      return `${base.getFullYear()}-${base.getMonth()}`;
    });
    const bucket: Record<string, number> = {}; keys.forEach(k => bucket[k] = 0);

    for (const p of data || []) {
      if (p.month && (p.sales ?? p.total_orders) !== undefined) {
        const monthIdx = new Date(`${p.month} 1, ${new Date().getFullYear()}`).getMonth();
        const key = `${new Date().getFullYear()}-${monthIdx}`;
        if (bucket[key] !== undefined) bucket[key] += Number(p.sales ?? p.total_orders) || 0;
        continue;
      }
      if (p.date) {
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (bucket[key] !== undefined) bucket[key] += Number(p.total_orders ?? 0);
      }
    }

    const series = keys.map(k => bucket[k] ?? 0);
    return { labels, series };
  }

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
          speed: this.hasData ? 1200 : 400,
          animateGradually: { enabled: true, delay: this.hasData ? 200 : 50 },
          dynamicAnimation: { enabled: true, speed: this.hasData ? 500 : 200 }
        }
      },
      xaxis: {
        categories,
        labels: { style: { fontSize: '13px', colors: Array(categories.length).fill('#6B7280') } },
        axisBorder: { color: '#9CA3AF' },
        axisTicks: { color: '#9CA3AF' }
      },
      yaxis: {
        labels: {
          style: { colors: ['#6B7280'] },
          formatter: (v: number) => v.toLocaleString() // ← بدون $
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3, colors: [this.color] },
      colors: [this.color],
      markers: { size: 4, colors: ['#fff'], strokeColors: this.color, strokeWidth: 2, hover: { size: 6 } },
      tooltip: { enabled: true, y: { formatter: (v: number) => '$' + v.toLocaleString() } },
      legend: { show: false }, // ← نعطلها، عندنا ليجند HTML بالمنتصف
      grid: { borderColor: '#E5E7EB', strokeDashArray: 6 }
    };
  }
}
