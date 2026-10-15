import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ApexChart } from 'ng-apexcharts';
import { FirebaseService } from '../../../services/firebase.service';
import { SelectOption } from '../../shared/modern-select/modern-select.component';
import { CallLog, Lead, SalesMember } from '../../../../core/models';

type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface DonutChart {
  series: number[];
  chart: ApexChart;
  colors: string[];
  stroke: { width: number };
  dataLabels: { enabled: boolean };
  legend: { show: boolean };
  tooltip: { enabled: boolean };
}

interface SalesMemberRow extends SalesMember {
  totalCalls: number;
  answered: number;
  noAnswer: number;
  busy: number;
  assignedLeadsCount: number;
  closedLeadsCount: number;
  donutChart: DonutChart;
}

/**
 * Admin-only productivity overview: one lightweight card per sales rep (counts + a donut, no
 * call-by-call detail) so the page stays cheap to render regardless of how many calls exist.
 * Clicking a card opens SalesMemberDetailComponent, which is where the actual call/activity
 * timeline for that one rep lives — see docs on that component for why it's a separate page.
 */
@Component({
  selector: 'app-sales-performance',
  templateUrl: './sales-performance.component.html',
  styleUrls: ['./sales-performance.component.css']
})
export class SalesPerformanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = true;
  rows: SalesMemberRow[] = [];

  private members: SalesMember[] = [];
  private leads: Lead[] = [];
  private calls: CallLog[] = [];

  periodOptions: SelectOption[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];
  selectedPeriod: PeriodPreset = 'week';
  customStart = '';
  customEnd = '';

  summary = { total: 0, answered: 0, noAnswer: 0, busy: 0, activeMembers: 0, closed: 0 };

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  ngOnInit(): void {
    this.firebaseService.getCurrentVersion().pipe(
      switchMap(version => {
        if (!version) return of(null);
        return combineLatest({
          members: this.firebaseService.getSalesMembersByVersion(version.key),
          leads: this.firebaseService.getLeadsByVersion(version.key),
          calls: this.firebaseService.getAllCallLogs()
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      if (!data) {
        this.members = [];
        this.leads = [];
        this.calls = [];
        this.rows = [];
        this.isLoading = false;
        return;
      }

      this.members = data.members;
      this.leads = data.leads;
      const leadKeys = new Set(data.leads.map(l => l.key));
      // Only calls against a lead that belongs to THIS version — a call log left over from
      // another version/product would otherwise inflate a member's numbers here.
      this.calls = data.calls.filter(c => leadKeys.has(c.leadKey));

      this.applyFilters();
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  /** The Leads page, filtered to the closed ones. */
  openClosedLeads(): void {
    this.router.navigate(['/dashboard/leads'], { queryParams: { status: 'closed' } });
  }

  openMember(row: SalesMemberRow): void {
    this.router.navigate(['/dashboard/sales-performance', row.key]);
  }

  private getPeriodBounds(): { start: Date; end: Date } {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    switch (this.selectedPeriod) {
      case 'today':
        return { start: startOfToday, end: endOfToday };
      case 'yesterday': {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 1);
        return { start, end: startOfToday };
      }
      case 'week': {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 6);
        return { start, end: endOfToday };
      }
      case 'month': {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 29);
        return { start, end: endOfToday };
      }
      case 'custom': {
        const start = this.customStart ? new Date(this.customStart) : new Date(0);
        const end = this.customEnd ? new Date(this.customEnd) : new Date(8640000000000000);
        if (this.customEnd) end.setDate(end.getDate() + 1);
        return { start, end };
      }
    }
  }

  private applyFilters(): void {
    const { start, end } = this.getPeriodBounds();
    const inRange = this.calls.filter(c => {
      const at = new Date(c.createdAt);
      return at >= start && at < end;
    });

    const callsByMember = new Map<string, CallLog[]>();
    inRange.forEach(c => {
      const bucket = callsByMember.get(c.createdBy);
      if (bucket) bucket.push(c);
      else callsByMember.set(c.createdBy, [c]);
    });

    this.rows = this.members.map(member => {
      const memberCalls = callsByMember.get(member.userId) || [];
      const answered = memberCalls.filter(c => c.status === 'answered').length;
      const noAnswer = memberCalls.filter(c => c.status === 'no_answer').length;
      const busy = memberCalls.filter(c => c.status === 'busy').length;
      const memberLeads = this.leads.filter(l => l.salesMemberKey === member.key);

      return {
        ...member,
        totalCalls: memberCalls.length,
        answered,
        noAnswer,
        busy,
        assignedLeadsCount: memberLeads.length,
        closedLeadsCount: memberLeads.filter(l => l.sales_status === 'closed').length,
        donutChart: this.buildDonutChart(memberCalls.length, answered, noAnswer, busy)
      };
    }).sort((a, b) => b.totalCalls - a.totalCalls);

    this.summary = {
      total: inRange.length,
      answered: inRange.filter(c => c.status === 'answered').length,
      noAnswer: inRange.filter(c => c.status === 'no_answer').length,
      busy: inRange.filter(c => c.status === 'busy').length,
      activeMembers: this.rows.filter(r => r.totalCalls > 0).length,
      closed: this.leads.filter(l => l.sales_status === 'closed').length
    };
  }

  trackByKey(_index: number, row: SalesMemberRow): string {
    return row.key || row.userId;
  }

  private buildDonutChart(total: number, answered: number, noAnswer: number, busy: number): DonutChart {
    const chart: ApexChart = { type: 'donut', height: 88, sparkline: { enabled: true } };
    return {
      series: total ? [answered, noAnswer, busy] : [1],
      chart,
      colors: total ? ['#22c55e', '#ef4444', '#f59e0b'] : ['#e5e7eb'],
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: { enabled: total > 0 }
    };
  }
}
