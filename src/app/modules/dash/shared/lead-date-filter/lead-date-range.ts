export const LEAD_DATE_PRESETS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-week', label: 'Last Week (7 days)' },
  { value: 'last-month', label: 'Last Month (30 days)' },
  { value: 'custom', label: 'Custom Range' },
] as const;

type LeadDatePreset = typeof LEAD_DATE_PRESETS[number]['value'];

export interface LeadDateFilter {
  preset: LeadDatePreset;
  from: string;
  to: string;
}

export function readLeadDateFilter(
  value: string | null,
  from?: string | null,
  to?: string | null
): LeadDateFilter {
  const preset = LEAD_DATE_PRESETS.find(option => option.value === value)?.value ?? 'all';
  return { preset, from: validDay(from), to: validDay(to) };
}

function validDay(value?: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : '';
}

export function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function leadDayKey(timestamp: string): string {
  if (!timestamp) return '';
  if (timestamp.length === 10) return validDay(timestamp);
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? localDayKey(date) : '';
}

export function leadDateBounds(filter: LeadDateFilter, now = new Date()): { from: string; to: string } {
  const { preset, from, to } = filter;
  if (preset === 'custom') return { from, to };
  if (preset === 'all') return { from: '', to: '' };

  const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'yesterday') lastDay.setDate(lastDay.getDate() - 1);
  const firstDay = new Date(lastDay);
  const offset = preset === 'last-week' ? 6 : preset === 'last-month' ? 29 : 0;
  firstDay.setDate(firstDay.getDate() - offset);
  return { from: localDayKey(firstDay), to: localDayKey(lastDay) };
}

export function filterLeadsByDate<T extends { createdAt: string }>(
  leads: T[],
  filter: LeadDateFilter
): T[] {
  const { from, to } = leadDateBounds(filter);
  if (!from && !to) return leads;

  return leads.filter(lead => {
    const day = leadDayKey(lead.createdAt);
    return !!day && (!from || day >= from) && (!to || day <= to);
  });
}

export function formatLeadDate(timestamp: string): string {
  const day = leadDayKey(timestamp);
  if (!day) return '—';
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
