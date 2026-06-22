export interface SalesMember {
  key?: string;
  versionKey: string;
  name: string;
  email: string;
  phone?: string;
  userId: string;
  isActive: boolean;
  last_assigned_at?: number | null;
  createdAt: string;
}
