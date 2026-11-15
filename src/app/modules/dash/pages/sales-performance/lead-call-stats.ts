import { CallLog, Lead, LeadSource, LEAD_SOURCE_LABELS } from '../../../../core/models';

/**
 * Two levels of numbers, kept apart on purpose:
 *  - call level: every attempt counts, even repeated attempts on the same lead;
 *  - lead level: a lead called five times is ONE lead and five calls.
 * Every call result is kept as it was logged; the lead's own outcome (`reached`) is derived
 * separately and never rewrites the calls.
 */

export interface SegmentRow {
  key: string;
  label: string;
  assigned: number;
  called: number;
  calls: number;
  answered: number;
  noAnswer: number;
  busy: number;
}

export interface LeadCallRow {
  leadKey: string;
  name: string;
  phone: string;
  segment: string;
  calls: number;
  answered: number;
  noAnswer: number;
  busy: number;
  /** At least one call was answered. A later no-answer does not undo it. */
  reached: boolean;
  lastCallAt: string;
}

/** A lead with no `source` predates the field: it is a v1 / Webinar lead. */
export const sourceOfLead = (l: Lead): LeadSource => (l.source || 'v1') as LeadSource;

const SEGMENT_ORDER: LeadSource[] = ['v1', 'webinar2', 'v2', 'offer'];

export function countUniqueLeads(calls: CallLog[]): number {
  return new Set(calls.map(c => c.leadKey)).size;
}

const tally = (calls: CallLog[]) => ({
  calls: calls.length,
  answered: calls.filter(c => c.status === 'answered').length,
  noAnswer: calls.filter(c => c.status === 'no_answer').length,
  busy: calls.filter(c => c.status === 'busy').length
});

/** Per Webinar / product: assigned leads, distinct leads called, and the call results. */
export function buildSegments(assignedLeads: Lead[], calls: CallLog[], leadsByKey: Map<string, Lead>): SegmentRow[] {
  const rows: SegmentRow[] = SEGMENT_ORDER.map(source => {
    const segCalls = calls.filter(c => {
      const lead = leadsByKey.get(c.leadKey);
      return !!lead && sourceOfLead(lead) === source;
    });
    return {
      key: source,
      label: LEAD_SOURCE_LABELS[source],
      assigned: assignedLeads.filter(l => sourceOfLead(l) === source).length,
      called: countUniqueLeads(segCalls),
      ...tally(segCalls)
    };
  }).filter(r => r.assigned > 0 || r.calls > 0);

  if (rows.length) {
    rows.push({
      key: 'total',
      label: 'Total',
      assigned: rows.reduce((s, r) => s + r.assigned, 0),
      called: rows.reduce((s, r) => s + r.called, 0),
      calls: rows.reduce((s, r) => s + r.calls, 0),
      answered: rows.reduce((s, r) => s + r.answered, 0),
      noAnswer: rows.reduce((s, r) => s + r.noAnswer, 0),
      busy: rows.reduce((s, r) => s + r.busy, 0)
    });
  }
  return rows;
}

/** One row per distinct lead that was called, most-called first. */
export function buildLeadCallRows(calls: CallLog[], leadsByKey: Map<string, Lead>): LeadCallRow[] {
  const byLead = new Map<string, CallLog[]>();
  calls.forEach(c => {
    const bucket = byLead.get(c.leadKey);
    if (bucket) bucket.push(c);
    else byLead.set(c.leadKey, [c]);
  });

  return [...byLead.entries()].map(([leadKey, list]) => {
    const lead = leadsByKey.get(leadKey);
    const t = tally(list);
    return {
      leadKey,
      name: lead?.fullName || 'Unknown lead',
      phone: lead?.phone || '',
      segment: lead ? LEAD_SOURCE_LABELS[sourceOfLead(lead)] : '-',
      calls: t.calls,
      answered: t.answered,
      noAnswer: t.noAnswer,
      busy: t.busy,
      reached: t.answered > 0,
      lastCallAt: list.reduce((a, c) => (c.createdAt > a ? c.createdAt : a), '')
    };
  }).sort((a, b) => b.calls - a.calls || b.lastCallAt.localeCompare(a.lastCallAt));
}
