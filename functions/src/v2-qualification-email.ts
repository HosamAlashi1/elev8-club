import * as admin from "firebase-admin";
import {onValueUpdated} from "firebase-functions/v2/database";
import {button, escapeHtml, panel, renderEmail} from "./email-template";
import {disableNotificationTracking} from "./notification-mailgun-options";

const MAILGUN_DOMAIN = "elev8club.com";
const MAILGUN_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
const MAILGUN_SENDER = `Elev8 Club <info@${MAILGUN_DOMAIN}>`;
const AI_ASSISTANT_URL = "https://t.me/elev8_club_community_bot";
const FREE_GROUP_URL = "https://t.me/elev8clubplas";

export type V2Qualification =
  "qualified" | "qualified_prep" | "not_qualified";

type EmailBlock =
  | {kind: "heading" | "paragraph" | "code"; text: string}
  | {kind: "bullets" | "numbered"; items: string[]}
  | {kind: "link" | "button"; label: string; url: string};

interface ResultEmail {
  subject: string;
  blocks: EmailBlock[];
}

interface ResultLead {
  source?: string;
  step?: number;
  qualification?: string;
  fullName?: string;
  email?: string;
  subscriptionNumber?: string;
  v2ResultEmailSent?: boolean;
}

/**
 * Whether an update is the first completion of v2's questionnaire.
 * @param {ResultLead|null} before The record before the database update.
 * @param {ResultLead|null} after The record after the database update.
 * @return {boolean} Whether this is a v2 step-one to step-two transition.
 */
export function completedV2Questions(
  before: ResultLead | null,
  after: ResultLead | null
): boolean {
  return String(after?.source || "").trim() === "v2" &&
    Number(before?.step) !== 2 &&
    Number(after?.step) === 2;
}

/**
 * Select the exact message for the qualification saved by the v2 quiz.
 * @param {V2Qualification} qualification The quiz outcome.
 * @param {string} firstName The lead's first name.
 * @param {string} subscriptionNumber The lead's bot code.
 * @return {ResultEmail} The subject and ordered content blocks.
 */
export function v2ResultEmail(
  qualification: V2Qualification,
  firstName: string,
  subscriptionNumber: string
): ResultEmail {
  if (qualification === "qualified") {
    return {
      subject: "نتيجة تسجيلك ورقم اشتراكك في Elev8 Club",
      blocks: [
        {kind: "heading", text: `مبروك 🎉 ${firstName}`},
        {kind: "paragraph", text:
          "أنت الآن أخذت أول خطوة فعلية للبدء مع Elev8 Club Community."},
        {kind: "paragraph", text:
          "من خلال إجاباتك، أنت جاهز تبدأ بفتح حساب التداول وتجهيزه، " +
          "لذلك خلينا نمشي معك خطوة بخطوة من هنا."},
        {kind: "paragraph", text: "رقم اشتراكك:"},
        {kind: "code", text: subscriptionNumber},
        {kind: "paragraph", text: "خطوتك الآن بسيطة:"},
        {kind: "numbered", items: [
          "انسخ رقم الاشتراك الخاص بك.",
          "افتح Elev8 AI Assistant على Telegram.",
          "أرسل له رقم الاشتراك.",
          "خليه يمشي معك خطوة بخطوة.",
        ]},
        {kind: "paragraph", text: "الـAI Assistant رح يساعدك في:"},
        {kind: "bullets", items: [
          "فتح حساب التداول.",
          "إكمال التحقق من الحساب.",
          "تجهيز الحساب للإيداع.",
          "إرشادك لخطوات الإيداع.",
          "شرح Elev8 Club Community.",
          "تعريفك على الأقسام والأدوات الموجودة داخل الـCommunity.",
          "توجيهك للبدء باستخدام Elev8 System.",
        ]},
        {kind: "paragraph", text: "لا تحاول تعمل كل شيء لحالك."},
        {kind: "paragraph", text:
          "ابدأ من الـAI Assistant، وهو رح يوجّهك للخطوة التالية."},
        {kind: "button", label: "👉 ابدأ من هنا", url: AI_ASSISTANT_URL},
        {kind: "paragraph", text:
          "أهلًا فيك في Elev8 Club Community 🚀"},
      ],
    };
  }

  if (qualification === "qualified_prep") {
    return {
      subject: "Congratulation 🎉 أول خطوة داخل مجتمع elev8 club بدأت",
      blocks: [
        {kind: "heading", text: `مبروك 🎉 ${firstName}`},
        {kind: "paragraph", text:
          "أنت الآن بدأت أول خطوة مع Elev8 Club Community."},
        {kind: "paragraph", text:
          "ومن خلال إجاباتك، واضح إنك جاهز تفتح حساب التداول وتوثقه، " +
          "لكن لسه مش جاهز للإيداع."},
        {kind: "paragraph", text: "وهذا عادي تمامًا."},
        {kind: "paragraph", text:
          "مش لازم تستنى لحد ما يكون رأس المال جاهز حتى تجهّز حسابك."},
        {kind: "paragraph", text: "رقم اشتراكك:"},
        {kind: "code", text: subscriptionNumber},
        {kind: "paragraph", text:
          "انسخه وأرسله إلى Elev8 AI Assistant على Telegram."},
        {kind: "paragraph", text: "الـAI Assistant رح يساعدك في:"},
        {kind: "bullets", items: [
          "فتح حساب التداول.",
          "إكمال التحقق.",
          "تجهيز الحساب للإيداع.",
          "شرح الـCommunity.",
          "تعريفك على Elev8 System.",
          "توجيهك للأقسام والأدوات الموجودة داخل الـCommunity.",
        ]},
        {kind: "paragraph", text:
          "وبمجرد ما تكون جاهز للإيداع، ارجع للـAI Assistant، " +
          "ورح يكمل معك خطوات الإيداع ويجهزك للبدء."},
        {kind: "paragraph", text: "يعني خطتك ببساطة:"},
        {kind: "paragraph", text:
          "افتح الحساب → وثّقه → جهّزه → ولما تكون جاهز، أودع وابدأ."},
        {kind: "button", label: "👉 ابدأ من هنا", url: AI_ASSISTANT_URL},
        {kind: "paragraph", text:
          "أهلًا فيك معنا في Elev8 Club Community 🚀"},
      ],
    };
  }

  return {
    subject: "خطوتك الجاية مع Elev8 Club 🚀",
    blocks: [
      {kind: "heading", text: `🎉 Congratulations! ${firstName}`},
      {kind: "paragraph", text:
        "أنت الآن بدأت أول خطوة معنا في Elev8 Club."},
      {kind: "paragraph", text:
        "ومن إجاباتك، عرفنا إنك حاليًا ما عندك رأس مال كافي " +
        "للبدء بالتداول."},
      {kind: "paragraph", text: "وعشان نكون صريحين معك:"},
      {kind: "paragraph", text:
        "ما بننصحك تبدأ التداول بأقل من $100."},
      {kind: "paragraph", text:
        "لكن هذا مش معناه إنك توقف هنا."},
      {kind: "paragraph", text:
        "بالعكس، الخطوة اللي عليك الآن هي بناء رأس المال اللي تحتاجه " +
        "حتى تكون جاهز تبدأ."},
      {kind: "paragraph", text:
        "وعشان نساعدك في هذا الشي، جهزنا لك هذا الجروب:"},
      {kind: "link", label: "👉 رابط الجروب", url: FREE_GROUP_URL},
      {kind: "paragraph", text:
        "داخل الجروب، رح ننزل بشكل دوري أفكار ومهام وأشياء ممكن " +
        "تساعدك تبني مصدر دخل أو تجمع رأس مال، مثل الفرص والأنشطة " +
        "اللي بنشاركها هناك."},
      {kind: "paragraph", text: "خطتك من هنا:"},
      {kind: "paragraph", text:
        "ابنِ رأس مالك → وصل إلى $100+ → ارجع لنا → وابدأ التداول " +
        "مع Elev8."},
      {kind: "paragraph", text:
        "ولما تكون جاهز، رح تقدر تدخل Elev8 Club Community وتبدأ " +
        "باستخدام Elev8 System وباقي الأدوات الموجودة فيها."},
      {kind: "paragraph", text: "أنت بدأت أول خطوة اليوم."},
      {kind: "paragraph", text:
        "والخطوة الجاية هي إنك تجهز نفسك للبدء."},
      {kind: "button", label: "👉 ادخل الجروب من هنا", url: FREE_GROUP_URL},
      {kind: "paragraph", text:
        "ونشوفك قريبًا داخل Elev8 Club Community 🚀"},
    ],
  };
}

/**
 * Render the same branded shell used by the v1 dashboard.
 * @param {ResultEmail} message The selected result email.
 * @return {{html: string, text: string}} Both email formats.
 */
export function renderV2ResultEmail(
  message: ResultEmail
): {html: string; text: string} {
  const htmlBlocks = message.blocks.map((block) => {
    if (block.kind === "heading") {
      return `<h2 style="margin:0 0 22px; color:#0d3233;
        font-size:24px; line-height:1.5;">${escapeHtml(block.text)}</h2>`;
    }
    if (block.kind === "paragraph") {
      return `<p style="margin:0 0 16px;">${escapeHtml(block.text)}</p>`;
    }
    if (block.kind === "code") {
      return panel(`<strong dir="ltr" style="font-size:23px;
        letter-spacing:2px;">${escapeHtml(block.text)}</strong>`);
    }
    if (block.kind === "bullets" || block.kind === "numbered") {
      const tag = block.kind === "bullets" ? "ul" : "ol";
      const items = block.items.map((item) =>
        `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`
      ).join("");
      return `<${tag} dir="rtl" style="margin:0 0 20px;
        padding-right:25px;">${items}</${tag}>`;
    }
    if (block.kind === "button") return button(block.label, block.url);
    if (block.kind === "link") {
      return `<p style="margin:0 0 18px;"><a href="${block.url}"
        style="color:#0d3233; font-weight:700;">` +
        `${escapeHtml(block.label)}</a></p>`;
    }
    return "";
  });

  const textBlocks = message.blocks.map((block) => {
    if (block.kind === "bullets") {
      return block.items.map((item) => `• ${item}`).join("\n");
    }
    if (block.kind === "numbered") {
      return block.items.map((item, i) => `${i + 1}. ${item}`).join("\n");
    }
    if (block.kind === "button" || block.kind === "link") {
      return `${block.label}:\n${block.url}`;
    }
    if ("text" in block) return block.text;
    return "";
  });

  return {
    html: renderEmail({bodyHtml: htmlBlocks.join("\n")}),
    text: textBlocks.join("\n\n"),
  };
}

/** Send exactly one result email when a v2 lead completes the quiz. */
export const sendV2QualificationEmail = onValueUpdated(
  {
    ref: "/leads/{leadId}",
    region: "us-central1",
    secrets: ["MAILGUN_API_KEY"],
  },
  async (event) => {
    const before = event.data.before.val() as ResultLead | null;
    const after = event.data.after.val() as ResultLead | null;
    if (!completedV2Questions(before, after)) return;

    const leadId = event.params.leadId;
    const leadRef = admin.database().ref(`leads/${leadId}`);
    const lead = (await leadRef.get()).val() as ResultLead | null;
    if (!lead || lead.v2ResultEmailSent === true) return;

    const qualification = String(lead.qualification || "");
    if (qualification !== "qualified" &&
        qualification !== "qualified_prep" &&
        qualification !== "not_qualified") return;

    const email = String(lead.email || "").trim();
    const firstName = String(lead.fullName || "").trim()
      .split(/\s+/)[0] || "صديقنا";
    const subscriptionNumber = String(lead.subscriptionNumber || "").trim();
    if (!email) return;
    if (qualification !== "not_qualified" && !subscriptionNumber) {
      console.error(`No subscription number for v2 lead ${leadId}.`);
      return;
    }

    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) throw new Error("MAILGUN_API_KEY is not configured.");

    const message = v2ResultEmail(
      qualification, firstName, subscriptionNumber
    );
    const rendered = renderV2ResultEmail(message);
    const form = new URLSearchParams();
    form.append("from", MAILGUN_SENDER);
    form.append("to", email);
    form.append("subject", message.subject);
    form.append("text", rendered.text);
    form.append("html", rendered.html);
    form.append("o:tag", `v2-result-${qualification}`);
    disableNotificationTracking(form);

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
      v2ResultEmailSent: true,
      v2ResultEmailSentAt: new Date().toISOString(),
      v2ResultEmailQualification: qualification,
    });
    console.log(`V2 ${qualification} result accepted for lead ${leadId}.`);
  }
);
