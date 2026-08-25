import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../services/firebase.service';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import {
  Lead, AFFILIATE_STATUS_LABELS, AffiliateStatus, Affiliate,
  SALES_STATUS_LABELS, SALES_PACKAGE_LABELS, SalesStatus
} from '../../../../core/models';
import { ViewAffiliateLeadComponent } from './view-affiliate-lead/view-affiliate-lead.component';
import { SelectOption } from '../../shared/modern-select/modern-select.component';

const FILTER_WITH_AFFILIATE = '__with__';
const FILTER_ALL = '__all__';

@Component({
  selector: 'app-my-leads',
  templateUrl: './my-leads.component.html',
  styleUrls: ['./my-leads.component.css']
})
export class MyLeadsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);

  leads: Lead[] = [];
  allLeads: Lead[] = [];
  searchText = '';

  page = 1;
  size = 15;
  totalCount = 0;

  isAdmin = false;
  isAccountManager = false;
  isAffiliate = false;
  selectedAffiliateFilter = FILTER_WITH_AFFILIATE;
  affiliateOptions: SelectOption[] = [];
  affiliateMap: Record<string, string> = {};

  constructor(
    private firebaseService: FirebaseService,
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.publicService.isAdmin();
    this.isAccountManager = this.publicService.isAccountManager();
    this.isAffiliate = this.publicService.isAffiliate();
    if (this.isAccountManager) this.selectedAffiliateFilter = FILTER_ALL;
    this.loadLeads();
  }

  loadLeads(): void {
    if (this.isAdmin) {
      this.loadAdminLeads();
    } else {
      this.isAffiliate ? this.loadAffiliateLeads() : this.loadAccountManagerLeads();
    }
  }

  private loadAccountManagerLeads(): void {
    const accountManagerKey = this.publicService.getCurrentUserUid();
    if (!accountManagerKey) { this.isLoading$.next(false); return; }
    this.isLoading$.next(true);
    this.firebaseService.getCurrentVersion().subscribe(version => {
      if (!version) { this.isLoading$.next(false); return; }
      this.firebaseService.getAffiliatesByAccountManager(accountManagerKey).subscribe(affiliates => {
        this.buildAffiliateOptions(affiliates);
        const affiliateKeys = new Set(affiliates.map(affiliate => affiliate.key));
        this.firebaseService.getClosedLeadsByVersion(version.key).subscribe({
          next: leads => {
            this.allLeads = leads
              .filter(lead => !!lead.affiliateKey && affiliateKeys.has(lead.affiliateKey))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            this.applyFilters();
            this.isLoading$.next(false);
          },
          error: () => {
            this.toastr.showError('Failed to load leads');
            this.isLoading$.next(false);
          }
        });
      });
    });
  }

  private loadAffiliateLeads(): void {
    const affiliateKey = this.publicService.getAffiliateKey();
    if (!affiliateKey) {
      this.isLoading$.next(false);
      return;
    }
    this.isLoading$.next(true);
    this.firebaseService.getClosedLeadsByAffiliate(affiliateKey).subscribe(
      leads => {
        this.allLeads = leads.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilters();
        this.isLoading$.next(false);
      },
      () => {
        this.toastr.showError('Failed to load leads');
        this.isLoading$.next(false);
      }
    );
  }

  private loadAdminLeads(): void {
    this.isLoading$.next(true);
    this.firebaseService.getCurrentVersion().subscribe(version => {
      if (!version) { this.isLoading$.next(false); return; }

      this.firebaseService.getAffiliatesByVersion(version.key).subscribe(affiliates => {
        this.buildAffiliateOptions(affiliates);
      });

      this.firebaseService.getClosedLeadsByVersion(version.key).subscribe(
        leads => {
          this.allLeads = leads.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.applyFilters();
          this.isLoading$.next(false);
        },
        () => {
          this.toastr.showError('Failed to load leads');
          this.isLoading$.next(false);
        }
      );
    });
  }

  private buildAffiliateOptions(affiliates: Affiliate[]): void {
    this.affiliateMap = {};
    affiliates.forEach(a => { if (a.key) this.affiliateMap[a.key] = a.name; });

    const sorted = [...affiliates].sort((a, b) => a.name.localeCompare(b.name));
    this.affiliateOptions = [
      { value: FILTER_WITH_AFFILIATE, label: 'Without Affiliate' },
      { value: FILTER_ALL,            label: 'All Leads' },
      ...sorted.map(a => ({ value: a.key || '', label: a.name }))
    ];
  }

  applyFilters(): void {
    let result = [...this.allLeads];

    if (this.isAdmin || this.isAccountManager) {
      if (this.selectedAffiliateFilter === FILTER_WITH_AFFILIATE) {
        result = result.filter(l => !l.affiliateKey);
      } else if (this.selectedAffiliateFilter !== FILTER_ALL) {
        result = result.filter(l => l.affiliateKey === this.selectedAffiliateFilter);
      }
    }

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      result = result.filter(l =>
        l.fullName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q)
      );
    }

    this.leads = result;
    this.totalCount = result.length;
    this.page = 1;
  }

  applySearch(): void { this.applyFilters(); }

  get paginatedLeads(): Lead[] {
    const start = (this.page - 1) * this.size;
    return this.leads.slice(start, start + this.size);
  }

  getAffiliateName(affiliateKey?: string): string {
    return affiliateKey ? (this.affiliateMap[affiliateKey] || affiliateKey) : '—';
  }

  getAffiliateStatusLabel(status?: string): string {
    return AFFILIATE_STATUS_LABELS[(status as AffiliateStatus)] || 'Renewal Follow-up';
  }

  getSalesStatusLabel(lead: Lead): string {
    const label = SALES_STATUS_LABELS[(lead.sales_status as SalesStatus)] || 'New';
    return lead.sales_status === 'closed' && lead.sales_package
      ? `${label} - ${SALES_PACKAGE_LABELS[lead.sales_package]}`
      : label;
  }

  getRenewalStatusLabel(lead: Lead): string {
    const status = lead.renewal_status || lead.affiliate_status || 'renewal_followup';
    const label = this.getAffiliateStatusLabel(status);
    return status === 'renewed' && lead.renewal_package
      ? `${label} - ${SALES_PACKAGE_LABELS[lead.renewal_package]}`
      : label;
  }

  getRenewalCount(lead: Lead): number {
    return lead.renewal_count ?? (lead.affiliate_status === 'renewed' ? 1 : 0);
  }

  getAffiliateStatusClass(status?: string): string {
    const map: Record<string, string> = {
      renewal_followup: 'pill-warning',
      renew_later: 'pill-info',
      renewed: 'pill-success',
      not_renewed: 'pill-danger'
    };
    return map[status || 'renewal_followup'] || 'pill-warning';
  }

  getInitial(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  getDate(ts: string): string {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  view(lead: Lead): void {
    const modalRef = this.modalService.open(ViewAffiliateLeadComponent, {
      centered: true, size: 'lg'
    });
    modalRef.componentInstance.lead = lead;
    modalRef.componentInstance.readOnly = this.isAffiliate;
    modalRef.result.then(() => this.loadLeads(), () => {});
  }
}
