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
}

export type SalesStatus = 'new' | 'pre_meeting' | 'post_meeting' | 'follow_up' | 'closed' | 'not_interested';
export type AffiliateStatus = 'renewal_followup' | 'renewed' | 'not_renewed';

export const SALES_STATUS_LABELS: Record<SalesStatus, string> = {
  new: 'New',
  pre_meeting: 'Pre-Meeting',
  post_meeting: 'Post-Meeting',
  follow_up: 'Follow-up',
  closed: 'Closed',
  not_interested: 'Not Interested'
};

export const AFFILIATE_STATUS_LABELS: Record<AffiliateStatus, string> = {
  renewal_followup: 'Renewal Follow-up',
  renewed: 'Renewed',
  not_renewed: 'Not Renewed'
};

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
  // Sales tracking fields
  salesMemberKey?: string;
  sales_status?: SalesStatus;
  // Affiliate tracking fields
  affiliate_status?: AffiliateStatus;
}
