import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../../services/firebase.service';
import { Version, Affiliate, Lead } from '../../../../core/models';
import { ToastrsService } from '../../../services/toater.service';
import { AddEditAffiliateComponent } from './add-edit-affiliate/add-edit-affiliate.component';
import { ViewAffiliateComponent } from './view-affiliate/view-affiliate.component';
import { PublicService } from 'src/app/modules/services/public.service';
import { DeleteComponent } from '../../shared/delete/delete.component';

interface AffiliateWithStats extends Affiliate {
  leadsCount: number;
  completedCount: number;
  copied?: boolean;
}

@Component({
  selector: 'app-affiliates',
  templateUrl: './affiliates.component.html',
  styleUrls: ['./affiliates.component.css']
})
export class AffiliatesComponent implements OnInit, OnDestroy {
  isLoading$ = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();

  affiliates: AffiliateWithStats[] = [];
  allAffiliates: AffiliateWithStats[] = [];
  currentVersion: Version | null = null;

  searchText = '';

  // Pagination
  page = 1;
  size = 10;
  totalCount = 0;

  constructor(
    private firebaseService: FirebaseService,
    private modalService: NgbModal,
    private toastr: ToastrsService,
    public publicService: PublicService,
  ) {
    this.size = this.publicService.getNumOfRows(450, 54.3);
  }

  ngOnInit(): void {
    this.loadCurrentVersion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** 🔥 Helper Function لتفعيل لودر الطاولة */
  private setTableLoading(fn: () => void, delay: number = 150): void {
    this.isLoading$.next(true);
    fn();
    setTimeout(() => this.isLoading$.next(false), delay);
  }

  loadCurrentVersion(): void {
    this.firebaseService.getCurrentVersion().pipe(
      switchMap(version => {
        this.currentVersion = version;
        if (!version) return of(null);
        return combineLatest({
          affiliates: this.firebaseService.getAffiliatesByVersion(version.key),
          leads: this.firebaseService.getLeadsByVersion(version.key)
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: data => {
        if (!data) {
          this.allAffiliates = [];
          this.onSearchChange();
          this.isLoading$.next(false);
          return;
        }

        this.allAffiliates = data.affiliates.map(affiliate => {
          const leads = data.leads.filter(lead => lead.affiliateKey === affiliate.key);
          return {
            ...affiliate,
            leadsCount: leads.length,
            completedCount: leads.filter(lead => lead.step === 2).length
          };
        });
        this.onSearchChange();
        this.isLoading$.next(false);
      },
      error: error => {
        console.error('Error loading affiliates:', error);
        this.toastr.showError('Failed to load affiliates');
        this.isLoading$.next(false);
      }
    });
  }

  loadAffiliates(): void {
    // The live Firebase subscription refreshes affiliates and their stats.
  }

  /** 🔍 Search with loader */
  onSearchChange(): void {
    this.setTableLoading(() => {
      if (!this.searchText.trim()) {
        this.affiliates = this.allAffiliates;
        this.totalCount = this.allAffiliates.length;
        this.page = 1;
        return;
      }

      const search = this.searchText.toLowerCase();

      this.affiliates = this.allAffiliates.filter(a =>
        a.name.toLowerCase().includes(search) ||
        a.email.toLowerCase().includes(search) ||
        a.code.toLowerCase().includes(search)
      );

      this.totalCount = this.affiliates.length;
      this.page = 1;
    });
  }

  /** ⏭ Pagination with loader */
  list(page: number): void {
    this.setTableLoading(() => {
      this.page = page;
    });
  }

  get paginatedAffiliates(): AffiliateWithStats[] {
    const start = (this.page - 1) * this.size;
    const end = start + this.size;
    return this.affiliates.slice(start, end);
  }

  copyLink(aff: any): void {
    const link = `${window.location.origin}/#/home?ref=${aff.code}`;

    navigator.clipboard.writeText(link).then(() => {
      aff.copied = true;

      setTimeout(() => {
        aff.copied = false;
      }, 1500);
    });
  }

  add(): void {
    const modalRef = this.modalService.open(AddEditAffiliateComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.versionKey = this.currentVersion?.key;

    modalRef.result.then(() => this.loadAffiliates(), () => {});
  }

  view(affiliate: AffiliateWithStats): void {
    const modalRef = this.modalService.open(ViewAffiliateComponent, {
      centered: true,
      size: 'xl'
    });

    modalRef.componentInstance.affiliate = affiliate;
  }

  edit(affiliate: AffiliateWithStats): void {
    const modalRef = this.modalService.open(AddEditAffiliateComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.affiliate = affiliate;
    modalRef.componentInstance.versionKey = this.currentVersion?.key;

    modalRef.result.then(() => this.loadAffiliates(), () => {});
  }

  delete(affiliate: AffiliateWithStats): void {
    const modalRef = this.modalService.open(DeleteComponent, {});

    modalRef.componentInstance.type = 'affiliate';
    modalRef.componentInstance.firebaseKey = affiliate.key;
    modalRef.componentInstance.message =
      `Are you sure you want to delete "${affiliate.name}"? This action cannot be undone.`;

    modalRef.result.then(result => {
      if (result === 'deleted') {
        this.toastr.showSuccess('Affiliate deleted successfully');
        this.loadAffiliates();
      }
    });
  }
}
