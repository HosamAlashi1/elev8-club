import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  CampaignFilters,
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
 * How many sends are in flight at once.
 *
 * Eight keeps a few hundred recipients inside a handful of seconds without
 * tripping Mailgun's rate limiting — which would surface as failures that
 * look like a broken campaign rather than a throttle.
 */
const CONCURRENCY = 8;

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
}

/**
 * ONE email to ONE recipient.
 *
 * This used to put the whole list into a single call with `recipient-variables`
 * — Mailgun's batch sending, one request for up to a thousand personalized
 * messages. Mailgun refuses it on this domain:
 *
 *     403 "Domain elev8club.com is not allowed to send large batches yet"
 *
 * It is an account permission, not something the code can work around, and
 * every campaign failed whole because of it. The single-recipient test passed
 * precisely because one recipient is not a batch.
 *
 * Sending one at a time is slower, and better in the way that matters here:
 * a failure is attributable to a person instead of taking 250 others down
 * with it, so "did everyone get it?" has a real answer without webhooks.
 *
 * If Mailgun later approves the domain for batch sending, the fast path can
 * come back — but this must stay as the fallback.
 *
 * @param {string} apiKey The Mailgun key.
 * @param {string} subject The email subject.
 * @param {string} html The rendered email.
 * @param {Recipient} to The single recipient.
 * @param {string} campaignId Used as the Mailgun tag.
 * @return {Promise<string>} Mailgun's message id.
 */
async function sendOne(
  apiKey: string,
  subject: string,
  html: string,
  to: Recipient,
  campaignId: string
): Promise<string> {
  const form = new URLSearchParams();
  form.append("from", FROM);
  form.append("to", to.email);
  form.append("subject", subject);
  form.append("html", html);
  // Still recipient-variables, even for one: the body carries %recipient.x%
  // placeholders and Mailgun only substitutes them from this map.
  form.append("recipient-variables", recipientVariables([to]));
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
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Mailgun ${response.status}: ${text.slice(0, 300)}`);
  }

  try {
    return JSON.parse(text).id || "";
  } catch {
    return "";
  }
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
        bodyHtml: toMailgunTemplate(bodyHtml),
      });
      const id = await sendOne(
        apiKeyEarly, `[TEST] ${subject}`, testHtml, sample, "test"
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
      preheader: data?.preheader || "",
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
      bodyHtml: toMailgunTemplate(bodyHtml),
    });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Who actually failed, so a retry can target exactly them.
    const failures: { email: string; error: string }[] = [];

    // Sent in small waves rather than one at a time or all at once: serial
    // would take minutes for a few hundred, and firing every request together
    // would have Mailgun rate-limit us into failures that look like bugs.
    for (let i = 0; i < recipients.length; i += CONCURRENCY) {
      const wave = recipients.slice(i, i + CONCURRENCY);

      const results = await Promise.all(wave.map(async (r) => {
        try {
          await sendOne(apiKey, subject, html, r, campaignId);
          return {ok: true, email: r.email, error: ""};
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {ok: false, email: r.email, error: message};
        }
      }));

      results.forEach((res) => {
        if (res.ok) {
          sent++;
        } else {
          failed++;
          failures.push({email: res.email, error: res.error.slice(0, 300)});
          if (errors.length < 5) errors.push(`${res.email}: ${res.error}`);
        }
      });

      // Progress is written as it goes, so a campaign that dies halfway still
      // says how far it got instead of leaving the admin guessing.
      await campaignRef.update({sent, failed});
    }

    // Recorded rather than thrown: the admin needs the list of who missed out,
    // not one opaque failure for the whole run.
    if (failures.length) {
      await campaignRef.child("failures").set(failures.slice(0, 200));
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
