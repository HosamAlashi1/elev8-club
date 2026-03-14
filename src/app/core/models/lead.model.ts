export interface LeadAnswers {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  readyAmount?: '<200' | '200-1000' | '>1000';
  readyIn24h?: 'yes' | 'no';
  location?: string;
  triedElev8Before?: 'yes' | 'no';
  mainGoal?: 'ready_trades' | 'trading_bot' | 'learn_trading' | 'steady_income';
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
  assigned_sales?: {
    sales_id: string;
    whatsapp_number: string;
    assigned_at: number;
    assigned_via: string;
  };
}
