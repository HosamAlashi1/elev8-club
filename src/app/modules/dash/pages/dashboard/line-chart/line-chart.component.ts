import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
  @Input() revenueData: { month: string; sales: number }[] = [];
  chartOptionsRevenue: any;
  showChart: boolean = true;
  animationState: string = 'initial';

  constructor() {
    // تحميل الداتا الابتدائية مباشرة
    this.loadInitialData();
  }

  ngOnInit() {
    // لا حاجة لشيء هنا
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['revenueData'] && this.revenueData?.length > 0) {
      // تشغيل أنيميشن التحديث
      this.animationState = 'updated-' + Date.now();
      
      const categories = this.revenueData.map(x => x.month);
      const data = this.revenueData.map(x => x.sales);
      this.chartOptionsRevenue = this.buildChart(categories, data);
    }
  }

  loadInitialData() {
    // داتا ابتدائية لآخر 6 شهور بصفر revenue
    const initialData = this.generateLastSixMonthsData(0);

    const categories = initialData.map(x => x.month);
    const data = initialData.map(x => x.sales);
    this.chartOptionsRevenue = this.buildChart(categories, data);
  }

  // توليد داتا لآخر 6 شهور
  generateLastSixMonthsData(defaultSales: number = 0): { month: string; sales: number }[] {
    const currentDate = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data: { month: string; sales: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      data.push({ month: monthName, sales: defaultSales });
    }
    
    return data;
  }

  buildChart(categories: string[], data: number[]) {
    return {
      series: [
        {
          name: 'Revenue',
          data
        }
      ],
      chart: {
        type: 'line',
        height: 350,
        width: '100%',
        zoom: { enabled: false },
        toolbar: { show: false },
        parentHeightOffset: 0,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 250
            },
            legend: {
              position: 'bottom'
            }
          }
        },
        {
          breakpoint: 576,
          options: {
            chart: {
              height: 200
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: '11px'
                }
              }
            }
          }
        }
      ],
      xaxis: {
        categories,
        labels: {
          style: {
            fontSize: '13px',
            colors: Array(categories.length).fill('#6b7280')
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#6b7280']
          },
          formatter: function (value: number) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: ['#5BBDB7'],
      markers: {
        size: 5,
        colors: ['#fff'],
        strokeColors: '#5BBDB7',
        strokeWidth: 2,
        hover: {
          size: 7
        }
      },
      tooltip: { 
        enabled: true,
        y: {
          formatter: function (value: number) {
            return '$' + value.toLocaleString();
          }
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        labels: { colors: '#5BBDB7' }
      },
      grid: {
        borderColor: '#f0f0f0',
        strokeDashArray: 3
      }
    };
  }
}
