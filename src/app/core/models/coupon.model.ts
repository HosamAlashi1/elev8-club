import { SalesPackage } from './lead.model';

/**
 * A discount coupon for the v3 ("offer") checkout.
 *
 * Stored at `coupons/{CODE}` — the code IS the key, so two coupons can never share a code and the
 * payment function can look one up with a single read. The node is admin-only (database.rules.json):
 * the browser never lists coupons. Whether a code is valid, what it takes off and the final price are
 * decided by the server at payment time; this page only manages the records.
 *
 * `usedCount` is incremented by the server only when a payment SUCCEEDS (not when a code is checked,
 * not when a payment fails) — the dashboard never writes it.
 */
export type CouponPlan = 'all' | SalesPackage;

export interface Coupon {
  /** Same as the record key (uppercase letters, digits, hyphen). */
  code: string;
  /** Percentage off, 1–100. */
  percent: number;
  /** One plan, or 'all'. */
  plan: CouponPlan;
  /** How many successful payments may use it. 1 = single use (the default). */
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

export const COUPON_PLAN_LABELS: Record<CouponPlan, string> = {
  all: 'All plans',
  starter: 'Starter',
  pro: 'Pro',
  ai: 'AI'
};

export type CouponStatus = 'active' | 'used_up' | 'disabled';

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  active: 'Active',
  used_up: 'Used up',
  disabled: 'Disabled'
};

export function couponStatus(c: Pick<Coupon, 'isActive' | 'usedCount' | 'maxUses'>): CouponStatus {
  if (!c.isActive) return 'disabled';
  return (c.usedCount || 0) >= c.maxUses ? 'used_up' : 'active';
}
