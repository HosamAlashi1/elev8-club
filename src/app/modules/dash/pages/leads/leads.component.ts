import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../services/firebase.service';
import { Version, Lead, Affiliate, SALES_STATUS_LABELS, SALES_PACKAGE_LABELS, SalesStatus, SalesMember, LeadSource, LEAD_SOURCE_LABELS } from '../../../../core/models';
import { ToastrsService } from '../../../services/toater.service';
import { ViewLeadComponent } from './view-lead/view-lead.component';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { PublicService } from 'src/app/modules/services/public.service';
import { ExcelExportService } from '../../../services/excel-export.service';

interface LeadWithAffiliate extends Lead {
  affiliateName?: string;
  affiliateCode?: string;
  assigned_sales?: {
    sales_id: string;
    whatsapp_number: string;
    group_id?: string;
    group_name?: string;
    group_link?: string;
    group_order?: number;
    assigned_at: number;
    assigned_via: string;
    versionKey?: string;
  };
  salesName?: string;
  salesMemberName?: string;
  sourceLabel?: string;
}

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit, OnDestroy {
  isLoading$ = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();
  private leadsLoaded = false;

  leads: LeadWithAffiliate[] = [];
  allLeads: LeadWithAffiliate[] = [];
  currentVersion: Version | null = null;
  affiliates: Affiliate[] = [];
  salesList: any[] = [];
  salesMembers: SalesMember[] = [];

  // Role
  isSales = false;
  isAdmin = false;
  salesMemberKey: string | null = null;

  // Filters
  searchText = '';
  selectedSalesId = '';
  selectedStatus = '';
  selectedSource = '';

  // A lead with no `source` predates the field — it's a v1/Webinar lead.
  readonly sourceOptions: { value: string; label: string }[] = [
    { value: '', label: 'All Sources' },
    { value: 'v1', label: LEAD_SOURCE_LABELS.v1 },
    { value: 'v2', label: LEAD_SOURCE_LABELS.v2 },
  ];

  // Pagination
  page = 1;
  size = 10;
  totalCount = 0;
  sizeOptions: { value: number; label: string }[] = [];
  salesOptions: { value: string; label: string }[] = [{ value: '', label: 'All Groups' }];

  // Unified status filter: Lead statuses + Sales statuses
  statusOptions: { value: string; label: string; disabled?: boolean }[] = [
    { value: '',            label: 'All Statuses' },
    { value: '__lead__',    label: 'Lead Status',  disabled: true },
    { value: 'completed',   label: 'Completed' },
    { value: 'pending',     label: 'Pending' },
    { value: '__sales__',   label: 'Sales Status', disabled: true },
    { value: 'new',         label: 'New' },
    { value: 'pre_meeting', label: 'Pre-Meeting' },
    { value: 'post_meeting',label: 'Post-Meeting' },
    { value: 'follow_up',   label: 'Follow-up' },
    { value: 'closed',      label: 'Closed' },
    { value: 'not_interested', label: 'Not Interested' },
  ];

  isExporting = false;

  constructor(
    private firebaseService: FirebaseService,
    private modalService: NgbModal,
    private router: Router,
    private toastr: ToastrsService,
    private publicService: PublicService,
    private excelExport: ExcelExportService
  ) {
    this.size = this.publicService.getNumOfRows(450, 67.87);
    this.sizeOptions = [
      { value: this.size, label: `${this.size} rows` },
      { value: 10, label: '10 rows' },
      { value: 25, label: '25 rows' },
      { value: 50, label: '50 rows' },
      { value: 100, label: '100 rows' },
      { value: 250, label: '250 rows' },
      { value: 500, label: '500 rows' }
    ];
    this.isSales = this.publicService.isSales();
    this.isAdmin = this.publicService.isAdmin();
    this.salesMemberKey = this.publicService.getSalesMemberKey();
  }

  ngOnInit(): void {
    this.loadCurrentVersion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper صغير عشان نضمن اللودر يبان لطرفة عين
  private setTableLoading(fn: () => void, delay: number = 150): void {
    this.isLoading$.next(true);
    fn();
    setTimeout(() => this.isLoading$.next(false), delay);
  }

  loadCurrentVersion(): void {
    this.isLoading$.next(true);
    this.firebaseService.getCurrentVersion().pipe(
      switchMap(version => {
        this.currentVersion = version;
        if (!version) return of(null);

        const leads$ = (this.isSales && this.salesMemberKey)
          ? this.firebaseService.getLeadsBySalesMember(this.salesMemberKey)
          : this.firebaseService.getLeadsByVersion(version.key);

        return combineLatest({
          affiliates: this.firebaseService.getAffiliatesByVersion(version.key),
          sales: this.firebaseService.getSalesByVersion(version.key),
          salesMembers: this.firebaseService.getSalesMembersByVersion(version.key),
          leads: leads$
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: data => {
        if (!data) {
          this.allLeads = [];
          this.applyFilters(false, false);
          this.isLoading$.next(false);
          return;
        }

        this.affiliates = data.affiliates;
        this.salesList = data.sales || [];
        this.salesMembers = data.salesMembers;
        this.allLeads = data.leads.map(lead => {
          const affiliate = this.affiliates.find(a => a.key === lead.affiliateKey);
          const sales = lead.assigned_sales
            ? this.salesList.find(s => s.key === (lead.assigned_sales?.group_id || lead.assigned_sales?.sales_id))
            : null;
          const salesMember = lead.salesMemberKey
            ? this.salesMembers.find(m => m.key === lead.salesMemberKey)
            : null;
          return {
            ...lead,
            affiliateName: affiliate?.name || 'none',
            affiliateCode: affiliate?.code || lead.affiliateCode,
            salesName: lead.assigned_sales?.group_name || sales?.group_name || sales?.name || (lead.assigned_sales ? 'Assigned Group' : 'Not Assigned'),
            salesMemberName: salesMember?.name || undefined,
            // Missing `source` predates the field — treat as 'v1' (Webinar).
            sourceLabel: LEAD_SOURCE_LABELS[(lead.source as LeadSource) || 'v1']
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.buildGroupOptions();
        const firstLoad = !this.leadsLoaded;
        this.leadsLoaded = true;
        this.applyFilters(false, firstLoad);
      },
      error: error => {
        console.error('Error loading leads:', error);
        this.toastr.showError('Failed to load leads');
        this.isLoading$.next(false);
      }
    });
  }

  private buildGroupOptions(): void {
    const seen = new Set<string>();
    const groups: { value: string; label: string }[] = [];
    this.allLeads.forEach(lead => {
      const name = lead.assigned_sales?.group_name;
      if (name && !seen.has(name)) {
        seen.add(name);
        groups.push({ value: name, label: name });
      }
    });
    groups.sort((a, b) => a.label.localeCompare(b.label));
    this.salesOptions = [{ value: '', label: 'All Groups' }, ...groups];
  }

  loadLeads(): void {
    // The live Firebase subscription refreshes this table automatically.
  }

  /**
   * applyFilters
   * لما نبحث أو نفلتر، نفعّل لودر بسيط
   */
  applyFilters(withLoading: boolean = true, resetPage: boolean = true): void {
    const run = () => {
      let filtered = [...this.allLeads];

      // فلتر البحث
      if (this.searchText.trim()) {
        const search = this.searchText.toLowerCase();
        filtered = filtered.filter(l =>
          l.fullName.toLowerCase().includes(search) ||
          l.email.toLowerCase().includes(search) ||
          l.phone?.toLowerCase().includes(search) ||
          l.affiliateName?.toLowerCase().includes(search) ||
          l.salesName?.toLowerCase().includes(search) ||
          l.sourceLabel?.toLowerCase().includes(search)
        );
      }

      // فلتر WhatsApp Group (admin only) — يُقارن بـ group_name
      if (this.selectedSalesId && this.isAdmin) {
        filtered = filtered.filter(l => (l.assigned_sales?.group_name || '') === this.selectedSalesId);
      }

      // فلتر المصدر (Webinar / Free community) — missing `source` = 'v1'
      if (this.selectedSource) {
        filtered = filtered.filter(l => (l.source || 'v1') === this.selectedSource);
      }

      // فلتر الحالة الموحّد
      if (this.selectedStatus && !this.selectedStatus.startsWith('__')) {
        if (this.selectedStatus === 'completed') {
          filtered = filtered.filter(l => l.step === 2);
        } else if (this.selectedStatus === 'pending') {
          filtered = filtered.filter(l => l.step !== 2);
        } else {
          filtered = filtered.filter(l => (l.sales_status || 'new') === this.selectedStatus);
        }
      }

      this.leads = filtered;
      this.totalCount = filtered.length;
      
      // نرجع للصفحة الأولى فقط لو كان بحث جديد أو فلتر
      if (resetPage) {
        this.page = 1;
      } else {
        // نتأكد إن الصفحة الحالية لسه صالحة
        const maxPage = Math.ceil(this.totalCount / this.size) || 1;
        if (this.page > maxPage) {
          this.page = maxPage;
        }
      }
    };

    if (withLoading) {
      this.setTableLoading(run);
    } else {
      run();
      this.isLoading$.next(false);
    }
  }

  /**
   * تغيير الصفحة: نفعّل لودر بسيط + نحدّث page
   */
  list(page: number): void {
    this.setTableLoading(() => {
      this.page = page;
    });
  }

  onSizeChange(): void {
    this.page = 1;
    this.list(this.page);
  }

  /**
   * Getter للصفحة الحالية
   */
  get paginatedLeads(): LeadWithAffiliate[] {
    const start = (this.page - 1) * this.size;
    const end = start + this.size;
    return this.leads.slice(start, end);
  }

  view(lead: LeadWithAffiliate): void {
    const modalRef = this.modalService.open(ViewLeadComponent, { centered: true, size: 'xl' });
    modalRef.componentInstance.lead = lead;
  }

  salesPanelLead: LeadWithAffiliate | null = null;

  openSalesPanel(lead: LeadWithAffiliate): void {
    this.salesPanelLead = lead;
  }

  closeSalesPanel(): void {
    this.salesPanelLead = null;
  }

  async exportToExcel(): Promise<void> {
    if (this.leads.length === 0) {
      this.toastr.showWarning('No leads to export');
      return;
    }
    this.isExporting = true;
    try {
      await this.excelExport.exportLeads(
        this.leads.map(l => ({
          fullName:        l.fullName,
          email:           l.email,
          phone:           l.phone,
          country:         l.country,
          city:            l.city,
          affiliateName:   l.affiliateName,
          affiliateCode:   l.affiliateCode,
          salesName:       l.salesName,
          salesMemberName: l.salesMemberName,
          sales_status:    l.sales_status,
          sales_package:   l.sales_package,
          step:            l.step,
          createdAt:       l.createdAt,
          completedAt:     (l as any).completedAt
        })),
        'elev8_leads'
      );
      this.toastr.showSuccess(`${this.leads.length} leads exported`);
    } catch {
      this.toastr.showError('Export failed');
    } finally {
      this.isExporting = false;
    }
  }

    getStatusPillClass(step: number): string {
    return step === 2 ? 'pill-success' : 'pill-warning';
  }

  getStatusText(step: number): string {
    return step === 2 ? 'Completed' : 'Pending';
  }

  getSalesStatusLabel(lead: Lead): string {
    const statusLabel = SALES_STATUS_LABELS[(lead.sales_status as SalesStatus)] || 'New';
    if (lead.sales_status !== 'closed' || !lead.sales_package) return statusLabel;
    return `${statusLabel} - ${SALES_PACKAGE_LABELS[lead.sales_package]}`;
  }

  getSalesStatusClass(status?: string): string {
    const map: Record<string, string> = {
      new: 'pill-secondary',
      pre_meeting: 'pill-info',
      post_meeting: 'pill-primary',
      follow_up: 'pill-warning',
      closed: 'pill-success',
      not_interested: 'pill-danger'
    };
    return map[status || 'new'] || 'pill-secondary';
  }

  getSourceClass(source?: string): string {
    return (source || 'v1') === 'v2' ? 'pill-primary' : 'pill-secondary';
  }

  getCreatedDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  delete(lead: LeadWithAffiliate): void {
    const modalRef = this.modalService.open(DeleteComponent, {});

    modalRef.componentInstance.type = 'lead';
    modalRef.componentInstance.firebaseKey = lead.key;
    modalRef.componentInstance.message = `Are you sure you want to delete lead "${lead.fullName}"? This action cannot be undone.`;

    modalRef.result.then(
      result => {
        if (result === 'deleted') {
          this.toastr.showSuccess('Lead deleted successfully');
          this.loadLeads();
        }
      },
      () => {}
    );
  }
}
