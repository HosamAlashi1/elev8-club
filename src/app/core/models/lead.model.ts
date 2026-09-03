/**
 * ⚠️ SHARED SCHEMA — this file must stay in sync with
 * elev8-club-v2/src/app/core/models/lead.model.ts (the v2 landing page project). Both
 * projects write to the SAME Firebase `leads` node and are read by the SAME dashboard here.
 * Any field you add/rename must be mirrored in both files. See
 * elev8-club-v2/docs/06-SYNC-WITH-V1.md.
 */
export interface LeadAnswers {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  readyAmount?: '<200' | '200-1000' | '>1000';
  readyIn24h?: 'yes' | 'no';
  location?: string;
  triedElev8Before?: 'yes' | 'no';
  mainGoal?: 'ready_trades' | 'trading_bot' | 'learn_trading' | 'steady_income';
  age?: string;
  workStatus?: string;
  monthlyIncome?: string;
  tradingExperience?: string;
  financialProblem?: string;
  investBudget?: string;
  systemGoal?: string;
  // v2 (elev8-club-v2) question set — kept here too since both projects write to this same
  // `leads` node. See elev8-club-v2/docs/05-QUALIFICATION.md.
  v2Goal?: string;
  v2TradingHistory?: string;
  v2FirstDeposit?: string;
  v2StartTiming?: string;
  v2Blocker?: string;
  v2HasTradingAccount?: string;
}

export type SalesStatus = 'new' | 'pre_meeting' | 'post_meeting' | 'follow_up' | 'closed' | 'not_interested';
export type SalesPackage = 'starter' | 'pro' | 'ai';
export type RenewalStatus = 'renewal_followup' | 'renew_later' | 'renewed' | 'not_renewed';
/** @deprecated Use RenewalStatus. Kept for existing records and imports. */
export type AffiliateStatus = RenewalStatus;

export const SALES_STATUS_LABELS: Record<SalesStatus, string> = {
  new: 'New',
  pre_meeting: 'Pre-Meeting',
  post_meeting: 'Post-Meeting',
  follow_up: 'Follow-up',
  closed: 'Closed',
  not_interested: 'Not Interested'
};

export const SALES_PACKAGE_LABELS: Record<SalesPackage, string> = {
  starter: 'Starter',
  pro: 'Pro',
  ai: 'AI'
};

export const AFFILIATE_STATUS_LABELS: Record<AffiliateStatus, string> = {
  renewal_followup: 'Renewal Follow-up',
  renew_later: 'Renew Later',
  renewed: 'Renewed',
  not_renewed: 'Not Renewed'
};

/**
 * Which landing page produced this lead. A record with no `source` predates this field — it
 * was added after elev8-club-v2 (a second landing page, same database, same dashboard) was
 * introduced. Read a missing `source` as 'v1' everywhere. Run
 * scripts/backfill-lead-source.mjs once to stamp `source: 'v1'` on old records explicitly.
 */
export type LeadSource = 'v1' | 'v2';

/** Dashboard display labels, per product decision: v1 = "Webinar", v2 = "Free community". */
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  v1: 'Webinar',
  v2: 'Free community'
};

/** v2-only: outcome of elev8-club-v2's qualification engine, computed right after step-2 answers are saved. */
export type LeadQualification = 'qualified' | 'qualified_prep' | 'not_qualified';

export const LEAD_QUALIFICATION_LABELS: Record<LeadQualification, string> = {
  qualified: 'Qualified',
  qualified_prep: 'Qualified — needs prep',
  not_qualified: 'Not qualified'
};

export interface RenewalCycle {
  key?: string;
  leadKey: string;
  versionKey: string;
  cycleNumber: number;
  status: RenewalStatus;
  package?: SalesPackage;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  createdBy: string;
}

export interface Lead {
  key?: string;
  versionKey: string;
  affiliateKey?: string;
  affiliateCode?: string;
  fullName: string;
  email: string;
  phone: string;
  country?: string;
  city?: string;
  step: 1 | 2;
  consent: boolean;
  answers?: LeadAnswers;
  createdAt: string;
  completedAt?: string;
  /** Which landing page this lead registered on. Missing on pre-existing records — read as 'v1'. */
  source?: LeadSource;
  /** v2 only — set once the qualification questions are answered. */
  qualification?: LeadQualification;
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
  /**
   * v2 only — which of its two fixed static links (AI assistant or free channel) this lead
   * was shown after qualification. No round-robin, unlike v1's assigned_sales WhatsApp-group
   * pool. See elev8-club-v2/src/app/core/config/qualification.config.ts.
   */
  assigned_channel?: {
    platform: 'telegram';
    type: 'ai_assistant' | 'group';
    link: string;
    assigned_at: number;
  };
  // Sales tracking fields
  salesMemberKey?: string;
  sales_status?: SalesStatus;
  sales_package?: SalesPackage;
  // Affiliate tracking fields
  affiliate_status?: AffiliateStatus;
  renewal_status?: RenewalStatus;
  renewal_package?: SalesPackage;
  renewal_count?: number;
  current_renewal_cycle_key?: string;
}
