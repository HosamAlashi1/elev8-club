import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnChanges {
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() colors: string[] = ['#5BBDB7', '#22C55E', '#0F766E'];
  @Input() height: number = 300;

  opts: any = {};

  ngOnChanges(_: SimpleChanges): void {
    this.build();
  }

  // pie-chart.component.ts (استبدل build() بالتالي)
  private build() {
    const safeValues = (this.values?.length ? this.values : [0, 0, 0]);
    const safeLabels = (this.labels?.length ? this.labels : ['A', 'B', 'C']);

    this.opts = {
      series: safeValues,
      labels: safeLabels,
      chart: {
        type: 'donut',
        height: this.height,                 // ← تحكم من Input عند الاستخدام
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 700 }
      },
      plotOptions: {
        pie: {
          donut: { size: '68%' },            // سماكة الحلقة قريبة من التصميم
          expandOnClick: false               // بدون تكبير عند الضغط
        }
      },
      dataLabels: { enabled: false },
      // الفواصل + الحد الخارجي الأبيض
      stroke: { width: 4, colors: ['#ffffff'] },   // ← هذا اللي يطلع الفواصل والحد
      fill: { opacity: 1 },
      colors: this.colors,                   // ['#5BBDB7', '#22C55E', '#0F766E']
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '16px',
        labels: { colors: '#5BBDB7' },       // نص الليجند بلون البراند مثل الصورة
        markers: { width: 16, height: 16 }, // مربعات واضحة
        itemMargin: { horizontal: 18, vertical: 6 }
      },
      tooltip: {
        y: {
          formatter: (v: number) => v.toLocaleString() + (this.sum(safeValues) === 100 ? '%' : '')
        }
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: { height: 300 },    // خليه يكبر شوية
            legend: {
              position: 'bottom',
              fontSize: '13px',
              itemMargin: { horizontal: 10, vertical: 4 }
            },
            plotOptions: {
              pie: {
                donut: { size: '72%' } // سماكة أريح للموبايل
              }
            }
          }
        }
      ]
    };
  }


  private sum(a: number[]) { return a.reduce((s, x) => s + x, 0); }
}
