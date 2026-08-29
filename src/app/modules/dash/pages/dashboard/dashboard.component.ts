import { Component, OnDestroy, OnInit } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';
import { PublicService } from '../../../services/public.service';
import { Version, Lead } from '../../../../core/models';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
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

  constructor(
    private firebaseService: FirebaseService,
    private publicService: PublicService
  ) { }

  ngOnInit(): void {
    this.startTime = performance.now();
    this.loadCurrentVersion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentVersion(): void {
    console.log('🔍 Fetching current version...');
    this.firebaseService.getCurrentVersion().pipe(takeUntil(this.destroy$)).subscribe({
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
    if (!this.currentVersion) return;

    const role = this.publicService.getUserRole();
    const salesMemberKey = this.publicService.getSalesMemberKey();
    const affiliateKey = this.publicService.getAffiliateKey();

    if (role === 'sales' && salesMemberKey) {
      this.loadSalesDashboard(salesMemberKey);
    } else if (role === 'affiliate' && affiliateKey) {
      this.loadAffiliateDashboard(affiliateKey);
    } else if (role === 'account_manager') {
      const accountManagerKey = this.publicService.getCurrentUserUid();
      if (accountManagerKey) this.loadAccountManagerDashboard(accountManagerKey);
    } else {
      this.loadAdminDashboard();
    }
  }

  private loadAdminDashboard(): void {
    this.dashboardCards = [
      { label: 'Total Leads', icon: 'fe fe-users', iconClass: 'icon-sales', prefix: '' },
      { label: 'Completed', icon: 'fe fe-check-circle', iconClass: 'icon-orders', prefix: '' },
      { label: 'Pending', icon: 'fe fe-clock', iconClass: 'icon-books', prefix: '' },
      { label: 'Active Affiliates', icon: 'fe fe-user-plus', iconClass: 'icon-customers', prefix: '' }
    ];

    combineLatest({
      allLeads: this.firebaseService.getLeadsByVersion(this.currentVersion!.key),
      allAffiliates: this.firebaseService.getAffiliatesByVersion(this.currentVersion!.key)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        const leads = data.allLeads;
        const totalLeads = leads.length;
        const completedLeads = leads.filter((l: Lead) => l.step === 2).length;
        const pendingLeads = leads.filter((l: Lead) => l.step === 1).length;
        const uniqueAffiliateKeys = new Set(leads.filter((l: Lead) => l.affiliateKey).map((l: Lead) => l.affiliateKey));
        this.targetNumbers = [totalLeads, completedLeads, pendingLeads, uniqueAffiliateKeys.size];
        this.leadsPerDayData = this.buildLeadsPerDayChart(leads);
        this.animateNumbers();
      },
      error: (err: any) => console.error('Dashboard error:', err)
    });
  }

  private loadSalesDashboard(salesMemberKey: string): void {
    this.dashboardCards = [
      { label: 'My Leads', icon: 'fe fe-users', iconClass: 'icon-sales', prefix: '' },
      { label: 'Closed', icon: 'fe fe-check-circle', iconClass: 'icon-orders', prefix: '' },
      { label: 'Follow-up', icon: 'fe fe-clock', iconClass: 'icon-books', prefix: '' },
      { label: 'Not Interested', icon: 'fe fe-x-circle', iconClass: 'icon-customers', prefix: '' }
    ];

    this.firebaseService.getLeadsBySalesMember(salesMemberKey).pipe(takeUntil(this.destroy$)).subscribe({
      next: (leads) => {
        const total = leads.length;
        const closed = leads.filter(l => l.sales_status === 'closed').length;
        const followUp = leads.filter(l => l.sales_status === 'follow_up').length;
        const notInterested = leads.filter(l => l.sales_status === 'not_interested').length;
        this.targetNumbers = [total, closed, followUp, notInterested];
        this.leadsPerDayData = this.buildLeadsPerDayChart(leads);
        this.animateNumbers();
      },
      error: (err: any) => console.error('Sales dashboard error:', err)
    });
  }

  private loadAffiliateDashboard(affiliateKey: string): void {
    this.dashboardCards = [
      { label: 'Total Leads', icon: 'fe fe-users', iconClass: 'icon-sales', prefix: '' },
      { label: 'Completed', icon: 'fe fe-check-circle', iconClass: 'icon-orders', prefix: '' },
      { label: 'Pending', icon: 'fe fe-clock', iconClass: 'icon-books', prefix: '' },
      { label: 'Closed Deals', icon: 'fe fe-briefcase', iconClass: 'icon-customers', prefix: '' }
    ];

    this.firebaseService.getLeadsByAffiliate(affiliateKey).pipe(takeUntil(this.destroy$)).subscribe({
      next: (leads) => {
        const total = leads.length;
        const completed = leads.filter(l => l.step === 2).length;
        const pending = leads.filter(l => l.step !== 2).length;
        const closed = leads.filter(l => l.sales_status === 'closed').length;
        this.targetNumbers = [total, completed, pending, closed];
        this.leadsPerDayData = this.buildLeadsPerDayChart(leads);
        this.animateNumbers();
      },
      error: (err: any) => console.error('Affiliate dashboard error:', err)
    });
  }

  private loadAccountManagerDashboard(accountManagerKey: string): void {
    this.dashboardCards = [
      { label: 'Closed Leads', icon: 'fe fe-users', iconClass: 'icon-sales', prefix: '' },
      { label: 'Renewed', icon: 'fe fe-check-circle', iconClass: 'icon-orders', prefix: '' },
      { label: 'Not Renewed', icon: 'fe fe-x-circle', iconClass: 'icon-customers', prefix: '' },
      { label: 'In Follow-up', icon: 'fe fe-clock', iconClass: 'icon-books', prefix: '' }
    ];

    combineLatest({
      affiliates: this.firebaseService.getAffiliatesByAccountManager(accountManagerKey),
      allLeads: this.firebaseService.getClosedLeadsByVersion(this.currentVersion!.key)
    }).pipe(takeUntil(this.destroy$)).subscribe({
        next: ({ affiliates, allLeads }) => {
          const affiliateKeys = new Set(affiliates.map(affiliate => affiliate.key));
          const leads = allLeads.filter(lead => !!lead.affiliateKey && affiliateKeys.has(lead.affiliateKey));
          const statusOf = (lead: Lead) => lead.renewal_status || lead.affiliate_status;
          this.targetNumbers = [
            leads.length,
            leads.filter(lead => statusOf(lead) === 'renewed').length,
            leads.filter(lead => statusOf(lead) === 'not_renewed').length,
            leads.filter(lead => !statusOf(lead) || statusOf(lead) === 'renewal_followup' || statusOf(lead) === 'renew_later').length
          ];
          this.leadsPerDayData = [];
          this.animateNumbers();
        },
        error: (err: any) => console.error('Account manager dashboard error:', err)
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
