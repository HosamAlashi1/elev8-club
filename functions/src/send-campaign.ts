import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  CampaignFilters,
  isValidRecipientEmail,
  LeadRecord,
  Recipient,
  recipientVariables,
  selectRecipients,
  toMailgunTemplate,
} from "./campaign";
import {renderEmail} from "./email-template";

const MAILGUN_DOMAIN = "elev8club.com";
const MAILGUN_BASE =
  `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
const FROM = `Elev8 Club <info@${MAILGUN_DOMAIN}>`;


/**
 * Gap between batch submissions.
 *
 * The domain is newly approved for batch sending and still building
 * reputation, so chunks go out a slow, deliberate pace apart rather than
 * back-to-back — a few minutes for a full campaign costs nothing here, since
 * the current audience (~400 leads) is small either way.
 */
const SEND_INTERVAL_MS = 45 * 1000;

/**
 * Recipients per Mailgun batch call. Mailgun allows up to 1000 recipients in
 * one `recipient-variables` batch; this stays well under that. A moderate
 * size (not the whole audience in one call, not one-by-one either) keeps a
 * single chunk failure from costing more than a fraction of the run.
 */
const BATCH_SIZE = 100;
const MAX_SEND_ATTEMPTS = 5;
const RETRY_LOCK_MS = 10 * 60 * 1000;
const SEND_BUDGET_MS = 8 * 60 * 1000;

/** Hard ceiling, so a mis-set filter cannot mail the database by accident. */
const MAX_RECIPIENTS = 5000;

const MAX_SUBJECT = 200;
const MAX_BODY = 400000;

/** What the dashboard sends. */
export interface SendCampaignRequest {
  subject: string;
  /** Body HTML from the editor, with {{name}} placeholders still in it. */
  bodyHtml: string;
  /** Small line under the wordmark in the header band. */
  preheader?: string;
  /** The gold header text. Empty/omitted falls back to DEFAULT_WORDMARK. */
  wordmark?: string;
  filters: CampaignFilters;
  /** Resolve the audience and return the count WITHOUT sending. */
  dryRun?: boolean;
  /**
   * Send one copy to this address instead of to the audience. The filters
   * are ignored. This is how you check the design and the placeholders in a
   * real inbox before putting the campaign in front of hundreds of people —
   * a preview pane cannot tell you how Gmail will actually render it.
   */
  testEmail?: string;
  /** Return recent campaign metadata without sending anything. */
  listRecent?: boolean;
  /** Retry only the recipients still recorded as failed on this campaign. */
  retryCampaignId?: string;
  /** Explicit opt-in for old campaigns created before their body was stored. */
  useCurrentBodyForLegacyRetry?: boolean;
}

interface CampaignFailure {
  email: string;
  error: string;
}

interface StoredCampaign {
  subject?: string;
  bodyHtml?: string;
  preheader?: string;
  wordmark?: string;
  filters?: CampaignFilters;
  totalRecipients?: number;
  sent?: number;
  failed?: number;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  failures?: CampaignFailure[] | Record<string, CampaignFailure>;
  retryLock?: {owner?: string; acquiredAt?: number};
}

/** An HTTP failure with Mailgun's retry information attached. */
class MailgunRequestError extends Error {
  /**
   * @param {string} message Safe error summary.
   * @param {number} status HTTP status.
   * @param {number} retryAfterMs Server-requested pause.
   */
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs: number
  ) {
    super(message);
    this.name = "MailgunRequestError";
  }
}

/**
 * @param {number} ms Duration in milliseconds.
 * @return {Promise<void>} Resolves after the duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mailgun returns the reset time in headers for 429, but its domain recipient
 * limit uses status 420 and puts `try again after ... UTC` in the JSON body.
 * @param {Response} response Mailgun response.
 * @param {string} responseText Mailgun response body.
 * @return {number} Safe wait duration in milliseconds.
 */
function retryDelay(response: Response, responseText: string): number {
  const maxDelay = 24 * 60 * 60 * 1000;
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > Date.now()) {
    return Math.min(reset - Date.now() + 250, maxDelay);
  }

  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.min(seconds * 1000, maxDelay);
    }
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) {
      return Math.min(Math.max(0, date - Date.now()), maxDelay);
    }
  }

  const bodyMatch = responseText.match(/try again after\s+([^"}]+)/i);
  if (!bodyMatch) return 0;
  const bodyDate = Date.parse(bodyMatch[1].trim());
  return Number.isFinite(bodyDate) ?
    Math.min(Math.max(0, bodyDate - Date.now() + 250), maxDelay) : 0;
}

/**
 * @param {unknown} error Send failure.
 * @return {boolean} Whether another API attempt can help.
 */
function isRetryable(error: unknown): boolean {
  if (!(error instanceof MailgunRequestError)) return true;
  return error.status === 408 || error.status === 409 || error.status === 420 ||
    error.status === 425 || error.status === 429 || error.status >= 500;
}

/**
 * Pulls out any recipient whose address could break the batch "to" field,
 * so one bad record fails only itself instead of the whole chunk it landed
 * in. `selectRecipients` already filters these out going forward — this is
 * the last line of defense for anything that reaches here anyway (an old
 * stored failure from before that filter existed, for instance).
 * @param {Recipient[]} chunk Candidates for one batch call.
 * @return {object} The split, as `{valid, invalid}`.
 */
function splitValidRecipients(
  chunk: Recipient[]
): { valid: Recipient[]; invalid: CampaignFailure[] } {
  const valid: Recipient[] = [];
  const invalid: CampaignFailure[] = [];
  chunk.forEach((recipient) => {
    if (isValidRecipientEmail(recipient.email)) {
      valid.push(recipient);
    } else {
      invalid.push({
        email: recipient.email,
        error: "Address is not valid for sending; skipped.",
      });
    }
  });
  return {valid, invalid};
}

/**
 * One Mailgun batch call: up to `BATCH_SIZE` personalized emails in a single
 * request via `recipient-variables`.
 *
 * This domain used to reject batches outright:
 *
 *     403 "Domain elev8club.com is not allowed to send large batches yet"
 *
 * Mailgun support has since lifted that restriction on elev8club.com, so
 * chunked batch sending is back as the normal path. A single recipient is
 * just a batch of one, which is also how the test send and single-address
 * retries use this function.
 *
 * A failure here is a whole-chunk failure (auth, rate limit, malformed
 * request) — Mailgun accepting the batch means it queued mail to everyone in
 * it, so per-recipient bounces surface later via Mailgun's own delivery
 * events, not in this response.
 *
 * @param {string} apiKey The Mailgun key.
 * @param {string} subject The email subject.
 * @param {string} html The rendered email.
 * @param {Recipient[]} to Up to `BATCH_SIZE` recipients.
 * @param {string} campaignId Used as the Mailgun tag.
 * @return {Promise<string>} Mailgun's message id for the batch.
 */
async function sendBatch(
  apiKey: string,
  subject: string,
  html: string,
  to: Recipient[],
  campaignId: string
): Promise<string> {
  const form = new URLSearchParams();
  form.append("from", FROM);
  form.append("to", to.map((recipient) => recipient.email).join(","));
  form.append("subject", subject);
  form.append("html", html);
  // The body carries %recipient.x% placeholders; Mailgun substitutes them
  // per-address from this map, one merge per recipient in "to".
  form.append("recipient-variables", recipientVariables(to));
  // Tagged so this campaign's delivery, bounce and complaint rates show in
  // Mailgun separately from the transactional welcome email — a bad campaign
  // must not look like a problem with the mail that actually matters.
  form.append("o:tag", `campaign-${campaignId}`);
  form.append("o:tracking", "yes");

  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const response = await fetch(MAILGUN_BASE, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    signal: AbortSignal.timeout(30000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new MailgunRequestError(
      `Mailgun ${response.status}: ${text.slice(0, 300)}`,
      response.status,
      retryDelay(response, text)
    );
  }

  try {
    return JSON.parse(text).id || "";
  } catch {
    return "";
  }
}

/**
 * Retry a batch only for failures which can be temporary; a bad request or
 * 403 is final for that chunk.
 * @param {string} apiKey Mailgun key.
 * @param {string} subject Message subject.
 * @param {string} html Rendered HTML.
 * @param {Recipient[]} recipients This chunk.
 * @param {string} campaignId Mailgun campaign tag.
 * @param {number} deadline Stop before the Cloud Function hard timeout.
 * @return {Promise<string>} Mailgun message id.
 */
async function sendBatchWithRetry(
  apiKey: string,
  subject: string,
  html: string,
  recipients: Recipient[],
  campaignId: string,
  deadline: number
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    if (Date.now() + 5000 >= deadline) {
      throw new MailgunRequestError(
        "Deferred safely before the function timeout; use retry.", 400, 0
      );
    }
    try {
      return await sendBatch(apiKey, subject, html, recipients, campaignId);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_SEND_ATTEMPTS) throw error;

      const serverDelay = error instanceof MailgunRequestError ?
        error.retryAfterMs : 0;
      const exponential = Math.min(1000 * Math.pow(2, attempt - 1), 15000);
      const jitter = Math.floor(Math.random() * 400);
      const delay = Math.max(serverDelay, exponential + jitter);
      if (Date.now() + delay + 5000 >= deadline) {
        throw new MailgunRequestError(
          "Deferred safely before the function timeout; use retry.", 400, 0
        );
      }
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * @param {*} value Firebase array or keyed object.
 * @return {CampaignFailure[]} Normalized failures.
 */
function normalizeFailures(
  value: StoredCampaign["failures"]
): CampaignFailure[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : Object.values(value))
    .filter((failure): failure is CampaignFailure =>
      Boolean(failure && typeof failure.email === "string"))
    .map((failure) => ({
      email: failure.email.trim().toLowerCase(),
      error: String(failure.error || "Unknown error").slice(0, 300),
    }));
}

/**
 * Older campaigns capped the stored failure list at 200. Recover the missing
 * addresses only when Mailgun's accepted events and today's audience produce
 * exactly the counts recorded at send time. Any mismatch aborts the recovery
 * rather than risking a duplicate.
 * @param {string} apiKey Mailgun key.
 * @param {string} campaignId Campaign id and tag.
 * @param {StoredCampaign} campaign Stored campaign metadata.
 * @param {Recipient[]} audience Audience resolved from the original filters.
 * @param {CampaignFailure[]} knownFailures Failures retained by old code.
 * @return {Promise<CampaignFailure[]>} Exact reconstructed failure set.
 */
async function recoverLegacyFailures(
  apiKey: string,
  campaignId: string,
  campaign: StoredCampaign,
  audience: Recipient[],
  knownFailures: CampaignFailure[]
): Promise<CampaignFailure[]> {
  const expectedTotal = Number(campaign.totalRecipients || 0);
  const expectedSent = Number(campaign.sent || 0);
  const expectedFailed = Number(campaign.failed || 0);
  if (audience.length !== expectedTotal || !campaign.startedAt) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The old campaign audience has changed, so the missing failures cannot " +
      "be recovered safely. Retry the recorded addresses only."
    );
  }

  const query = new URLSearchParams({
    begin: String(Math.floor(Date.parse(campaign.startedAt) / 1000) - 300),
    ascending: "no",
    limit: "300",
    event: "accepted",
    tags: `campaign-${campaignId}`,
  });
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const response = await fetch(
    `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/events?${query.toString()}`,
    {
      headers: {"Authorization": `Basic ${auth}`},
      signal: AbortSignal.timeout(30000),
    }
  );
  const text = await response.text();
  if (!response.ok) {
    throw new functions.https.HttpsError(
      "unavailable",
      `Could not verify old Mailgun events (${response.status}).`
    );
  }

  const parsed = JSON.parse(text) as {
    items?: Array<{recipient?: string}>;
  };
  const accepted = new Set((parsed.items || [])
    .map((item) => String(item.recipient || "").trim().toLowerCase())
    .filter(Boolean));
  const audienceEmails = new Set(
    audience.map((item) => item.email.toLowerCase())
  );
  const recovered = audience
    .filter((item) => !accepted.has(item.email.toLowerCase()))
    .map((item) => ({
      email: item.email.toLowerCase(),
      error: "Recovered from old campaign",
    }));
  const knownArePresent = knownFailures.every((failure) =>
    audienceEmails.has(failure.email) && !accepted.has(failure.email));

  if (accepted.size !== expectedSent || recovered.length !== expectedFailed ||
      !knownArePresent) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Mailgun history does not exactly match the old campaign totals; " +
      "automatic recovery was stopped to prevent duplicate email."
    );
  }
  return recovered;
}

export const sendCampaignEmail = functions
  .runWith({
    secrets: ["MAILGUN_API_KEY"],
    timeoutSeconds: 540,
    memory: "512MB",
  })
  .https.onCall(async (data: SendCampaignRequest, context) => {
    // ── Who is asking ─────────────────────────────────────────────────────
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated", "Sign in first."
      );
    }

    const caller = await admin.database()
      .ref(`dashboard_users/${context.auth.uid}`)
      .once("value");

    if (caller.val()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied", "Only admins can send campaigns."
      );
    }

    // Metadata only. The saved HTML never leaves the function.
    if (data?.listRecent === true) {
      const recent = await admin.database().ref("email_campaigns")
        .limitToLast(10).once("value");
      const campaigns = Object.entries(
        (recent.val() || {}) as Record<string, StoredCampaign>
      ).map(([id, campaign]) => {
        const failures = normalizeFailures(campaign.failures);
        return {
          id,
          subject: String(campaign.subject || ""),
          startedAt: String(campaign.startedAt || ""),
          status: String(campaign.status || ""),
          totalRecipients: Number(campaign.totalRecipients || 0),
          sent: Number(campaign.sent || 0),
          failed: Number(campaign.failed || 0),
          bodyStored: typeof campaign.bodyHtml === "string",
          recordedFailures: failures.length,
          failureExamples: failures.slice(0, 3),
        };
      }).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      return {campaigns};
    }

    const retryCampaignId = String(data?.retryCampaignId || "").trim();
    if (retryCampaignId) {
      if (!/^[A-Za-z0-9_-]+$/.test(retryCampaignId)) {
        throw new functions.https.HttpsError(
          "invalid-argument", "Invalid campaign id."
        );
      }
      const apiKey = process.env.MAILGUN_API_KEY;
      if (!apiKey) {
        throw new functions.https.HttpsError(
          "failed-precondition", "MAILGUN_API_KEY is not set."
        );
      }

      const campaignRef = admin.database()
        .ref(`email_campaigns/${retryCampaignId}`);
      const campaignSnapshot = await campaignRef.once("value");
      const campaign = campaignSnapshot.val() as StoredCampaign | null;
      if (!campaign) {
        throw new functions.https.HttpsError(
          "not-found", "Campaign was not found."
        );
      }

      const lockRef = campaignRef.child("retryLock");
      const now = Date.now();
      const lock = await lockRef.transaction((current) => {
        const acquiredAt = Number(current?.acquiredAt || 0);
        if (current && now - acquiredAt < RETRY_LOCK_MS) return;
        return {owner: context.auth?.uid, acquiredAt: now};
      }, undefined, false);
      if (!lock.committed) {
        throw new functions.https.HttpsError(
          "already-exists", "A retry for this campaign is already running."
        );
      }

      const previousStatus = String(campaign.status || "partial");
      try {
        let failures = normalizeFailures(campaign.failures);
        const expectedFailed = Number(campaign.failed || failures.length);
        if (!expectedFailed) {
          return {
            campaignId: retryCampaignId,
            retried: true,
            attempted: 0,
            sent: 0,
            failed: 0,
            totalSent: Number(campaign.sent || 0),
          };
        }

        const leadsSnapshot = await admin.database().ref("leads").once("value");
        const leads = (leadsSnapshot.val() || {}) as Record<string, LeadRecord>;
        const allRecipients = selectRecipients(leads, {});

        // The old implementation stored at most 200 failures. Recover the
        // omitted tail from Mailgun only after strict count checks.
        if (failures.length < expectedFailed) {
          const originalAudience = selectRecipients(
            leads, campaign.filters || {}
          );
          failures = await recoverLegacyFailures(
            apiKey, retryCampaignId, campaign, originalAudience, failures
          );
        }

        let bodyHtml = typeof campaign.bodyHtml === "string" ?
          campaign.bodyHtml : "";
        if (!bodyHtml && data?.useCurrentBodyForLegacyRetry === true) {
          bodyHtml = String(data?.bodyHtml || "");
        }
        if (!bodyHtml.trim()) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "This old campaign did not save its message body. Put the exact " +
            "original message in the editor before retrying."
          );
        }
        if (bodyHtml.length > MAX_BODY) {
          throw new functions.https.HttpsError(
            "invalid-argument", "The email body is too large."
          );
        }

        const subject = String(campaign.subject || data?.subject || "").trim();
        const html = renderEmail({
          preheader: campaign.preheader,
          wordmark: campaign.wordmark,
          bodyHtml: toMailgunTemplate(bodyHtml),
        });
        const byEmail = new Map(allRecipients.map((recipient) =>
          [recipient.email.toLowerCase(), recipient]));
        const remaining = new Map(failures.map((failure) =>
          [failure.email, failure]));
        let sentThisAttempt = 0;
        let attempted = 0;
        const sendDeadline = Date.now() + SEND_BUDGET_MS;
        const retryRef = campaignRef.child("retryAttempts").push();
        await Promise.all([
          campaignRef.update({
            status: "retrying",
            bodyHtml,
            failures,
            failed: failures.length,
          }),
          retryRef.set({
            startedAt: new Date().toISOString(),
            startedBy: context.auth.uid,
            requested: failures.length,
            status: "sending",
          }),
        ]);

        for (let i = 0; i < failures.length; i += BATCH_SIZE) {
          if (Date.now() >= sendDeadline) break;
          if (attempted > 0) await sleep(SEND_INTERVAL_MS);
          const chunk = failures.slice(i, i + BATCH_SIZE);
          const chunkRecipients: Recipient[] = [];
          chunk.forEach((failure) => {
            const recipient = byEmail.get(failure.email);
            if (!recipient) {
              remaining.set(failure.email, {
                email: failure.email,
                error: "Lead no longer exists in the database.",
              });
            } else if (!isValidRecipientEmail(recipient.email)) {
              remaining.set(failure.email, {
                email: failure.email,
                error: "Address is not valid for sending; skipped.",
              });
            } else {
              chunkRecipients.push(recipient);
            }
          });
          attempted += chunk.length;

          if (chunkRecipients.length) {
            try {
              await sendBatchWithRetry(
                apiKey, subject, html, chunkRecipients, retryCampaignId,
                sendDeadline
              );
              chunkRecipients.forEach((recipient) =>
                remaining.delete(recipient.email.toLowerCase()));
              sentThisAttempt += chunkRecipients.length;
            } catch (error) {
              const message = error instanceof Error ?
                error.message : String(error);
              chunkRecipients.forEach((recipient) => remaining.set(
                recipient.email.toLowerCase(),
                {
                  email: recipient.email.toLowerCase(),
                  error: message.slice(0, 300),
                }
              ));
            }
          }

          const remainingFailures = Array.from(remaining.values());
          await campaignRef.update({
            failures: remainingFailures.length ? remainingFailures : null,
            failed: remainingFailures.length,
            sent: Number(campaign.sent || 0) + sentThisAttempt,
            retryProgress: {attempted, sent: sentThisAttempt},
          });
        }

        const finalFailures = Array.from(remaining.values());
        const totalSent = Number(campaign.sent || 0) + sentThisAttempt;
        const status = finalFailures.length ?
          (totalSent ? "partial" : "failed") : "sent";
        await Promise.all([
          campaignRef.update({
            status,
            sent: totalSent,
            failed: finalFailures.length,
            failures: finalFailures.length ? finalFailures : null,
            retryProgress: null,
            lastRetriedAt: new Date().toISOString(),
          }),
          retryRef.update({
            status,
            attempted,
            sent: sentThisAttempt,
            failed: finalFailures.length,
            finishedAt: new Date().toISOString(),
          }),
        ]);
        return {
          campaignId: retryCampaignId,
          retried: true,
          attempted,
          sent: sentThisAttempt,
          failed: finalFailures.length,
          totalSent,
          errors: finalFailures.slice(0, 5),
        };
      } catch (error) {
        await campaignRef.update({status: previousStatus});
        throw error;
      } finally {
        await lockRef.remove();
      }
    }

    // ── What they are asking for ──────────────────────────────────────────
    const subject = String(data?.subject || "").trim();
    const bodyHtml = String(data?.bodyHtml || "");
    const filters: CampaignFilters = data?.filters || {};
    const dryRun = data?.dryRun === true;

    if (!dryRun && !subject) {
      throw new functions.https.HttpsError(
        "invalid-argument", "The email needs a subject."
      );
    }
    if (!dryRun && !bodyHtml.trim()) {
      throw new functions.https.HttpsError(
        "invalid-argument", "The email needs a body."
      );
    }
    if (subject.length > MAX_SUBJECT || bodyHtml.length > MAX_BODY) {
      throw new functions.https.HttpsError(
        "invalid-argument", "Subject or body is too large."
      );
    }

    const apiKeyEarly = process.env.MAILGUN_API_KEY;

    // ── Test send ─────────────────────────────────────────────────────────
    // Deliberately before the audience is resolved: a test must work even
    // when the filters currently match nobody, which is exactly the state
    // you are in while still composing.
    const testEmail = String(data?.testEmail || "").trim();
    if (testEmail) {
      if (!apiKeyEarly) {
        throw new functions.https.HttpsError(
          "failed-precondition", "MAILGUN_API_KEY is not set."
        );
      }
      const sample: Recipient = {
        email: testEmail,
        name: "اسم تجريبي",
        phone: "+970000000000",
        subscriptionNumber: "482915",
      };
      const testHtml = renderEmail({
        preheader: data?.preheader,
        wordmark: data?.wordmark,
        bodyHtml: toMailgunTemplate(bodyHtml),
      });
      const id = await sendBatch(
        apiKeyEarly, `[TEST] ${subject}`, testHtml, [sample], "test"
      );
      return {test: true, sentTo: testEmail, messageId: id};
    }

    // ── Who it reaches ────────────────────────────────────────────────────
    const snapshot = await admin.database().ref("leads").once("value");
    const leads = (snapshot.val() || {}) as Record<string, LeadRecord>;
    const recipients = selectRecipients(leads, filters);

    // Computed here, by the same code that does the sending, so the number
    // the admin approves is exactly the number that gets mail.
    if (dryRun) {
      return {dryRun: true, matched: recipients.length};
    }

    if (recipients.length === 0) {
      throw new functions.https.HttpsError(
        "failed-precondition", "No lead matches those filters."
      );
    }
    if (recipients.length > MAX_RECIPIENTS) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `That reaches ${recipients.length} people, above the ` +
        `${MAX_RECIPIENTS} safety limit. Narrow the filters.`
      );
    }

    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError(
        "failed-precondition", "MAILGUN_API_KEY is not set."
      );
    }

    // ── Record it before sending ──────────────────────────────────────────
    // Written first, so a campaign that dies mid-flight still leaves
    // evidence of what it was doing and how far it got.
    const campaignRef = admin.database().ref("email_campaigns").push();
    const campaignId = campaignRef.key as string;

    await campaignRef.set({
      subject,
      bodyHtml,
      preheader: data?.preheader || "",
      wordmark: data?.wordmark || "",
      filters,
      totalRecipients: recipients.length,
      status: "sending",
      sentBy: context.auth.uid,
      startedAt: new Date().toISOString(),
    });

    // The shell is rendered once and reused for every batch, because only
    // the per-recipient variables differ.
    const html = renderEmail({
      preheader: data?.preheader,
      wordmark: data?.wordmark,
      bodyHtml: toMailgunTemplate(bodyHtml),
    });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const sendDeadline = Date.now() + SEND_BUDGET_MS;

    // Who actually failed, so a retry can target exactly them.
    const failures: { email: string; error: string }[] = [];

    // Chunks of BATCH_SIZE, paced with a gap between them. Each temporary
    // 429/5xx/network failure is retried with Mailgun's reset header or
    // exponential backoff before the whole chunk is recorded as failed.
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      if (Date.now() >= sendDeadline) {
        const deferred = recipients.slice(i).map((recipient) => ({
          email: recipient.email,
          error: "Deferred safely before the function timeout; use retry.",
        }));
        failures.push(...deferred);
        failed += deferred.length;
        await campaignRef.update({sent, failed});
        break;
      }
      if (i > 0) await sleep(SEND_INTERVAL_MS);
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const {valid, invalid} = splitValidRecipients(chunk);
      if (invalid.length) {
        failed += invalid.length;
        failures.push(...invalid);
      }
      if (valid.length) {
        try {
          await sendBatchWithRetry(
            apiKey, subject, html, valid, campaignId, sendDeadline
          );
          sent += valid.length;
        } catch (error) {
          failed += valid.length;
          const message = error instanceof Error ?
            error.message : String(error);
          valid.forEach((recipient) => failures.push({
            email: recipient.email, error: message.slice(0, 300),
          }));
          if (errors.length < 5) {
            errors.push(`Batch of ${valid.length} starting at ` +
              `${valid[0].email}: ${message}`);
          }
        }
      }

      // Progress is written as it goes, so a campaign that dies halfway still
      // says how far it got instead of leaving the admin guessing.
      await campaignRef.update({
        sent,
        failed,
        failures: failures.length ? failures : null,
      });
    }

    // Recorded rather than thrown: the admin needs the list of who missed out,
    // not one opaque failure for the whole run.
    if (failures.length) {
      await campaignRef.child("failures").set(failures);
    }

    let status = "sent";
    if (sent === 0) status = "failed";
    else if (failed > 0) status = "partial";

    await campaignRef.update({
      status,
      sent,
      failed,
      finishedAt: new Date().toISOString(),
    });

    return {
      campaignId,
      matched: recipients.length,
      sent,
      failed,
      errors: errors.slice(0, 5),
    };
  });
