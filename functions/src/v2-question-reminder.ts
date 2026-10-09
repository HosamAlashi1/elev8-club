import {createHash} from "crypto";
import * as admin from "firebase-admin";
import {getFunctions} from "firebase-admin/functions";
import {onValueCreated} from "firebase-functions/v2/database";
import {onTaskDispatched} from "firebase-functions/v2/tasks";
import {button, renderEmail} from "./email-template";

const MAILGUN_DOMAIN = "elev8club.com";
const MAILGUN_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
const MAILGUN_SENDER = `Elev8 Club <info@${MAILGUN_DOMAIN}>`;
const V2_SITE_ORIGIN = "https://community.elev8club.com";
const TEN_MINUTES_MS = 10 * 60 * 1000;
const TASK_FUNCTION = "locations/us-central1/functions/sendV2QuestionReminder";
const TASK_SERVICE_ACCOUNT =
  "631927284455-compute@developer.gserviceaccount.com";

interface ReminderTask {
  leadId: string;
}

interface ReminderLead {
  source?: string;
  step?: number;
  email?: string;
  createdAt?: string;
  v2QuestionReminderSent?: boolean;
}

export const V2_QUESTION_REMINDER_SUBJECT = "لسه باقي خطوة واحدة 👀";

/**
 * An emailed lead key restores the existing v2 questions page directly.
 * @param {string} leadId The database key of the registered lead.
 * @return {string} A complete HTTPS link to that lead's questionnaire.
 */
export function v2QuestionUrl(leadId: string): string {
  return `${V2_SITE_ORIGIN}/#/questions?lead=${encodeURIComponent(leadId)}`;
}

/**
 * The reminder is only for new v2 leads still at registration step one.
 * @param {ReminderLead|null} lead The current database record.
 * @return {boolean} Whether this lead is eligible for a reminder.
 */
export function isV2QuestionReminderDue(lead: ReminderLead | null): boolean {
  return !!lead &&
    String(lead.source || "").trim() === "v2" &&
    Number(lead.step) === 1 &&
    !!String(lead.email || "").trim() &&
    lead.v2QuestionReminderSent !== true;
}

/**
 * Keep a text alternative for mail clients that do not display HTML.
 * @param {string} url The resume link for this lead.
 * @return {string} The complete plain-text reminder.
 */
export function v2QuestionReminderText(url: string): string {
  return [
    "مرحبًا،",
    "",
    "لاحظنا إنك سجلت بياناتك في Elev8 Club، لكن لسه ما كملت الخطوة الثانية.",
    "",
    "باقي كم سؤال بسيط فقط، وإجاباتك رح تساعدنا نحدد لك الخطوة " +
      "المناسبة إلك حسب وضعك الحالي.",
    "",
    "ما رح تاخذ منك أكثر من دقيقتين.",
    "",
    "كمّل من هنا 👇",
    "",
    "إكمال الخطوة الثانية",
    url,
    "",
    "وبعد ما تخلص، رح توصلك الخطوة المناسبة إلك مباشرة.",
    "",
    "نشوفك هناك 🚀",
    "",
    "Elev8 Club",
  ].join("\n");
}

/**
 * Render in exactly the same branded shell as the v1 dashboard emails.
 * @param {string} url The resume link for this lead.
 * @return {string} The complete HTML reminder.
 */
export function renderV2QuestionReminder(url: string): string {
  const bodyHtml = `
<p style="margin:0 0 18px;">مرحبًا،</p>
<p style="margin:0 0 18px;">لاحظنا إنك سجلت بياناتك في
  <span dir="ltr">Elev8 Club</span>، لكن لسه ما كملت الخطوة الثانية.</p>
<p style="margin:0 0 18px;">باقي كم سؤال بسيط فقط، وإجاباتك رح تساعدنا
  نحدد لك الخطوة المناسبة إلك حسب وضعك الحالي.</p>
<p style="margin:0 0 18px;">ما رح تاخذ منك أكثر من دقيقتين.</p>
<p style="margin:0 0 12px; color:#0d3233; font-weight:700;">كمّل من هنا 👇</p>
${button("إكمال الخطوة الثانية", url)}
<p style="margin:18px 0;">وبعد ما تخلص، رح توصلك الخطوة المناسبة إلك مباشرة.</p>
<p style="margin:0 0 18px;">نشوفك هناك 🚀</p>
<p dir="ltr" style="margin:0 0 20px; text-align:right;">Elev8 Club</p>`;
  return renderEmail({bodyHtml});
}

/** Queue one delivery ten minutes after a new v2 registration. */
export const queueV2QuestionReminder = onValueCreated(
  {
    ref: "/leads/{leadId}",
    region: "us-central1",
    serviceAccount: TASK_SERVICE_ACCOUNT,
    retry: true,
  },
  async (event) => {
    const lead = event.data.val() as ReminderLead | null;
    if (!isV2QuestionReminderDue(lead)) return;

    const leadId = event.params.leadId;
    const taskId = "v2q-" + createHash("sha256")
      .update(leadId).digest("hex");
    try {
      await getFunctions().taskQueue<ReminderTask>(TASK_FUNCTION).enqueue(
        {leadId},
        {scheduleDelaySeconds: 600, id: taskId}
      );
    } catch (error) {
      if ((error as {code?: string}).code ===
          "functions/task-already-exists") return;
      throw error;
    }
  }
);

/** Re-read the lead at dispatch time; skip completed questionnaires. */
export const sendV2QuestionReminder = onTaskDispatched<ReminderTask>(
  {
    region: "us-central1",
    invoker: TASK_SERVICE_ACCOUNT,
    secrets: ["MAILGUN_API_KEY"],
    retryConfig: {maxAttempts: 5, minBackoffSeconds: 60},
  },
  async (request) => {
    const leadId = String(request.data?.leadId || "").trim();
    if (!/^[A-Za-z0-9_-]{10,100}$/.test(leadId)) return;

    const leadRef = admin.database().ref(`leads/${leadId}`);
    const lead = (await leadRef.get()).val() as ReminderLead | null;
    if (!isV2QuestionReminderDue(lead)) return;

    const createdAt = Date.parse(String(lead?.createdAt || ""));
    if (!Number.isFinite(createdAt)) return;
    if (Date.now() - createdAt < TEN_MINUTES_MS) {
      throw new Error(`Reminder task dispatched early for lead ${leadId}.`);
    }

    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) throw new Error("MAILGUN_API_KEY is not configured.");

    const url = v2QuestionUrl(leadId);
    const form = new URLSearchParams();
    form.append("from", MAILGUN_SENDER);
    form.append("to", String(lead?.email).trim());
    form.append("subject", V2_QUESTION_REMINDER_SUBJECT);
    form.append("text", v2QuestionReminderText(url));
    form.append("html", renderV2QuestionReminder(url));
    form.append("o:tag", "v2-incomplete-questions");

    const authorization = Buffer.from(`api:${apiKey}`).toString("base64");
    const response = await fetch(MAILGUN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authorization}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      signal: AbortSignal.timeout(30000),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      throw new Error(
        `Mailgun ${response.status}: ${responseBody.slice(0, 300)}`
      );
    }

    await leadRef.update({
      v2QuestionReminderSent: true,
      v2QuestionReminderSentAt: new Date().toISOString(),
    });
    console.log(`V2 question reminder accepted for lead ${leadId}.`);
  }
);
