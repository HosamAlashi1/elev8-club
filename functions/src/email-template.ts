/**
 * The Elev8 Club email shell.
 *
 * Every value here is COPIED FROM THE LIVE WELCOME EMAIL, read out of its
 * raw MIME source (Gmail → Show original). Nothing in this file was judged
 * by eye against a screenshot — an earlier attempt did exactly that and got
 * the header green wrong by a wide margin (#0E4A3C guessed against #0d3233
 * actual), because a gradient behind gold text reads much lighter than it
 * is. If the design changes, take the new source the same way rather than
 * sampling a rendered image.
 *
 * ⚠️ A copy of `renderEmail`'s output lives in the dashboard, at
 * src/app/modules/dash/pages/settings/email-campaign/email-shell.ts, which
 * renders the preview. They are duplicated rather than shared because the
 * Cloud Functions package compiles separately from the Angular app and
 * neither can import across that boundary. `npm run check:email-parity`
 * (from the repo root) renders both and diffs them byte for byte, so the
 * duplication is verified rather than trusted. Change the design here,
 * change it there, and run that.
 *
 * Written with tables and inline styles on purpose. Gmail strips <style>
 * blocks and Outlook ignores most modern CSS — this is the one place where
 * 2005-era HTML is the correct answer.
 */

/** Sampled from the welcome email's MIME source, not from a screenshot. */
export const BRAND = {
  /** Header band base, headings, and the CTA. */
  green: "#0d3233",
  /** The lighter end of the 135deg header gradient. */
  greenLight: "#125254",
  /** The ELEV8 CLUB wordmark. */
  gold: "#EFCB63",
  /** The rule under the wordmark, and the panel's right edge. */
  goldRule: "#D7A747",
  /** The pale highlight in the middle of that rule's own gradient. */
  goldShine: "#FDF28E",
  /** <strong> inside body copy. */
  goldText: "#B8892E",
  /** The CARD is white; the PAGE behind it is cream. Not the reverse. */
  card: "#FFFFFF",
  cardBorder: "#ECE0C4",
  page: "#F6F1E4",
  /** Detail panel and footer fill. */
  panel: "#FBF6E8",
  warn: "#FFF8E5",
  warnBorder: "#F0D991",
  warnText: "#66500F",
  heading: "#0d3233",
  body: "#3a4a4a",
  muted: "#9a9284",
};

/**
 * The welcome email's font stack. Tajawal and Noto Kufi Arabic are web fonts
 * that almost no desktop has installed, so in practice this renders as
 * Tahoma — but carrying the full list means it picks up the real face
 * wherever the welcome email does.
 */
const FONT = "Tajawal, 'Noto Kufi Arabic', Tahoma, Arial, sans-serif";

/** Inputs for the branded wrapper. */
export interface ShellOptions {
  /** Small line under the wordmark. Falls back to the club name. */
  preheader?: string;
  /** The campaign body, already personalized. Trusted admin-authored HTML. */
  bodyHtml: string;
}

/**
 * Escapes untrusted text before it goes into HTML.
 * @param {string} value The raw text.
 * @return {string} HTML-safe text.
 */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Wraps the admin's content in the branded shell.
 *
 * `bodyHtml` is inserted as-is: it comes from the dashboard's rich-text
 * editor and is written by an authenticated admin, so it is trusted by the
 * same standard as any other admin-authored content. Recipient *data*
 * interpolated into it is escaped at the point of substitution instead.
 *
 * @param {ShellOptions} options The preheader and the body.
 * @return {string} A complete HTML document ready to send.
 */
export function renderEmail(options: ShellOptions): string {
  const {preheader, bodyHtml} = options;
  const year = new Date().getFullYear();
  const subtitle = escapeHtml(preheader || "Elev8 Club");

  // No unsubscribe link: removed at the client's request.
  //
  // Worth knowing what that costs. Bulk mail without one draws spam
  // complaints instead of quiet opt-outs, and complaints are scored against
  // the SENDING DOMAIN — the same elev8club.com that carries the welcome
  // email. A bad campaign can therefore push transactional mail into Spam.
  // Mailgun still honours its own unsubscribe headers where it adds them.

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Elev8 Club</title>
</head>
<body dir="rtl" style="margin:0; padding:0;
      background-color:${BRAND.page}; font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       border="0" style="background-color:${BRAND.page};">
  <tr>
    <td align="center" style="padding:36px 15px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             border="0" style="max-width:640px;
             background-color:${BRAND.card}; border-radius:18px;
             overflow:hidden; border:1px solid ${BRAND.cardBorder};
             box-shadow:0 16px 40px rgba(19,49,51,0.10);">

        <tr>
          <td align="center" style="padding:34px 20px 26px;
              background-color:${BRAND.green};
              background-image:linear-gradient(135deg, ${BRAND.green} 0%,
              ${BRAND.greenLight} 100%);">
            <div style="color:${BRAND.gold}; font-size:30px; line-height:38px;
                 font-weight:900; letter-spacing:2px;">ELEV8 CLUB</div>
            <div style="margin:10px auto 0; width:64px; height:3px;
                 border-radius:3px; background-color:${BRAND.goldRule};
                 background-image:linear-gradient(90deg, ${BRAND.goldRule},
                 ${BRAND.goldShine}, ${BRAND.goldRule}); font-size:0;
                 line-height:0;">&nbsp;</div>
            <div style="margin-top:16px; color:#ffffff; font-size:17px;
                 line-height:24px; font-weight:700;">${subtitle}</div>
          </td>
        </tr>

        <tr>
          <td dir="rtl" align="right" style="padding:30px 26px 8px;
              font-family:${FONT}; color:${BRAND.body}; font-size:16px;
              line-height:1.9;">
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:18px 20px 26px;
              background-color:${BRAND.panel}; font-family:${FONT};
              color:${BRAND.muted}; font-size:12px; line-height:18px;
              border-top:1px solid ${BRAND.cardBorder};">
            &copy; ${year} Elev8 Club. جميع الحقوق محفوظة.
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * The cream panel with a gold edge — the welcome email uses it for details.
 * @param {string} innerHtml What goes inside.
 * @return {string} The panel markup.
 */
export function panel(innerHtml: string): string {
  // The gold rule is on the RIGHT only, which in this RTL layout is the edge
  // reading starts from — the welcome email draws it the same way. A box
  // outlined on all four sides is the thing that made these look unrelated.
  return `<table role="presentation" width="100%" cellpadding="0"
    cellspacing="0" border="0" style="margin:24px 0;
    background-color:${BRAND.panel}; border-right:4px solid
    ${BRAND.goldRule}; border-radius:10px;"><tr>
    <td style="padding:18px 20px; color:${BRAND.heading}; font-size:16px;
    line-height:2;">${innerHtml}</td></tr></table>`;
}

/**
 * The pale-yellow caution box.
 * @param {string} innerHtml What goes inside.
 * @return {string} The box markup.
 */
export function warn(innerHtml: string): string {
  return `<div style="margin-top:26px; padding:16px 18px;
    background-color:${BRAND.warn}; border:1px solid ${BRAND.warnBorder};
    border-radius:10px; color:${BRAND.warnText}; font-size:15px;
    line-height:1.8;">${innerHtml}</div>`;
}

/**
 * The dark-green call to action, centred as in the welcome email.
 * @param {string} label The button text.
 * @param {string} href Where it goes.
 * @return {string} The button markup.
 */
export function button(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0"
    cellspacing="0" border="0" style="margin:30px 0 8px;"><tr>
    <td align="center"><a href="${href}" target="_blank"
    style="display:inline-block; padding:15px 34px;
    background-color:${BRAND.green};
    background-image:linear-gradient(135deg, ${BRAND.green} 0%,
    ${BRAND.greenLight} 100%); color:#ffffff; font-size:17px;
    font-weight:800; line-height:24px; text-decoration:none;
    border-radius:12px;">${escapeHtml(label)}</a></td></tr></table>`;
}
