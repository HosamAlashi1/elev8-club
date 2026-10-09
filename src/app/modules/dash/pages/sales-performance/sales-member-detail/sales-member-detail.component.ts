import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ApexChart } from 'ng-apexcharts';
import { FirebaseService } from '../../../../services/firebase.service';
import { SelectOption } from '../../../shared/modern-select/modern-select.component';
import {
  CallLog, CallStatus, CallType, CALL_TYPE_LABELS, CALL_STATUS_LABELS,
  Lead, LeadActivity, SalesMember, SalesStatus, SALES_STATUS_LABELS
} from '../../../../../core/models';

type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface TimelineEntry {
  kind: 'call' | 'status_change';
  key: string;
  leadKey: string;
  leadName: string;
  leadPhone: string;
  createdAt: string;
  // call-only
  callType?: CallType;
  status?: CallStatus;
  notes?: string;
  // status_change-only
  fromStatus?: SalesStatus | null;
  toStatus?: SalesStatus;
}

const PAGE_SIZE = 30;

/**
 * One sales rep's own activity — split out of the sales-performance list page on purpose.
 * Rendering every rep's full call+status-change history on one page is what made the previous
 * version heavy: this page loads the same underlying data but only ever displays ONE member's
 * slice of it, paginated, so the DOM stays small no matter how many calls exist in total.
 */
@Component({
  selector: 'app-sales-member-detail',
  templateUrl: './sales-member-detail.component.html',
  styleUrls: ['./sales-member-detail.component.css']
})
export class SalesMemberDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = true;
  member: SalesMember | null = null;
  notFound = false;

  private leadsByKey = new Map<string, Lead>();
  private allCalls: CallLog[] = [];
  private allActivity: LeadActivity[] = [];

  private filteredTimeline: TimelineEntry[] = [];
  visibleTimeline: TimelineEntry[] = [];
  visibleCount = PAGE_SIZE;

  assignedLeadsCount = 0;
  closedLeadsCount = 0;
  summary = { total: 0, answered: 0, noAnswer: 0, busy: 0, statusChanges: 0 };
  donutChart: any;

  readonly callTypeLabels = CALL_TYPE_LABELS;
  readonly callStatusLabels = CALL_STATUS_LABELS;
  readonly salesStatusLabels = SALES_STATUS_LABELS;

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

  callTypeOptions: SelectOption[] = [
    { value: 'all', label: 'All Call Types' },
    ...Object.entries(CALL_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  ];
  selectedCallType: CallType | 'all' = 'all';

  callStatusOptions: SelectOption[] = [
    { value: 'all', label: 'All Results' },
    ...Object.entries(CALL_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  ];
  selectedCallStatus: CallStatus | 'all' = 'all';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    const memberKey = this.route.snapshot.paramMap.get('memberKey');
    if (!memberKey) {
      this.notFound = true;
      this.isLoading = false;
      return;
    }

    this.firebaseService.getCurrentVersion().pipe(
      switchMap(version => {
        if (!version) return of(null);
        return combineLatest({
          members: this.firebaseService.getSalesMembersByVersion(version.key),
          leads: this.firebaseService.getLeadsByVersion(version.key),
          calls: this.firebaseService.getAllCallLogs(),
          activity: this.firebaseService.getAllActivity()
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      if (!data) {
        this.notFound = true;
        this.isLoading = false;
        return;
      }

      const member = data.members.find(m => m.key === memberKey) || null;
      if (!member) {
        this.notFound = true;
        this.isLoading = false;
        return;
      }

      this.member = member;
      this.leadsByKey = new Map(data.leads.map(l => [l.key as string, l]));

      const memberLeads = data.leads.filter(l => l.salesMemberKey === member.key);
      this.assignedLeadsCount = memberLeads.length;
      this.closedLeadsCount = memberLeads.filter(l => l.sales_status === 'closed').length;

      const leadKeys = this.leadsByKey;
      this.allCalls = data.calls.filter(c => leadKeys.has(c.leadKey) && c.createdBy === member.userId);
      this.allActivity = data.activity.filter(a => leadKeys.has(a.leadKey) && a.createdBy === member.userId);

      this.applyFilters();
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sales-performance']);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  loadMore(): void {
    this.visibleCount += PAGE_SIZE;
    this.visibleTimeline = this.filteredTimeline.slice(0, this.visibleCount);
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
    const inRange = <T extends { createdAt: string }>(x: T) => {
      const at = new Date(x.createdAt);
      return at >= start && at < end;
    };

    const typeFilterActive = this.selectedCallType !== 'all';
    const statusFilterActive = this.selectedCallStatus !== 'all';

    const calls = this.allCalls.filter(c => {
      if (!inRange(c)) return false;
      if (typeFilterActive && c.callType !== this.selectedCallType) return false;
      if (statusFilterActive && c.status !== this.selectedCallStatus) return false;
      return true;
    });

    // A status change has no call type/result of its own — once either of those filters is
    // narrowed down, a status change can never match it, so it drops out of the timeline.
    const activity = (typeFilterActive || statusFilterActive)
      ? []
      : this.allActivity.filter(inRange);

    const callEntries: TimelineEntry[] = calls.map(c => {
      const lead = this.leadsByKey.get(c.leadKey);
      return {
        kind: 'call',
        key: c.key || `${c.leadKey}-${c.createdAt}`,
        leadKey: c.leadKey,
        leadName: lead?.fullName || 'Unknown lead',
        leadPhone: lead?.phone || '-',
        createdAt: c.createdAt,
        callType: c.callType,
        status: c.status,
        notes: c.notes
      };
    });

    const activityEntries: TimelineEntry[] = activity.map(a => {
      const lead = this.leadsByKey.get(a.leadKey);
      return {
        kind: 'status_change',
        key: a.key || `${a.leadKey}-${a.createdAt}`,
        leadKey: a.leadKey,
        leadName: lead?.fullName || 'Unknown lead',
        leadPhone: lead?.phone || '-',
        createdAt: a.createdAt,
        fromStatus: a.fromStatus,
        toStatus: a.toStatus
      };
    });

    this.filteredTimeline = [...callEntries, ...activityEntries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.visibleCount = PAGE_SIZE;
    this.visibleTimeline = this.filteredTimeline.slice(0, this.visibleCount);

    const answered = calls.filter(c => c.status === 'answered').length;
    const noAnswer = calls.filter(c => c.status === 'no_answer').length;
    const busy = calls.filter(c => c.status === 'busy').length;

    this.summary = { total: calls.length, answered, noAnswer, busy, statusChanges: activity.length };

    const chart: ApexChart = { type: 'donut', height: 160 };
    this.donutChart = {
      series: calls.length ? [answered, noAnswer, busy] : [1],
      chart,
      labels: ['Answered', 'No Answer', 'Busy'],
      colors: calls.length ? ['#22c55e', '#ef4444', '#f59e0b'] : ['#e5e7eb'],
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', fontSize: '12px' },
      tooltip: { enabled: calls.length > 0 }
    };
  }

  trackByKey(_index: number, entry: TimelineEntry): string {
    return entry.key;
  }

  filteredTimelineLength(): number {
    return this.filteredTimeline.length;
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
