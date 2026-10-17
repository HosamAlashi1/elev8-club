import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Coupon, CouponPlan, COUPON_PLAN_LABELS } from '../../../../../core/models';
import { CouponService } from '../../../../services/coupon.service';

/** No 0/O/1/I: a code read out loud or typed from a screenshot should not be ambiguous. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-Z0-9-]{3,24}$/;
const MAX_BATCH = 200;

function randomPart(length: number): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
}

/**
 * Creates one coupon (optionally with a code you choose) or a batch of single-use codes in one go.
 * Rules decided with the owner: percentage discount; single use by default (the admin can raise it);
 * a coupon is for ONE plan by default, or for all plans; counted as used only when a payment succeeds
 * (the server does that, not this page).
 */
@Component({
  selector: 'app-create-coupons',
  templateUrl: './create-coupons.component.html',
  styleUrls: ['./create-coupons.component.css']
})
export class CreateCouponsComponent {
  readonly planOptions: { value: CouponPlan; label: string }[] = [
    { value: 'starter', label: COUPON_PLAN_LABELS.starter },
    { value: 'pro', label: COUPON_PLAN_LABELS.pro },
    { value: 'ai', label: COUPON_PLAN_LABELS.ai },
    { value: 'all', label: COUPON_PLAN_LABELS.all },
  ];

  form = new FormGroup({
    percent: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(100)]),
    plan: new FormControl<CouponPlan>('starter', Validators.required),
    maxUses: new FormControl<number>(1, [Validators.required, Validators.min(1), Validators.max(100000)]),
    quantity: new FormControl<number>(1, [Validators.required, Validators.min(1), Validators.max(MAX_BATCH)]),
    code: new FormControl<string>('', Validators.pattern(/^[A-Za-z0-9-]*$/)),
    prefix: new FormControl<string>('', Validators.pattern(/^[A-Za-z0-9-]*$/)),
  });

  submitted = false;
  isSubmitting = false;
  error = '';
  /** Filled after a successful create, so the codes can be copied straight away. */
  createdCodes: string[] = [];
  copiedAll = false;
  readonly maxBatch = MAX_BATCH;

  constructor(public activeModal: NgbActiveModal, private coupons: CouponService) {}

  get f() { return this.form.controls; }
  get isBatch(): boolean { return (this.f.quantity.value || 1) > 1; }

  async submit(): Promise<void> {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const quantity = v.quantity || 1;
    const prefix = (v.prefix || '').trim().toUpperCase();
    const custom = (v.code || '').trim().toUpperCase();

    const codes = new Set<string>();
    if (quantity === 1 && custom) {
      if (!CODE_RE.test(custom)) { this.error = 'Code must be 3–24 characters: letters, numbers or a hyphen.'; return; }
      codes.add(custom);
    } else {
      while (codes.size < quantity) {
        codes.add((prefix ? prefix + '-' : '') + randomPart(8));
      }
    }

    const records: Omit<Coupon, 'createdAt' | 'usedCount' | 'createdBy'>[] = [...codes].map(code => ({
      code, percent: v.percent as number, plan: v.plan as CouponPlan, maxUses: v.maxUses as number, isActive: true
    }));

    this.isSubmitting = true;
    try {
      const { created, taken } = await this.coupons.create(records);
      if (taken.length && !created.length) {
        this.error = taken.length === 1 ? `The code ${taken[0]} already exists.` : 'Those codes already exist, try again.';
        return;
      }
      this.createdCodes = created;
      if (taken.length) this.error = `${taken.length} code(s) already existed and were skipped.`;
    } catch (e: any) {
      this.error = /permission/i.test(e?.message || '')
        ? 'Permission denied. The database rules for coupons are not deployed yet.'
        : (e?.message || 'Could not create the coupons.');
    } finally {
      this.isSubmitting = false;
    }
  }

  copyAll(): void {
    navigator.clipboard.writeText(this.createdCodes.join('\n')).then(() => {
      this.copiedAll = true;
      setTimeout(() => (this.copiedAll = false), 1500);
    });
  }
}
