export type UserRole = 'admin' | 'sales' | 'account_manager' | 'affiliate';

export interface DashboardUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  salesMemberKey?: string;   // only for role = sales
  affiliateKey?: string;     // only for role = affiliate
  versionKey?: string;
  last_assigned_at?: number | null; // only for role = account_manager
}
