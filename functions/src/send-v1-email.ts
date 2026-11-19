import * as admin from "firebase-admin";
import {onValueCreated} from "firebase-functions/v2/database";
import {isValidRecipientEmail} from "./campaign";
import {BRAND, button, escapeHtml, panel, renderEmail, warn} from
  "./email-template";

const CHALLENGE = "FINAL COUNTDOWN CHALLENGE";
const MAILGUN_DOMAIN = "elev8club.com";
const MAILGUN_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
const MAILGUN_SENDER = `"خليل القصاصية" <info@${MAILGUN_DOMAIN}>`;

const DETAILS = [
  "📅 السبت 21 نوفمبر 2026",
  "🕘 9:00 مساءً بتوقيت تركيا",
  "💻 عبر Zoom",
];
const INTRO = "في خطوة مهمة جداً قبل موعد التحدي:";
const INVITE = "انضم إلى مجموعة الواتساب الخاصة بالتحدي 👇";
const BENEFITS_HEADING = "من خلالها رح يصلك:";
const BENEFITS = [
  "🔗 رابط الدخول إلى Zoom.",
  "⏰ تذكيرات قبل بداية التحدي.",
  "📢 جميع التحديثات والإعلانات.",
  "🎯 التعليمات والتفاصيل الخاصة بالتحدي.",
];
const INVITE_BUTTON = "انضم إلى مجموعة الواتساب 💬";
const NOTICE = "⚠️ رابط Zoom وجميع التحديثات رح تكون داخل مجموعة الواتساب، " +
  "فتأكد من الانضمام حتى ما يفوتك أي شيء.";
const COUNTDOWN = "استعد… بدأ العد التنازلي! 🔥";
const FAREWELL = "نشوفك يوم السبت!";

/**
 * Renders the registration confirmation using the dashboard campaign shell.
 * @param {string} fullName The registered lead's name.
 * @param {string} whatsappLink The configured group invite URL.
 * @return {string} The complete HTML email.
 */
export function renderV1WelcomeEmail(
  fullName: string,
  whatsappLink: string
): string {
  const emphasis = `color:${BRAND.heading}; font-weight:800;`;
  const bodyHtml = `
<p style="margin:0 0 20px; font-size:21px; ${emphasis}">
  مرحباً ${escapeHtml(fullName)} 👋
</p>
<p style="margin:0 0 20px;">تم تسجيل بياناتك بنجاح في
  <strong style="color:${BRAND.goldText};">${CHALLENGE}</strong> 🔥</p>
${panel(DETAILS.map((detail) => `<div>${detail}</div>`).join(""))}
<p style="margin:26px 0 12px; ${emphasis}">${INTRO}</p>
<p style="margin:0 0 18px;">${INVITE}</p>
<p style="margin:0 0 10px; ${emphasis}">${BENEFITS_HEADING}</p>
<ul style="margin:0 0 28px; padding-right:24px; line-height:2;">
  ${BENEFITS.map((benefit) => `<li>${benefit}</li>`).join("")}
</ul>
${button(INVITE_BUTTON, escapeHtml(whatsappLink))}
${warn(NOTICE)}
<p style="margin:28px 0 8px; ${emphasis}">${COUNTDOWN}</p>
<p style="margin:0 0 8px; ${emphasis}">${FAREWELL}</p>
<p style="margin:0 0 24px; color:#7a8a8a;">Khalil</p>`;
  return renderEmail({preheader: CHALLENGE, bodyHtml});
}

/**
 * @param {string} fullName The registered lead's name.
 * @param {string} whatsappLink The configured group invite URL.
 * @return {string} The plain-text registration confirmation.
 */
function renderPlainText(fullName: string, whatsappLink: string): string {
  return [
    `مرحباً ${fullName} 👋`,
    `تم تسجيل بياناتك بنجاح في ${CHALLENGE} 🔥`,
    DETAILS.join("\n"),
    INTRO,
    INVITE,
    BENEFITS_HEADING,
    BENEFITS.map((benefit) => `• ${benefit}`).join("\n"),
    `${INVITE_BUTTON}\n${whatsappLink}`,
    NOTICE,
    COUNTDOWN,
    FAREWELL,
    "Khalil",
  ].join("\n\n");
}

export const sendV1Email = onValueCreated(
  {
    ref: "/leads/{leadId}",
    region: "us-central1",
    secrets: ["MAILGUN_API_KEY"],
  },
  async (event) => {
    const leadId = event.params.leadId;
    const lead = event.data.val();
    const source = String(lead?.source || "").trim();
    if (source !== "v1" && source !== "webinar2") return;

    const email = String(lead.email || "").trim();
    const fullName = String(lead.fullName || "").trim();
    if (!isValidRecipientEmail(email) || !fullName) return;

    const db = admin.database();
    const leadRef = db.ref(`leads/${leadId}`);
    const currentLead = (await leadRef.get()).val();
    if (currentLead?.welcomeOrCatchupSent === true) return;

    const whatsappLink = String(
      (await db.ref("settings/whatsapp_link").get()).val() || ""
    ).trim();
    if (!/^https:\/\/chat\.whatsapp\.com\//i.test(whatsappLink)) {
      console.error("settings/whatsapp_link must be a WhatsApp group link.");
      return;
    }

    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) throw new Error("MAILGUN_API_KEY is not configured.");

    const form = new FormData();
    form.append("from", MAILGUN_SENDER);
    form.append("to", email);
    form.append("subject", `${CHALLENGE} CONFIRMATION`);
    form.append("text", renderPlainText(fullName, whatsappLink));
    form.append("html", renderV1WelcomeEmail(fullName, whatsappLink));
    const authorization = Buffer.from(`api:${apiKey}`).toString("base64");

    const response = await fetch(MAILGUN_URL, {
      method: "POST",
      headers: {"Authorization": `Basic ${authorization}`},
      body: form,
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      throw new Error(`Mailgun returned HTTP ${response.status}.`);
    }

    await leadRef.update({
      welcomeOrCatchupSent: true,
      welcomeOrCatchupSentAt: new Date().toISOString(),
    });
    console.log(`Registration confirmation accepted for lead ${leadId}.`);
  }
);
