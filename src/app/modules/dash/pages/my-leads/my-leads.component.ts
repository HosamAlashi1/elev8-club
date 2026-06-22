import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../services/firebase.service';
import { PublicService } from '../../../services/public.service';
import { ToastrsService } from '../../../services/toater.service';
import { Lead, AFFILIATE_STATUS_LABELS, AffiliateStatus } from '../../../../core/models';
import { ViewAffiliateLeadComponent } from './view-affiliate-lead/view-affiliate-lead.component';

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

  constructor(
    private firebaseService: FirebaseService,
    private publicService: PublicService,
    private toastr: ToastrsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
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
        this.applySearch();
        this.isLoading$.next(false);
      },
      () => {
        this.toastr.showError('Failed to load leads');
        this.isLoading$.next(false);
      }
    );
  }

  applySearch(): void {
    if (!this.searchText.trim()) {
      this.leads = [...this.allLeads];
    } else {
      const q = this.searchText.toLowerCase();
      this.leads = this.allLeads.filter(l =>
        l.fullName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q)
      );
    }
    this.totalCount = this.leads.length;
    this.page = 1;
  }

  get paginatedLeads(): Lead[] {
    const start = (this.page - 1) * this.size;
    return this.leads.slice(start, start + this.size);
  }

  getAffiliateStatusLabel(status?: string): string {
    return AFFILIATE_STATUS_LABELS[(status as AffiliateStatus)] || 'Renewal Follow-up';
  }

  getAffiliateStatusClass(status?: string): string {
    const map: Record<string, string> = {
      renewal_followup: 'pill-warning',
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
    modalRef.result.then(() => this.loadLeads(), () => {});
  }
}
