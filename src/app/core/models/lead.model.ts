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

/**
 * The CRM pipeline. v1 (Webinar) leads walk the five original steps; v2 (Free community) leads
 * walk three — `bot_followup` → `follow_up` → `closed` — because they are handed to the Telegram
 * bot instead of a webinar. `bot_followup` is therefore only ever written on a v2 lead, and the
 * v1 steps below are untouched by that. See V1_SALES_PIPELINE / V2_SALES_PIPELINE.
 */
export type SalesStatus =
  | 'new' | 'pre_meeting' | 'post_meeting' | 'follow_up' | 'closed' | 'not_interested'
  | 'bot_followup';
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
  not_interested: 'Not Interested',
  bot_followup: 'Bot Follow-up'
};

/** The five steps a v1 lead walks. Unchanged — v2's pipeline is a separate list. */
export const V1_SALES_PIPELINE: SalesStatus[] = ['new', 'pre_meeting', 'post_meeting', 'follow_up', 'closed'];

/** The three steps a v2 lead walks: chase them through the bot, then follow up, then close. */
export const V2_SALES_PIPELINE: SalesStatus[] = ['bot_followup', 'follow_up', 'closed'];

/** Which pipeline a lead belongs to. A missing `source` predates the field and reads as v1. */
export function salesPipelineFor(source?: LeadSource): SalesStatus[] {
  return (source || 'v1') === 'v2' ? V2_SALES_PIPELINE : V1_SALES_PIPELINE;
}

/**
 * A v2 lead's resting status. v2 stamps `bot_followup` at creation, but leads created before
 * this feature — and anything that ran through `assignSalesMemberToLead` — carry the shared
 * default `new`, which is not a step on v2's pipeline. Read it as the first step instead of
 * rendering a lead that sits outside its own pipeline.
 */
export function effectiveSalesStatus(lead: Pick<Lead, 'source' | 'sales_status'>): SalesStatus {
  const status = lead.sales_status;
  if ((lead.source || 'v1') === 'v2') {
    return !status || status === 'new' ? 'bot_followup' : status;
  }
  return status || 'new';
}

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

// ──────────────────────────────────────────────────────────────────────────────
// v2 Telegram bot
//
// A qualified v2 lead is handed a six-digit subscription number and sent to
// @elev8_club_community_bot. The lead types that number into the bot, which is how the bot's
// backend (TMS_Backend, FreeBotSteps) finds this record and reports progress back into it.
//
// Everything below except `subscriptionNumber` is therefore WRITTEN BY THE BOT BACKEND, not by
// the landing page or this dashboard. v2 creates them at their defaults so the record has a
// stable shape; the dashboard shows them read-only. The one exception is
// `accountVerificationStatus`, which the dashboard changes through the bot's own HTTP API
// (BotAccountService) rather than by writing to Firebase — the bot has to message the lead when
// it flips, so the write has to go through the backend that owns the conversation.
// ──────────────────────────────────────────────────────────────────────────────

/** The lead's tier inside the bot. Every lead starts on `free`; the backend promotes it. */
export type LeadBotType = 'free' | 'start' | 'ai' | 'pro';

export const LEAD_BOT_TYPE_LABELS: Record<LeadBotType, string> = {
  free: 'Free',
  start: 'Start',
  ai: 'AI',
  pro: 'Pro'
};

/**
 * Where the lead's trading account stands with our verification:
 *   not_submitted — added to the bot but has not sent a trading-account number yet
 *   pending       — number sent, waiting on us
 *   verified      — we accepted it
 *   rejected      — we turned it down
 */
export type AccountVerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export const ACCOUNT_VERIFICATION_LABELS: Record<AccountVerificationStatus, string> = {
  not_submitted: 'Not Submitted',
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected'
};

/** Only these two can be pushed to the bot's API; the other two are states it reports to us. */
export type AccountVerificationDecision = Extract<AccountVerificationStatus, 'verified' | 'rejected'>;

/** The bot's onboarding flow, mirroring TMS_Backend's FreeBotSteps. */
export const BOT_TOTAL_STEPS = 7;

export const BOT_STEP_LABELS: Record<number, string> = {
  1: 'Trading intro',
  2: 'Open trading account',
  3: 'Verify trading account',
  4: 'Deposit',
  5: 'Send account number',
  6: 'Account under review',
  7: 'Join the community'
};

export function botStepLabel(stepNumber?: number): string {
  if (!stepNumber) return '—';
  return BOT_STEP_LABELS[stepNumber] || `Step ${stepNumber}`;
}

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
  // ── v2 Telegram bot ────────────────────────────────────────────────────────
  // See the block above the LeadBotType declaration. Only `subscriptionNumber` is ours; the
  // rest are created at their defaults and then owned by the bot's backend.

  /**
   * v2 only — the six-digit code the lead copies out of the result screen and types into the
   * bot, which is how the bot's backend identifies this record. Unique across all leads;
   * claimed through the `subscription_codes/{code}` index so two people finishing the quiz at
   * the same moment cannot land on the same number.
   */
  subscriptionNumber?: string;
  /** v2 only — bot tier. Created as 'free'. */
  type?: LeadBotType;
  /** v2 only — set by the bot the first time the lead talks to it. Null until then. */
  telegramChatId?: number | null;
  /** v2 only — which of the bot's 7 steps the lead is on. Created as 1. */
  currentStepNumber?: number;
  /** v2 only — the trading account the lead sent the bot at step 5. Empty until then. */
  tradingAccountNumber?: string;
  /** v2 only — created as 'not_submitted'. Changed via the bot's API, not written directly. */
  accountVerificationStatus?: AccountVerificationStatus;
  /** v2 only — ISO timestamps written by the bot. Null until the bot reaches each point. */
  botStartedAt?: string | null;
  botCompletedAt?: string | null;
  botLastInteractionAt?: string | null;

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
