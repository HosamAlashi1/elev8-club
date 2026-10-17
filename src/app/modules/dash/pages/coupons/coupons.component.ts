import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CouponService } from '../../../services/coupon.service';
import { ToastrsService } from '../../../services/toater.service';
import { PublicService } from '../../../services/public.service';
import { DeleteComponent } from '../../shared/delete/delete.component';
import { CreateCouponsComponent } from './create-coupons/create-coupons.component';
import {
  Coupon, CouponStatus, couponStatus, COUPON_PLAN_LABELS, COUPON_STATUS_LABELS
} from '../../../../core/models';

interface CouponRow extends Coupon {
  status: CouponStatus;
  planLabel: string;
  copied?: boolean;
}

/**
 * Coupons for the v3 checkout. Admin-only. Lists every coupon with its discount, plan, usage and
 * status, creates one or a whole batch, and switches a coupon off without deleting its history.
 * `usedCount` is written by the payment function when a payment succeeds, never from here.
 */
@Component({
  selector: 'app-coupons',
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.css']
})
export class CouponsComponent implements OnInit, OnDestroy {
  isLoading$ = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();

  private all: CouponRow[] = [];
  coupons: CouponRow[] = [];

  searchText = '';
  selectedPlan = '';
  selectedStatus = '';
  loadError = '';

  readonly planOptions = [
    { value: '', label: 'All Plans' },
    ...(['starter', 'pro', 'ai', 'all'] as const).map(p => ({ value: p, label: COUPON_PLAN_LABELS[p] })),
  ];
  readonly statusOptions = [
    { value: '', label: 'All Statuses' },
    ...(['active', 'used_up', 'disabled'] as const).map(s => ({ value: s, label: COUPON_STATUS_LABELS[s] })),
  ];
  readonly statusLabels = COUPON_STATUS_LABELS;

  summary = { total: 0, active: 0, usedUp: 0, redemptions: 0 };

  page = 1;
  size = 10;
  totalCount = 0;

  constructor(
    private couponService: CouponService,
    private modalService: NgbModal,
    private toastr: ToastrsService,
    public publicService: PublicService
  ) {
    this.size = this.publicService.getNumOfRows(450, 54.3);
  }

  ngOnInit(): void {
    this.couponService.list().pipe(takeUntil(this.destroy$)).subscribe({
      next: rows => {
        this.loadError = '';
        this.all = rows.map(c => ({
          ...c,
          usedCount: c.usedCount || 0,
          status: couponStatus({ ...c, usedCount: c.usedCount || 0 }),
          planLabel: COUPON_PLAN_LABELS[c.plan] || c.plan
        }));
        this.summary = {
          total: this.all.length,
          active: this.all.filter(c => c.status === 'active').length,
          usedUp: this.all.filter(c => c.status === 'used_up').length,
          redemptions: this.all.reduce((n, c) => n + c.usedCount, 0)
        };
        this.applyFilters(false);
        this.isLoading$.next(false);
      },
      error: err => {
        console.error('Coupons error:', err);
        this.loadError = /permission/i.test(err?.message || '')
          ? 'The database rules for coupons are not deployed yet, so nothing can be read or written.'
          : 'Failed to load coupons.';
        this.isLoading$.next(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(resetPage = true): void {
    const q = this.searchText.trim().toUpperCase();
    this.coupons = this.all.filter(c =>
      (!q || c.code.includes(q)) &&
      (!this.selectedPlan || c.plan === this.selectedPlan) &&
      (!this.selectedStatus || c.status === this.selectedStatus)
    );
    this.totalCount = this.coupons.length;
    if (resetPage) this.page = 1;
  }

  list(page: number): void { this.page = page; }

  get paginated(): CouponRow[] {
    const start = (this.page - 1) * this.size;
    return this.coupons.slice(start, start + this.size);
  }

  create(): void {
    this.modalService.open(CreateCouponsComponent, { centered: true, size: 'lg' });
  }

  copy(c: CouponRow): void {
    navigator.clipboard.writeText(c.code).then(() => {
      c.copied = true;
      setTimeout(() => (c.copied = false), 1500);
    });
  }

  async toggle(c: CouponRow): Promise<void> {
    try {
      await this.couponService.setActive(c.code, !c.isActive);
      this.toastr.showSuccess(c.isActive ? 'Coupon disabled' : 'Coupon enabled');
    } catch {
      this.toastr.showError('Could not update the coupon');
    }
  }

  delete(c: CouponRow): void {
    const modalRef = this.modalService.open(DeleteComponent, {});
    modalRef.componentInstance.type = 'coupon';
    modalRef.componentInstance.firebaseKey = c.code;
    modalRef.componentInstance.message = c.usedCount
      ? `"${c.code}" was already used ${c.usedCount} time(s). Deleting it removes that history — disable it instead if you only want to stop it working. Delete anyway?`
      : `Are you sure you want to delete "${c.code}"? This action cannot be undone.`;
    modalRef.result.then(result => {
      if (result === 'deleted') this.toastr.showSuccess('Coupon deleted');
    }, () => {});
  }

  trackByCode(_: number, c: CouponRow): string { return c.code; }
}
