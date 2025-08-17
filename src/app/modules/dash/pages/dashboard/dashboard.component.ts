import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../services/api.service';
import { HttpService } from '../../../services/http.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Dashboard stats
  numbers: number[] = [0, 0, 0];
  targetNumbers: number[] = [0, 0, 0];
  duration: number = 2000;
  startTime: number = 0;

  contactMessagesData: { date: string; day: string; count: number }[] = [];


  dashboardCards = [
    {
      label: 'Contact Messages',
      icon: 'fa fa-envelope',
      route: '/contact-messages'
    },
    {
      label: 'Total Features',
      icon: 'fa fa-star',
      route: '/features'
    },
    {
      label: "Total Processes",
      icon: 'fa fa-cogs',
      route: '/processes'
    }
  ];


  constructor(
    private readonly api: ApiService,
    private readonly httpService: HttpService
  ) { }

  ngOnInit(): void {
    this.loadStatistics();
    console.log('Dashboard initialized');
    
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
    this.httpService.list(this.api.dashboard.home,{}).subscribe({
      next: (res: any) => {
        if (res?.status && res?.data) {
          const data = res.data;

          this.targetNumbers = [
            Number(data.total_contact_messages) || 0,
            Number(data.total_features) || 0,
            Number(data.total_processes) || 0
          ];

          this.contactMessagesData = data.contact_messages_last_7_days || [];

          this.startTime = performance.now();
          this.animateNumbers();
        }
      },
      error: () => {
        this.targetNumbers = [0, 0, 0];
        this.contactMessagesData = [];
      }
    });
  }


}
