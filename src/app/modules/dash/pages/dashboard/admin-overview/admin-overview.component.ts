import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { FirebaseService } from '../../../../services/firebase.service';
import { SupportChatService } from '../../../../services/support-chat.service';
import {
  CallLog, Lead, LeadSource, LEAD_SOURCE_LABELS, SalesMember, SalesStatus, SALES_STATUS_LABELS,
  effectiveSalesStatus, salesPipelineFor
} from '../../../../../core/models';

type Tone = 'red' | 'green' | 'amber' | 'blue' | 'violet' | 'slate';

interface Kpi { label: string; value: number | string; hint?: string; icon: string; tone: Tone; query?: Params; }
interface Attention { label: string; detail: string; count: number; icon: string; tone: Tone; route: string; query?: Params; }
interface Stage { label: string; count: number; pct: number; }
interface Extra { label: string; value: number | string; tone?: Tone; query?: Params; }
interface ProductCard {
  source: LeadSource; label: string; tone: Tone; icon: string;
  total: number; today: number; completed: number; completedPct: number; closed: number;
  stages: Stage[]; extras: Extra[];
}
interface RepRow { name: string; assigned: number; closed: number; rate: number; calls7: number; lastCall: string; }
interface RecentLead { lead: Lead; source: string; status: string; when: string; }

const DAY = 86400000;

/**
 * The admin's home page: everything that used to take a trip through Leads + filters, on one
 * screen — what needs action right now, headline numbers, each product's own funnel (Webinar,
 * Free community, Offer), the sales team and the newest leads. Read-only: it only reads the
 * same nodes the Leads / Sales Performance pages read, and every number links to the Leads
 * page already filtered to it.
 */
@Component({
  selector: 'app-admin-overview',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  attention: Attention[] = [];
  kpis: Kpi[] = [];
  products: ProductCard[] = [];
  reps: RepRow[] = [];
  recent: RecentLead[] = [];
  leadsPerDay: { date: string; count: number }[] = [];
  unreadQuestions = 0;
  private leads: Lead[] = [];
  private members: SalesMember[] = [];
  private calls: CallLog[] = [];

  constructor(
    private firebase: FirebaseService,
    private supportChat: SupportChatService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.supportChat.unreadAdminCount$.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.unreadQuestions = n || 0;
      if (!this.loading) { this.buildAttention(); this.cdr.markForCheck(); }
    });

    this.firebase.getCurrentVersion().pipe(
      switchMap(version => version ? combineLatest({
        leads: this.firebase.getLeadsByVersion(version.key),
        members: this.firebase.getSalesMembersByVersion(version.key),
        calls: this.firebase.getAllCallLogs(),
      }) : of(null)),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.leads = data?.leads || [];
      this.members = data?.members || [];
      const keys = new Set(this.leads.map(l => l.key));
      this.calls = (data?.calls || []).filter(c => keys.has(c.leadKey));
      this.build();
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  go(route: string, query?: Params): void {
    this.router.navigate([route], { queryParams: query || {} });
  }

  goLeads(query?: Params): void { this.go('/dashboard/leads', query); }

  trackByLabel(_: number, x: { label: string }): string { return x.label; }

  // ── building ────────────────────────────────────────────────

  private sourceOf(l: Lead): LeadSource { return (l.source || 'v1') as LeadSource; }
  private time(l: Lead): number { return new Date(l.createdAt).getTime() || 0; }

  private build(): void {
    const now = Date.now();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const today = startOfToday.getTime();
    const leads = this.leads;

    const last7 = leads.filter(l => this.time(l) >= today - 6 * DAY).length;
    const prev7 = leads.filter(l => this.time(l) >= today - 13 * DAY && this.time(l) < today - 6 * DAY).length;
    const completed = leads.filter(l => l.step === 2).length;
    const closed = leads.filter(l => l.sales_status === 'closed').length;
    const paid = leads.filter(l => this.sourceOf(l) === 'offer' && l.payment_status === 'paid').length;
    const delta = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

    this.kpis = [
      { label: 'Total leads', value: leads.length, hint: 'all products', icon: 'fe fe-users', tone: 'blue', query: {} },
      { label: 'New today', value: leads.filter(l => this.time(l) >= today).length, hint: 'since midnight', icon: 'fe fe-user-plus', tone: 'green' },
      { label: 'Last 7 days', value: last7, hint: delta === null ? 'no data before' : `${delta >= 0 ? '+' : ''}${delta}% vs the week before`, icon: 'fe fe-trending-up', tone: delta !== null && delta < 0 ? 'red' : 'violet' },
      { label: 'Completed', value: completed, hint: leads.length ? `${Math.round(completed / leads.length * 100)}% of leads` : '', icon: 'fe fe-check-circle', tone: 'green', query: { status: 'completed' } },
      { label: 'Closed deals', value: closed, hint: completed ? `${Math.round(closed / completed * 100)}% of completed` : '', icon: 'fe fe-award', tone: 'amber', query: { status: 'closed' } },
      { label: 'Offer paid', value: paid, hint: 'payments received', icon: 'fe fe-credit-card', tone: 'red', query: { source: 'offer' } },
    ];

    this.products = (['v1', 'webinar2', 'v2', 'offer'] as LeadSource[]).map(s => this.buildProduct(s, today));
    this.leadsPerDay = this.buildPerDay(14);
    this.buildReps(now);
    this.buildAttention();

    this.recent = [...leads].sort((a, b) => this.time(b) - this.time(a)).slice(0, 8).map(lead => ({
      lead,
      source: LEAD_SOURCE_LABELS[this.sourceOf(lead)],
      status: this.statusLabel(lead),
      when: this.ago(this.time(lead), now),
    }));
  }

  private statusLabel(l: Lead): string {
    if (this.sourceOf(l) === 'offer' && l.payment_status === 'paid') return 'Paid';
    return SALES_STATUS_LABELS[effectiveSalesStatus(l) as SalesStatus] || '—';
  }

  private buildProduct(source: LeadSource, today: number): ProductCard {
    const own = this.leads.filter(l => this.sourceOf(l) === source);
    const completed = own.filter(l => l.step === 2).length;
    const pipeline = [...salesPipelineFor(source), 'not_interested' as SalesStatus];
    const stages: Stage[] = pipeline.map(st => {
      const count = own.filter(l => effectiveSalesStatus(l) === st).length;
      return { label: SALES_STATUS_LABELS[st], count, pct: own.length ? Math.round(count / own.length * 100) : 0 };
    });

    const extras: Extra[] = [];
    if (source === 'v2') {
      const q = (k: string) => own.filter(l => l.qualification === k).length;
      const v = (k: string) => own.filter(l => l.step === 2 && (l.accountVerificationStatus || 'not_submitted') === k).length;
      extras.push(
        { label: 'Qualified', value: q('qualified') + q('qualified_prep'), tone: 'green' },
        { label: 'Not qualified', value: q('not_qualified'), tone: 'slate' },
        { label: 'Started the bot', value: own.filter(l => !!l.botStartedAt).length, tone: 'blue' },
        { label: 'Accounts to review', value: v('pending'), tone: 'amber', query: { source: 'v2', verification: 'pending' } },
        { label: 'Accounts verified', value: v('verified'), tone: 'green', query: { source: 'v2', verification: 'verified' } },
        { label: 'Accounts rejected', value: v('rejected'), tone: 'red', query: { source: 'v2', verification: 'rejected' } },
      );
    } else if (source === 'offer') {
      const pay = (k: string) => own.filter(l => (l.payment_status || 'pending') === k).length;
      const plan = (k: string) => own.filter(l => l.payment_status === 'paid' && l.offerPlan === k).length;
      extras.push(
        { label: 'Paid', value: pay('paid'), tone: 'green' },
        { label: 'Awaiting payment', value: pay('pending'), tone: 'amber', query: { source: 'offer', status: 'pending' } },
        { label: 'Failed', value: pay('failed'), tone: 'red' },
        { label: 'Paid · Starter', value: plan('starter'), tone: 'slate' },
        { label: 'Paid · Pro', value: plan('pro'), tone: 'violet' },
        { label: 'Paid · AI', value: plan('ai'), tone: 'blue' },
      );
    } else {
      const pk = (k: string) => own.filter(l => l.sales_status === 'closed' && l.sales_package === k).length;
      extras.push(
        { label: 'Closed · Starter', value: pk('starter'), tone: 'slate' },
        { label: 'Closed · Pro', value: pk('pro'), tone: 'violet' },
        { label: 'Closed · AI', value: pk('ai'), tone: 'blue' },
        { label: 'Not assigned to a rep', value: own.filter(l => l.step === 2 && !l.salesMemberKey).length, tone: 'amber' },
      );
    }

    return {
      source, label: LEAD_SOURCE_LABELS[source],
      tone: source === 'v1' ? 'blue' : source === 'webinar2' ? 'violet' : source === 'v2' ? 'green' : 'red',
      icon: source === 'v1' || source === 'webinar2' ? 'fe fe-video' : source === 'v2' ? 'fe fe-send' : 'fe fe-gift',
      total: own.length,
      today: own.filter(l => this.time(l) >= today).length,
      completed, completedPct: own.length ? Math.round(completed / own.length * 100) : 0,
      closed: own.filter(l => l.sales_status === 'closed').length,
      stages, extras,
    };
  }

  private buildPerDay(days: number): { date: string; count: number }[] {
    const map = new Map<string, number>();
    const d = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const x = new Date(d); x.setDate(x.getDate() - i);
      map.set(x.toISOString().split('T')[0], 0);
    }
    this.leads.forEach(l => {
      const k = (l.createdAt || '').split('T')[0];
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
    });
    return [...map.entries()].map(([date, count]) => ({ date, count }));
  }

  private buildReps(now: number): void {
    this.reps = this.members.filter(m => m.isActive).map(m => {
      const own = this.leads.filter(l => l.salesMemberKey === m.key);
      const closed = own.filter(l => l.sales_status === 'closed').length;
      const calls = this.calls.filter(c => c.createdBy === m.userId);
      const recent = calls.filter(c => new Date(c.createdAt).getTime() >= now - 7 * DAY);
      const last = calls.reduce((a, c) => Math.max(a, new Date(c.createdAt).getTime() || 0), 0);
      return {
        name: m.name, assigned: own.length, closed,
        rate: own.length ? Math.round(closed / own.length * 100) : 0,
        calls7: recent.length, lastCall: last ? this.ago(last, now) : '—',
      };
    }).sort((a, b) => b.closed - a.closed || b.assigned - a.assigned);
  }

  private buildAttention(): void {
    const pendingReview = this.leads.filter(l => this.sourceOf(l) === 'v2' && l.step === 2 && l.accountVerificationStatus === 'pending').length;
    const awaitingPay = this.leads.filter(l => this.sourceOf(l) === 'offer' && l.payment_status !== 'paid' && l.payment_status !== 'failed').length;
    // Same rule as the Leads page's "Duplicated email" filter: one email registered more than
    // once for the SAME product (version + source). The same person on two products is not one.
    const seen = new Map<string, number>();
    this.leads.forEach(l => {
      const e = (l.email || '').trim().toLowerCase();
      if (!e) return;
      const k = `${l.versionKey}|${this.sourceOf(l)}|${e}`;
      seen.set(k, (seen.get(k) || 0) + 1);
    });
    const dupEmails = [...seen.values()].filter(n => n > 1).length;

    this.attention = [
      { label: 'Trading accounts to review', detail: 'Free-community leads waiting for a decision', count: pendingReview, icon: 'fe fe-shield', tone: 'amber', route: '/dashboard/leads', query: { source: 'v2', verification: 'pending' } },
      { label: 'Website questions', detail: 'Unread messages from visitors', count: this.unreadQuestions, icon: 'fe fe-message-circle', tone: 'red', route: '/dashboard/support-inbox' },
      { label: 'Offer leads awaiting payment', detail: 'Registered but not paid yet', count: awaitingPay, icon: 'fe fe-clock', tone: 'violet', route: '/dashboard/leads', query: { source: 'offer', status: 'pending' } },
      { label: 'Duplicated emails', detail: 'Registered more than once', count: dupEmails, icon: 'fe fe-copy', tone: 'slate', route: '/dashboard/leads', query: { status: 'duplicate' } },
    ];
  }

  private ago(t: number, now: number): string {
    const s = Math.max(0, Math.floor((now - t) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
    return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
