import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { HttpService } from '../../services/http.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Dashboard stats
  numbers: number[] = [0, 0, 0, 0];
  targetNumbers: number[] = [0, 0, 0, 0];
  duration: number = 2000;
  startTime: number = 0;

  weeklyOrders: { date: string; total_orders: number }[] = [];
  weeklyRevenue: { date: string; revenue: number }[] = [];


  dashboardCards = [
    {
      label: 'Total Restaurants',
      icon: 'fe fe-home',
      route: '/restaurants'
    },
    {
      label: 'Total Users',
      icon: 'fe fe-users',
      route: '/users'
    },
    {
      label: "Today's Orders",
      icon: 'fe fe-shopping-cart',
      route: '/orders?filter=today'
    },
    {
      label: 'Revenue',
      icon: 'fe fe-dollar-sign',
      route: '/revenue'
    }
  ];


  constructor(
    private readonly api: ApiService,
    private readonly httpService: HttpService
  ) { }

  ngOnInit(): void {
    this.loadStatistics();
  }

  // Animate dashboard number counters
  animateNumbers(): void {
    const animate = (timestamp: number) => {
      const elapsed = timestamp - this.startTime;
      let progress = elapsed / this.duration;
      progress = 1 - Math.pow(1 - Math.min(progress, 1), 3); // ease-out cubic

      this.numbers = this.targetNumbers.map((target) =>
        Math.min(Math.floor(target * progress), target)
      );

      if (elapsed < this.duration) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  loadStatistics(): void {
    this.httpService.listGet(this.api.dashboard.home).subscribe({
      next: (res: any) => {
        const stats = res.items;

        this.targetNumbers = [
          Number(stats.total_restaurants) || 0,
          Number(stats.total_users) || 0,
          Number(stats.todays_orders) || 0,
          parseFloat(stats.revenue) || 0
        ];

        this.weeklyOrders = stats.charts.orders || [];
        
        this.weeklyRevenue = stats.charts.revenue || [];

        this.startTime = performance.now();
        this.animateNumbers();
      },
      error: () => {
        this.targetNumbers = [0, 0, 0, 0];
        this.weeklyOrders = [];
        this.weeklyRevenue = [];
      }
    });
  }


}
