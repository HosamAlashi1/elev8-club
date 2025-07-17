import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';
import { ToastrsService } from '../../../services/toater.service';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  chartOptions: any;
  isLoading$ = new BehaviorSubject<boolean>(true);

  constructor(
    private api: ApiService,
    private httpService: HttpService,
    private toastr: ToastrsService
  ) {}

  ngOnInit(): void {
    this.initializeChart();
    this.loadChartData();
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [
        {
          name: 'Orders',
          data: [0, 0, 0, 0, 0] // Start with zeros for animation
        }
      ],
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
      xaxis: {
        categories: ['Loading...', 'Loading...', 'Loading...', 'Loading...', 'Loading...'],
        labels: {
          style: {
            fontSize: '13px',
            colors: ['#555', '#555', '#555', '#555', '#555']
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#000']
        },
        offsetY: -10
      },
      plotOptions: {
        bar: {
          distributed: true,
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 5
        }
      },
      colors: ['#d81b60', '#ec407a', '#f06292', '#f48fb1', '#de4ab9'],
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val} Orders`
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
    
    this.httpService.listGet(this.api.reports.topRestaurants, 'topRestaurantsChart').subscribe({
      next: (res: any) => {
        console.log('Top Restaurants API Response:', res); // Debug log
        
        if (res?.status && res?.items && Array.isArray(res.items)) {
          if (res.items.length === 0) {
            console.log('No restaurants received from API');
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
        console.error('Error loading top restaurants chart:', error);
        this.handleError('Failed to load chart data');
        this.isLoading$.next(false);
      }
    });
  }

  private processChartData(items: any[]): void {
    console.log('Raw API data:', items); // Debug log
    
    // Take only first 5 items
    const topFiveRestaurants = items.slice(0, 5);
    
    if (topFiveRestaurants.length === 0) {
      this.showNoDataChart();
      return;
    }

    // Extract data for chart
    const chartData = topFiveRestaurants.map(item => item.orders_count || 0);
    const categories = topFiveRestaurants.map(item => this.truncateName(item.restaurant?.name || 'Unknown'));

    console.log('Processed data:', { data: chartData, categories }); // Debug log

    // Update chart with animation
    setTimeout(() => {
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: 'Orders',
          data: chartData
        }],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: categories
        }
      };
    }, 300); // Small delay for smooth transition
  }

  private truncateName(name: string): string {
    // Truncate long restaurant names to fit better in the chart
    if (name.length > 15) {
      return name.substring(0, 12) + '...';
    }
    return name;
  }

  private showNoDataChart(): void {
    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: 'Orders',
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
