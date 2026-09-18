/**
 * Campaign recipient selection and personalization.
 *
 * Kept apart from the callable so the *same* predicate answers both "how
 * many will this reach?" and "who am I sending to?". When those are two
 * pieces of code they drift, and the number the admin approved stops
 * matching the number that actually gets mail.
 */

/** A lead, loosely typed — this runs against whatever is in the database. */
export interface LeadRecord {
  key?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  source?: string;
  step?: number;
  createdAt?: string;
  salesMemberKey?: string;
  sales_status?: string;
  qualification?: string;
  welcomeOrCatchupSent?: boolean;
  // v2 bot fields
  subscriptionNumber?: string;
  telegramChatId?: number | null;
  currentStepNumber?: number;
  accountVerificationStatus?: string;
  type?: string;
}

/**
 * Every dimension the dashboard can filter on. An absent or empty list means
 * "don't care", so `{}` selects everyone — which is why the caller must
 * always show the resolved count before anything is sent.
 */
export interface CampaignFilters {
  /** 'v1' | 'v2'. A lead with no source predates the field: it is v1. */
  sources?: string[];
  /** Registration step: 1 = registered only, 2 = finished the questions. */
  steps?: number[];
  /** CRM pipeline status. A missing one counts as the pipeline's first step. */
  salesStatuses?: string[];
  /** v2 only — qualification outcome. */
  qualifications?: string[];
  /** v2 only — trading-account verification. */
  accountVerification?: string[];
  /** v2 only — which of the bot's 7 steps they are on. */
  botSteps?: number[];
  /** v2 only — 'yes' if they opened the bot, 'no' if they never did. */
  botStarted?: "yes" | "no";
  /** 'yes' = only those emailed before, 'no' = only those never emailed. */
  alreadyEmailed?: "yes" | "no";
  /** ISO dates, inclusive. */
  createdFrom?: string;
  createdTo?: string;
  /** Restrict to one sales member's leads. */
  salesMemberKey?: string;
}

/** One person the campaign will reach. */
export interface Recipient {
  email: string;
  name: string;
  phone: string;
  subscriptionNumber: string;
}

// Batch sending joins every recipient in a chunk into one comma-separated
// Mailgun "to" field, so a character this pattern lets through but Mailgun
// or a "to" join rejects — a comma, `<>`, quotes — invalidates every other
// address sharing that chunk, not just the bad one. Restricted to the safe,
// unquoted address characters used by the HTML5 email input pattern.
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

/**
 * Exported so the sender can re-check a chunk right before batching it —
 * a defensive last line against exactly the failure this pattern exists to
 * prevent, in case a record ever reaches that point some other way (an old
 * stored failure from before this check existed, for one).
 * @param {string} email Address to check.
 * @return {boolean} Whether it is safe to put in a batch "to" field.
 */
export function isValidRecipientEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * A lead with no `source` predates the field — it is a v1 lead.
 * @param {LeadRecord} lead The lead.
 * @return {string} Either 'v1' or 'v2'.
 */
function sourceOf(lead: LeadRecord): string {
  return lead.source || "v1";
}

/**
 * Mirrors the dashboard's `effectiveSalesStatus`: a v2 lead sitting on the
 * shared default 'new' belongs under 'bot_followup', the first step of its
 * own three-step pipeline.
 * @param {LeadRecord} lead The lead.
 * @return {string} The status as the dashboard would show it.
 */
function statusOf(lead: LeadRecord): string {
  const status = lead.sales_status;
  if (sourceOf(lead) === "v2") {
    return !status || status === "new" ? "bot_followup" : status;
  }
  return status || "new";
}

/**
 * An empty or absent list means the filter is not in use.
 * @param {unknown} list The selected values, if any.
 * @param {unknown} value The lead's value.
 * @return {boolean} True when the lead passes this dimension.
 */
function wants(list: unknown, value: unknown): boolean {
  if (!Array.isArray(list) || list.length === 0) return true;
  return list.some((entry) => String(entry) === String(value));
}

/**
 * Decides whether one lead should receive the campaign.
 * @param {LeadRecord} lead The lead.
 * @param {CampaignFilters} f The admin's selected filters.
 * @return {boolean} True if it matches every active filter.
 */
export function matches(lead: LeadRecord, f: CampaignFilters): boolean {
  if (!lead || typeof lead !== "object") return false;

  // No address, no campaign. One live lead has a malformed address; it is
  // skipped rather than being allowed to fail the whole send.
  if (!lead.email || !EMAIL_PATTERN.test(String(lead.email).trim())) {
    return false;
  }

  if (!wants(f.sources, sourceOf(lead))) return false;
  if (!wants(f.steps, lead.step)) return false;
  if (!wants(f.salesStatuses, statusOf(lead))) return false;
  if (!wants(f.qualifications, lead.qualification)) return false;
  if (!wants(f.botSteps, lead.currentStepNumber)) return false;

  const verification = lead.accountVerificationStatus || "not_submitted";
  if (!wants(f.accountVerification, verification)) return false;

  if (f.botStarted === "yes" && !lead.telegramChatId) return false;
  if (f.botStarted === "no" && lead.telegramChatId) return false;

  if (f.alreadyEmailed === "yes" && !lead.welcomeOrCatchupSent) return false;
  if (f.alreadyEmailed === "no" && lead.welcomeOrCatchupSent) return false;

  if (f.salesMemberKey && lead.salesMemberKey !== f.salesMemberKey) {
    return false;
  }

  if (f.createdFrom || f.createdTo) {
    const created = Date.parse(lead.createdAt || "");
    if (Number.isNaN(created)) return false;
    if (f.createdFrom && created < Date.parse(f.createdFrom)) return false;
    // Inclusive of the whole end day: the admin picks a date, not an instant.
    const dayEnd = 86399999;
    if (f.createdTo && created > Date.parse(f.createdTo) + dayEnd) {
      return false;
    }
  }

  return true;
}

/**
 * Turns the leads node into the recipient list, de-duplicated by address.
 * Two records with the same email would otherwise mean the same person gets
 * the campaign twice.
 * @param {Record<string, LeadRecord>} leads The whole leads node.
 * @param {CampaignFilters} filters The admin's selected filters.
 * @return {Recipient[]} Everyone who should receive it, each once.
 */
export function selectRecipients(
  leads: Record<string, LeadRecord>,
  filters: CampaignFilters
): Recipient[] {
  const seen = new Map<string, Recipient>();

  Object.values(leads || {}).forEach((lead) => {
    if (!matches(lead, filters)) return;

    const email = String(lead.email).trim();
    const dedupeKey = email.toLowerCase();
    if (seen.has(dedupeKey)) return;

    seen.set(dedupeKey, {
      email,
      name: (lead.fullName || "").trim(),
      phone: (lead.phone || "").trim(),
      subscriptionNumber: (lead.subscriptionNumber || "").trim(),
    });
  });

  return Array.from(seen.values());
}

/**
 * The placeholders an admin can type into the editor. Mailgun's own
 * `%recipient.x%` syntax is deliberately not exposed — `{{name}}` reads
 * better to a non-developer and, more importantly, a typo in it degrades to
 * a fallback instead of leaking raw syntax into somebody's inbox.
 */
export const PLACEHOLDERS: Record<string, keyof Recipient> = {
  "name": "name",
  "الاسم": "name",
  "email": "email",
  "الايميل": "email",
  "phone": "phone",
  "الجوال": "phone",
  "code": "subscriptionNumber",
  "رقم_الاشتراك": "subscriptionNumber",
};

/** Fallbacks so a missing field never leaves a gap mid-sentence. */
const FALLBACK: Record<keyof Recipient, string> = {
  name: "بك",
  email: "",
  phone: "",
  subscriptionNumber: "",
};

const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z_؀-ۿ]+)\s*\}\}/g;

/**
 * Rewrites `{{name}}`-style placeholders into Mailgun's per-recipient
 * variables, so one API call can carry up to a thousand individually
 * personalized emails. An unknown placeholder is left exactly as typed —
 * silently deleting it would hide the admin's typo until a customer saw it.
 * @param {string} html The campaign body from the editor.
 * @return {string} The same HTML with Mailgun variables substituted in.
 */
export function toMailgunTemplate(html: string): string {
  return html.replace(PLACEHOLDER_PATTERN, (whole, rawName) => {
    const field = PLACEHOLDERS[String(rawName).trim()];
    return field ? `%recipient.${field}%` : whole;
  });
}

/**
 * The `recipient-variables` payload Mailgun substitutes from, keyed by
 * address.
 * @param {Recipient[]} recipients This batch.
 * @return {string} JSON for Mailgun's recipient-variables field.
 */
export function recipientVariables(recipients: Recipient[]): string {
  const map: Record<string, Record<string, string>> = {};
  recipients.forEach((r) => {
    map[r.email] = {
      name: r.name || FALLBACK.name,
      email: r.email,
      phone: r.phone,
      subscriptionNumber: r.subscriptionNumber,
    };
  });
  return JSON.stringify(map);
}

/**
 * The same substitution done locally, for the dashboard's preview.
 * @param {string} html The campaign body.
 * @param {Recipient} sample The lead to render it as.
 * @return {string} The personalized HTML.
 */
export function personalizeForPreview(
  html: string,
  sample: Recipient
): string {
  return html.replace(PLACEHOLDER_PATTERN, (whole, rawName) => {
    const field = PLACEHOLDERS[String(rawName).trim()];
    if (!field) return whole;
    return sample[field] || FALLBACK[field];
  });
}
