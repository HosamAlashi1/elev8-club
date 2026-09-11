export type CallType =
  | 'invitation'
  | 'presentation_confirmation'
  | 'presentation_followup'
  | 'offer'
  | 'followup'
  | 'affiliate_followup'
  /**
   * v2 only — chasing a lead through the Telegram bot's seven steps. The sales member logs one
   * of these per attempt so there is a history of who was pushed where, rather than only the
   * bot's own "currently on step 4" with no record of the effort behind it.
   */
  | 'bot_followup';

export type CallStatus = 'answered' | 'no_answer' | 'busy';

export type CallLogType = 'sales' | 'affiliate' | 'renewal';

export interface CallLog {
  key?: string;
  leadKey: string;
  versionKey: string;
  callType: CallType;
  callDate: string;
  callTime: string;
  status: CallStatus;
  notes?: string;
  type: CallLogType;
  createdBy: string;
  createdAt: string;
  renewalCycleKey?: string;
  renewalCycleNumber?: number;
}

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  invitation: 'Invitation Call',
  presentation_confirmation: 'Presentation Confirmation',
  presentation_followup: 'Presentation Follow-up',
  offer: 'Offer Call',
  followup: 'Follow-up Call',
  affiliate_followup: 'Renewal Follow-up',
  bot_followup: 'Bot Follow-up Call'
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  answered: 'Answered',
  no_answer: 'No Answer',
  busy: 'Busy'
};
