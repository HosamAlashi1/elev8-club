import * as admin from "firebase-admin";
import {onValueCreated} from "firebase-functions/v2/database";
import {renderEmail} from "./email-template";

const MAILGUN_DOMAIN = "elev8club.com";
const MAILGUN_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
const MAILGUN_SENDER = `Elev8 Club <info@${MAILGUN_DOMAIN}>`;

export const V2_WELCOME_SUBJECT = "تم تسجيلك بنجاح congratulation 🎉";

export const V2_WELCOME_TEXT = [
  "🎉 Congratulations!",
  "",
  "تم تسجيل بياناتك بنجاح.",
  "",
  "شكرًا لاهتمامك بـ Elev8 Club Community.",
  "",
  "أنت الآن بدأت أول خطوة، وخلال الفترة القادمة رح نشارك معك " +
    "التفاصيل والخطوات اللازمة للبدء معنا.",
  "",
  "خليك متابع لإيميلك 📩",
  "",
  "رح توصلك رسائل منّا بكل شيء تحتاج تعرفه عن Elev8 Club.",
  "",
  "أهلًا فيك معنا 🚀",
  "",
  "Elev8 Club",
].join("\n");

const V2_WELCOME_BODY = `
<div dir="ltr" style="text-align:right; color:#0d3233; font-size:24px;
  line-height:1.5; font-weight:800;">🎉 Congratulations!</div>
<p style="margin:20px 0 12px;">تم تسجيل بياناتك بنجاح.</p>
<p style="margin:0 0 12px;">شكرًا لاهتمامك بـ
  <span dir="ltr">Elev8 Club Community</span>.</p>
<p style="margin:0 0 20px;">أنت الآن بدأت أول خطوة، وخلال الفترة القادمة
  رح نشارك معك التفاصيل والخطوات اللازمة للبدء معنا.</p>
<p style="margin:0 0 12px; color:#0d3233; font-weight:700;">
  خليك متابع لإيميلك 📩</p>
<p style="margin:0 0 20px;">رح توصلك رسائل منّا بكل شيء تحتاج تعرفه عن
  <span dir="ltr">Elev8 Club</span>.</p>
<p style="margin:0 0 12px; color:#0d3233; font-weight:700;">
  أهلًا فيك معنا 🚀</p>
<p dir="ltr" style="margin:0 0 20px; text-align:right;">Elev8 Club</p>`;

/**
 * The v1 dashboard's exact branded email shell, with v2-only welcome copy.
 * @return {string} Complete HTML for the v2 welcome email.
 */
export function renderV2WelcomeEmail(): string {
  return renderEmail({bodyHtml: V2_WELCOME_BODY});
}

/** Send on creation of a v2 lead in the shared database. */
export const sendV2Email = onValueCreated(
  {
    ref: "/leads/{leadId}",
    region: "us-central1",
    secrets: ["MAILGUN_API_KEY"],
  },
  async (event) => {
    const leadId = event.params.leadId;
    const lead = event.data.val();
    if (!lead || String(lead.source || "").trim() !== "v2") return;

    const email = String(lead.email || "").trim();
    const fullName = String(lead.fullName || "").trim();
    const subscriptionNumber = String(lead.subscriptionNumber || "").trim();
    // Preserve the existing trigger's validation and sent marker while only
    // changing the v2 email content and its branded wrapper.
    if (!email || !fullName || !subscriptionNumber) return;

    const leadRef = admin.database().ref(`leads/${leadId}`);
    const currentLead = (await leadRef.get()).val();
    if (currentLead?.v2EmailSent === true) return;

    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) throw new Error("MAILGUN_API_KEY is not configured.");

    const form = new URLSearchParams();
    form.append("from", MAILGUN_SENDER);
    form.append("to", email);
    form.append("subject", V2_WELCOME_SUBJECT);
    form.append("text", V2_WELCOME_TEXT);
    form.append("html", renderV2WelcomeEmail());
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
      v2EmailSent: true,
      v2EmailSentAt: new Date().toISOString(),
    });
    console.log(`V2 welcome email accepted for lead ${leadId}.`);
  }
);
