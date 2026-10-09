import { SalesPackage, SalesStatus } from './lead.model';

/**
 * A record of something a sales rep did TO a lead's pipeline state, as opposed to a call
 * attempt (see call-log.model.ts). Kept in its own `lead_activity/{leadKey}` node — parallel to
 * `lead_calls/{leadKey}` — so the sales-performance page can merge both into one timeline
 * without either writer needing to know about the other.
 */
export type LeadActivityType = 'status_change';

export interface LeadActivity {
  key?: string;
  leadKey: string;
  versionKey: string;
  type: LeadActivityType;
  fromStatus?: SalesStatus | null;
  toStatus: SalesStatus;
  package?: SalesPackage | null;
  createdBy: string;
  createdAt: string;
}
