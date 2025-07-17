import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnChanges {
  @Input() data: { date: string; revenue: number }[] = [];

  chartOptionsTopRestaurants: any;
  last7Days: string[] = [];

  constructor() {
    this.last7Days = this.getLast7Days();
    this.chartOptionsTopRestaurants = this.buildChart(this.last7Days, Array(7).fill(0));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data?.length > 0) {
      const categories = this.data.map(x => this.formatDateLabel(x.date));
      const values = this.data.map(x => x.revenue);
      this.chartOptionsTopRestaurants = this.buildChart(categories, values);
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

  buildChart(categories: string[], values: number[]): any {
    return {
      series: [
        {
          name: 'Revenue',
          data: values
        }
      ],
      chart: {
        type: 'bar',
        height: window.innerHeight - 395,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 500
        }
      },
      xaxis: {
        categories,
        labels: {
          style: {
            fontSize: '13px',
            colors: Array(categories.length).fill('#555')
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#000']
        },
        offsetY: -10,
        formatter: (val: number) => `$${val.toFixed(2)}`
      },
      plotOptions: {
        bar: {
          distributed: true,
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 5
        }
      },
      colors: ['#d81b60', '#ec407a', '#f06292', '#f48fb1', '#de4ab9', '#ba68c8', '#9c27b0'],
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      legend: {
        show: false
      },
      stroke: {
        show: false
      },
      fill: {
        type: 'solid',
        opacity: 1
      }
    };
  }
}
