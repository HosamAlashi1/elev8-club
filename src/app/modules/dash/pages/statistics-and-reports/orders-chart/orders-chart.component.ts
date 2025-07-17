import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';
import { ToastrsService } from '../../../services/toater.service';

@Component({
  selector: 'app-orders-chart',
  templateUrl: './orders-chart.component.html',
  styleUrls: ['./orders-chart.component.css']
})
export class OrdersChartComponent implements OnInit {
  chartOptions: any;
  isLoading$ = new BehaviorSubject<boolean>(true);

  constructor(
    private api: ApiService,
    private httpService: HttpService,
    private toastr: ToastrsService
  ) { }

  ngOnInit(): void {
    this.initializeChart();
    this.loadChartData();
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [{
        data: [0, 0, 0, 0, 0] // Start with zeros for animation
      }],
      chart: {
        type: 'bar',
        height: 300,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1000,
          animateGradually: {
            enabled: true,
            delay: 200
          },
          dynamicAnimation: {
            enabled: true,
            speed: 400
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          borderRadius: 6,
          distributed: true
        }
      },
      colors: ['#c2185b', '#d81b60', '#e91e63', '#f06292', '#f8bbd0'],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#fff'],
          fontSize: '12px',
          fontWeight: 'bold'
        },
        formatter: (val: number) => val > 0 ? `${val} orders` : ''
      },
      xaxis: {
        categories: ['Loading...', 'Loading...', 'Loading...', 'Loading...', 'Loading...'],
        labels: {
          style: {
            colors: '#555',
            fontSize: '14px'
          },
          maxHeight: 60,
          trim: true
        }
      },
      grid: {
        borderColor: '#eee',
        strokeDashArray: 4,
        row: {
          colors: ['#fafafa', '#fff']
        }
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val} orders`
        }
      },
      legend: {
        show: false
      },
      fill: {
        opacity: 0.9,
        type: 'solid'
      },
      noData: {
        text: 'Loading...',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          color: '#666',
          fontSize: '16px'
        }
      }
    };
  }

  private loadChartData(): void {
    this.isLoading$.next(true);

    this.httpService.listGet(this.api.reports.topOrders, 'topOrdersChart').subscribe({
      next: (res: any) => {
        console.log('API Response:', res); // Debug log

        if (res?.status && res?.items && Array.isArray(res.items)) {
          if (res.items.length === 0) {
            console.log('No items received from API');
            this.showNoDataChart();
          } else {
            this.processChartData(res.items);
          }
        } else {
          console.error('Invalid data format:', res);
          this.handleError('Invalid data format received');
        }
        this.isLoading$.next(false);
      },
      error: (error: any) => {
        console.error('Error loading top orders chart:', error);
        this.handleError('Failed to load chart data');
        this.isLoading$.next(false);
      }
    });
  }

  private processChartData(items: any[]): void {
    console.log('Raw API data:', items); // Debug log

    // Sort by total_orders descending and take top 5 directly without grouping
    const processedItems = items
      .sort((a: any, b: any) => b.total_orders - a.total_orders)
      .slice(0, 5);

    console.log('Processed data:', processedItems); // Debug log

    if (processedItems.length === 0) {
      this.showNoDataChart();
      return;
    }

    // Extract data for chart
    const chartData = processedItems.map((item: any) => item.total_orders);
    const categories = processedItems.map((item: any) => this.truncateName(item.name));

    console.log('Chart data:', { data: chartData, categories }); // Debug log

    // Update chart with animation
    setTimeout(() => {
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          data: chartData
        }],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: categories
        }
      };
    }, 300);
  }
  
  private truncateName(name: string): string {
    // Truncate long names to fit better in the chart
    if (name.length > 20) {
      return name.substring(0, 17) + '...';
    }
    return name;
  }

  private showNoDataChart(): void {
    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        data: []
      }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: []
      },
      noData: {
        text: 'No data available',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          color: '#666',
          fontSize: '16px'
        }
      }
    };
  }

  private handleError(message: string): void {
    this.toastr.Showerror(message);
    // Show fallback data or empty state
    this.showNoDataChart();
  }

  // Method to refresh data (can be called externally)
  refreshData(): void {
    this.initializeChart();
    this.loadChartData();
  }
}
