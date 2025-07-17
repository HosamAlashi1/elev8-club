import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnChanges {
  @Input() orderData: any[] = [];
  chartOptionsWeeklyOrders: any;

  last7Days: string[] = [];

  constructor() {
    this.last7Days = this.getLast7Days();

    this.chartOptionsWeeklyOrders = this.buildChart(this.last7Days, Array(7).fill(0));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['orderData'] && this.orderData?.length > 0) {
      const categories = this.orderData.map(x => this.formatDateLabel(x.date));
      const data = this.orderData.map(x => x.total_orders);
      this.chartOptionsWeeklyOrders = this.buildChart(categories, data);
    }
  }

  getLast7Days(): string[] {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(this.formatDateLabel(d.toISOString()));
    }
    return dates;
  }


  formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' }); // Jul
    return `${day} ${month}`;
  }


  buildChart(categories: string[], data: number[]) {
    console.log(data);

    return {
      series: [
        {
          name: 'Orders',
          data
        }
      ],
      chart: {
        type: 'line',
        height: window.innerHeight - 395,
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
            speed: 800
          }
        }
      },
      xaxis: {
        categories,
        labels: {
          style: {
            fontSize: '13px',
            colors: Array(categories.length).fill('#666')
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: ['#c2185b'],
      tooltip: {
        enabled: true
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: ['#de4ab9'],
          opacityFrom: 0.9,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      plotOptions: {
        bar: {} // dummy
      },
      legend: {
        show: false
      }
    };
  }
}
