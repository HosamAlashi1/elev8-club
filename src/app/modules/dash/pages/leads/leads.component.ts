import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../services/firebase.service';
import { Version, Lead, Affiliate } from '../../../../core/models';
import { ToastrsService } from '../../../services/toater.service';
import { ViewLeadComponent } from './view-lead/view-lead.component';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { PublicService } from 'src/app/modules/services/public.service';

interface LeadWithAffiliate extends Lead {
  affiliateName?: string;
  affiliateCode?: string;
}

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(true);

  leads: LeadWithAffiliate[] = [];
  allLeads: LeadWithAffiliate[] = [];
  currentVersion: Version | null = null;
  affiliates: Affiliate[] = [];

  // Filters
  searchText = '';

  // Pagination
  page = 1;
  size = 10;
  totalCount = 0;

  constructor(
    private firebaseService: FirebaseService,
    private modalService: NgbModal,
    private toastr: ToastrsService,
    private publicService: PublicService
  ) {
    this.size = this.publicService.getNumOfRows(450, 68);
  }

  ngOnInit(): void {
    this.loadCurrentVersion();
  }

  // Helper صغير عشان نضمن اللودر يبان لطرفة عين
  private setTableLoading(fn: () => void, delay: number = 150): void {
    this.isLoading$.next(true);
    fn();
    setTimeout(() => this.isLoading$.next(false), delay);
  }

  loadCurrentVersion(): void {
    this.firebaseService.getCurrentVersion().subscribe(version => {
      this.currentVersion = version;
      if (version) {
        this.loadAffiliates();
      } else {
        this.toastr.showError('No active version found');
        this.isLoading$.next(false);
      }
    });
  }

  loadAffiliates(): void {
    this.firebaseService.getAllAffiliates().subscribe(affiliates => {
      this.affiliates = affiliates;
      this.loadLeads();
    });
  }

  loadLeads(): void {
    if (!this.currentVersion) return;

    this.isLoading$.next(true);

    this.firebaseService.getLeadsByVersion(this.currentVersion.key).subscribe(
      leads => {
        // Add affiliate information to each lead
        this.allLeads = leads.map(lead => {
          const affiliate = this.affiliates.find(a => a.key === lead.affiliateKey);
          return {
            ...lead,
            affiliateName: affiliate?.name || 'none',
            affiliateCode: affiliate?.code || lead.affiliateCode
          };
        });

        this.applyFilters(false); // ما نرجّع اللودر من هنا لأنه جوّا بيتعامل
      },
      error => {
        console.error('Error loading leads:', error);
        this.toastr.showError('Failed to load leads');
        this.isLoading$.next(false);
      }
    );
  }

  /**
   * applyFilters
   * لما نبحث أو نفلتر، نفعّل لودر بسيط
   */
  applyFilters(withLoading: boolean = true): void {
    const run = () => {
      let filtered = [...this.allLeads];

      if (this.searchText.trim()) {
        const search = this.searchText.toLowerCase();
        filtered = filtered.filter(l =>
          l.fullName.toLowerCase().includes(search) ||
          l.email.toLowerCase().includes(search) ||
          l.phone?.toLowerCase().includes(search) ||
          l.affiliateName?.toLowerCase().includes(search)
        );
      }

      this.leads = filtered;
      this.totalCount = filtered.length;
      this.page = 1;
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

  /**
   * Getter للصفحة الحالية
   */
  get paginatedLeads(): LeadWithAffiliate[] {
    const start = (this.page - 1) * this.size;
    const end = start + this.size;
    return this.leads.slice(start, end);
  }

  view(lead: LeadWithAffiliate): void {
    const modalRef = this.modalService.open(ViewLeadComponent, {
      centered: true,
      size: 'xl'
    });

    modalRef.componentInstance.lead = lead;
  }

  /**
   * تصدير CSV مع دعم كامل للعربي (UTF-8 + BOM)
   */
  exportToCSV(): void {
    if (this.leads.length === 0) {
      this.toastr.showWarning('No leads to export');
      return;
    }

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Country',
      'City',
      'Affiliate',
      'Status',
      'Created At'
    ];

    const rows = this.leads.map(lead => [
      lead.fullName || '',
      lead.email || '',
      lead.phone || '',
      lead.country || '',
      lead.city || '',
      lead.affiliateName || '',
      lead.step === 2 ? 'Completed' : 'Pending',
      new Date(lead.createdAt).toLocaleDateString('en-US')
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    // 💡 الحل لمشكلة العربي: BOM + UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toastr.showSuccess('Leads exported successfully');
  }

  getStatusPillClass(step: number): string {
    return step === 2 ? 'pill-success' : 'pill-warning';
  }

  getStatusText(step: number): string {
    return step === 2 ? 'Completed' : 'Pending';
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
