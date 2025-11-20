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
  @Input() revenueData: { date: string; count: number }[] = [];
  chartOptionsRevenue: any;
  showChart: boolean = true;
  animationState: string = 'initial';

  constructor() {
    this.chartOptionsRevenue = this.buildChart([], []);
  }

  ngOnInit() {
    // لا حاجة لشيء هنا
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['revenueData'] && this.revenueData?.length > 0) {
      // تشغيل أنيميشن التحديث
      this.animationState = 'updated-' + Date.now();

      // تحويل التواريخ من YYYY-MM-DD إلى تنسيق قابل للقراءة
      const categories = this.revenueData.map(x => this.formatDate(x.date));
      const data = this.revenueData.map(x => x.count);
      this.chartOptionsRevenue = this.buildChart(categories, data);
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  buildChart(categories: string[], data: number[]) {
    return {
      series: [
        {
          name: 'Leads',
          data
        }
      ],
      chart: {
        type: 'area',
        height: 350,
        width: '100%',
        toolbar: { show: false },
        zoom: { enabled: false },
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
        },
        dropShadow: {
          enabled: true,
          top: 2,
          left: 0,
          blur: 4,
          opacity: 0.1,
          color: '#E4C98A'
        },
        parentHeightOffset: 0
      },

      // استجابة الشاشات الصغيرة
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: { height: 260 },
          }
        },
        {
          breakpoint: 576,
          options: {
            chart: { height: 200 },
            xaxis: {
              labels: {
                rotate: -45,
                style: { fontSize: '10px' }
              }
            }
          }
        }
      ],

      // الـ X Axis
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: 0,
          style: {
            colors: '#64748b',
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },

      // الـ Y Axis
      yaxis: {
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '12px',
            fontWeight: 500
          },
          formatter: (val: number) => Math.floor(val).toString()
        },
        min: 0
      },

      dataLabels: { enabled: false },

      stroke: {
        curve: 'smooth',
        width: 3,
        lineCap: 'round'
      },

      colors: ['#E4C98A'],

      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          shadeIntensity: 0.3,
          type: 'vertical',
          opacityFrom: 0.5,
          opacityTo: 0.05,
          stops: [0, 70, 100]
        }
      },

      markers: {
        size: 5,
        strokeWidth: 2,
        strokeColors: '#ffffff',
        colors: ['#E4C98A'],
        hover: {
          size: 7,
          sizeOffset: 2
        }
      },

      tooltip: {
        theme: 'light',
        style: {
          fontSize: '13px',
          fontFamily: 'inherit'
        },
        y: {
          formatter: (v: number) => `${v} leads`
        },
        marker: {
          show: true
        }
      },

      grid: {
        strokeDashArray: 4,
        borderColor: 'rgba(228,201,138,0.15)',
        padding: {
          top: 10,
          bottom: 10,
          left: 15,
          right: 15
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        xaxis: {
          lines: {
            show: false
          }
        }
      },

      legend: { show: false }
    };
  }

}
