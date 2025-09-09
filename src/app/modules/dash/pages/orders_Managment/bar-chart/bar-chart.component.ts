import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnChanges {
  /** جنريك */
  @Input() categories?: string[];
  @Input() values?: number[];
  @Input() seriesName: string = 'value';
  @Input() color: string = '#5BBDB7';

  /** توافقًا مع كودك القديم (سيتم تجاهله هنا لو مرّرت categories/values) */
  @Input() data: { date: string; revenue: number }[] = [];

  chartOptionsTopRestaurants: any;
  hasData = false; // للتحكم في عرض البيانات الحقيقية

  // افتراضي مطابق للصورة لكن بقيم صفر
  private defaultCats = ['Fiction', 'Academic', 'Children', 'Business'];
  private defaultVals = [0, 0, 0, 0]; // قيم صفر أولية

  constructor() {
    this.chartOptionsTopRestaurants = this.buildChart(this.defaultCats, this.defaultVals);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.categories?.length && this.values?.length) {
      // التحقق من وجود بيانات حقيقية (غير صفار)
      const hasRealData = this.values.some(v => v > 0);
      if (hasRealData && !this.hasData) {
        this.hasData = true;
        // تأخير بسيط لضمان الأنيميشن
        setTimeout(() => {
          this.chartOptionsTopRestaurants = this.buildChart(this.categories!, this.values!);
        }, 100);
      } else {
        this.chartOptionsTopRestaurants = this.buildChart(this.categories, this.values);
      }
      return;
    }
    
    if (changes['data'] && this.data?.length > 0) {
      const categories = this.data.map(x => this.formatDateLabel(x.date));
      const values = this.data.map(x => x.revenue);
      const hasRealData = values.some(v => v > 0);
      
      if (hasRealData && !this.hasData) {
        this.hasData = true;
        setTimeout(() => {
          this.chartOptionsTopRestaurants = this.buildChart(categories, values);
        }, 100);
      } else {
        this.chartOptionsTopRestaurants = this.buildChart(categories, values);
      }
      return;
    }
    
    // عرض القيم الافتراضية (صفار)
    this.chartOptionsTopRestaurants = this.buildChart(this.defaultCats, this.defaultVals);
  }

  private formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2,'0');
    const mon = date.toLocaleString('default', { month: 'short' });
    return `${mon} ${day}`;
  }

  private buildChart(categories: string[], values: number[]): any {
    return {
      series: [{ name: this.seriesName, data: values }],
      chart: {
        type: 'bar',
        height: window.innerHeight - 470,
        animations: { 
          enabled: true, 
          easing: 'easeinout', 
          speed: this.hasData ? 1200 : 400, // أنيميشن أطول للبيانات الحقيقية
          animateGradually: { 
            enabled: true, 
            delay: this.hasData ? 200 : 50 
          }
        },
        toolbar: { show: false }
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '48%', borderRadius: 6 }
      },
      dataLabels: { enabled: false }, // الصورة بدون أرقام فوق الأعمدة
      colors: [this.color],
      xaxis: {
        categories,
        labels: { style: { fontSize: '13px', colors: Array(categories.length).fill('#6b7280') } },
        axisBorder: { color: '#9CA3AF' },
        axisTicks: { color: '#9CA3AF' }
      },
      yaxis: { labels: { style: { colors: ['#6b7280'] } } },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 6 },
      tooltip: { enabled: true, y: { formatter: (v: number) => v.toLocaleString() } },
      legend: { show: true, labels: { colors: '#6b7280' } },
      fill: { type: 'solid', opacity: 1 },
      stroke: { show: false }
    };
  }
}
