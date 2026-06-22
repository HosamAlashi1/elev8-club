export type UserRole = 'admin' | 'sales' | 'account_manager';

export interface DashboardUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  salesMemberKey?: string;   // only for role = sales
  affiliateKey?: string;     // only for role = account_manager
}
