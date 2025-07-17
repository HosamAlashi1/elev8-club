import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';

@Component({
  selector: 'app-revenue-chart',
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.css']
})
export class RevenueChartComponent implements OnInit {

  chartOptions: any = {};

  constructor(private api: ApiService, private http: HttpService) { }

  ngOnInit(): void {
    // بيانات مبدئية صفر
    this.initChart(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], [0, 0, 0, 0, 0, 0, 0]);

    // استدعاء API
    this.http.listGet(this.api.reports.revenue).subscribe({
      next: (res: any) => {
        console.log('Revenue API Response:', res); // Debug log
        
        if (res.status && res.items && Array.isArray(res.items)) {
          const dates = res.items.map((d: any) => this.formatMonth(d.date));
          const revenues = res.items.map((d: any) => parseFloat(d.revenue) || 0);

          console.log('Processed revenue data:', { dates, revenues }); // Debug log

          this.chartOptions = {
            ...this.chartOptions,
            series: [{ name: 'Revenue', data: revenues }],
            xaxis: { ...this.chartOptions.xaxis, categories: dates }
          };
        } else {
          console.error('Invalid revenue data format:', res);
        }
      },
      error: (error: any) => {
        console.error('Error loading revenue chart:', error);
      }
    });
  }

  initChart(categories: string[], data: number[]) {
    this.chartOptions = {
      series: [
        {
          name: 'Revenue',
          data: data
        }
      ],
      chart: {
        type: 'line',
        height: 300,
        zoom: { enabled: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          }
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '13px',
            colors: ['#666']
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      colors: ['#c2185b'],
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          gradientToColors: ['#de4ab9'],
          opacityFrom: 0.9,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      legend: { show: false }
    };
  }

  formatMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'short' }); // "Jan", "Feb" ...
  }
}
