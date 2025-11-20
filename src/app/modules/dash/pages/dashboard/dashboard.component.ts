import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';
import { Version, Lead } from '../../../../core/models';
import { forkJoin } from 'rxjs';

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

  currentVersion: Version | null = null;

  // Chart data
  leadsPerDayData: { date: string; count: number }[] = [];

  // Dashboard cards
  dashboardCards = [
    {
      label: 'Total Leads',
      icon: 'fe fe-users',
      iconClass: 'icon-sales',
      prefix: ''
    },
    {
      label: 'Completed',
      icon: 'fe fe-check-circle',
      iconClass: 'icon-orders',
      prefix: ''
    },
    {
      label: 'Pending',
      icon: 'fe fe-clock',
      iconClass: 'icon-books',
      prefix: ''
    },
    {
      label: 'Active Affiliates',
      icon: 'fe fe-user-plus',
      iconClass: 'icon-customers',
      prefix: ''
    }
  ];

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit(): void {
    this.startTime = performance.now();
    this.loadCurrentVersion();
  }

  loadCurrentVersion(): void {
    console.log('🔍 Fetching current version...');
    this.firebaseService.getCurrentVersion().subscribe({
      next: (version: Version | null) => {
        console.log('✅ Current version received:', version);
        this.currentVersion = version;
        if (version) {
          console.log('📊 Version found, loading dashboard data...');
          this.loadDashboardData();
        } else {
          console.warn('⚠️ No current version found in Firebase');
        }
      },
      error: (err: any) => {
        console.error('❌ Error loading current version:', err);
      }
    });
  }

  loadDashboardData(): void {
    if (!this.currentVersion) {
      console.warn('⚠️ No current version available');
      return;
    }

    console.log('📊 Loading dashboard data for version:', this.currentVersion.name, 'Key:', this.currentVersion.key);

    // جلب جميع البيانات دفعة واحدة
    forkJoin({
      allLeads: this.firebaseService.getLeadsByVersion(this.currentVersion.key),
      allAffiliates: this.firebaseService.getAllAffiliates()
    }).subscribe({
      next: (data) => {
        const leads = data.allLeads;
        const affiliates = data.allAffiliates;

        // Card 1: Total Leads
        const totalLeads = leads.length;

        // Card 2: Completed Leads (step = 2)
        const completedLeads = leads.filter((l: Lead) => l.step === 2).length;

        // Card 3: Pending Leads (step = 1)
        const pendingLeads = leads.filter((l: Lead) => l.step === 1).length;

        // Card 4: Active Affiliates (unique affiliateKey من الليدز)
        const uniqueAffiliateKeys = new Set(
          leads
            .filter((l: Lead) => l.affiliateKey)
            .map((l: Lead) => l.affiliateKey)
        );
        const activeAffiliates = uniqueAffiliateKeys.size;

        // تحديث الأرقام للأنيميشن
        this.targetNumbers = [totalLeads, completedLeads, pendingLeads, activeAffiliates];
        console.log('📈 Statistics:', {
          totalLeads,
          completedLeads,
          pendingLeads,
          activeAffiliates
        });

        // تحضير بيانات الشارت: Leads Per Day
        this.leadsPerDayData = this.buildLeadsPerDayChart(leads);
        console.log('📊 Chart data points:', this.leadsPerDayData.length);

        this.animateNumbers();
      },
      error: (err: any) => {
        console.error('❌ Error loading dashboard data:', err);
      }
    });
  }

  buildLeadsPerDayChart(leads: Lead[]): { date: string; count: number }[] {
    const dateMap: { [key: string]: number } = {};
    const today = new Date();

    // Initialize last 7 days with 0 count
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = 0;
    }

    // Count leads per day (only for last 7 days)
    leads.forEach((lead: Lead) => {
      if (lead.createdAt) {
        const dateStr = lead.createdAt.split('T')[0];
        if (dateMap.hasOwnProperty(dateStr)) {
          dateMap[dateStr]++;
        }
      }
    });

    // Convert to array sorted by date
    return Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
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
}
