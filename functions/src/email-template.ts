/**
 * The Elev8 Club email shell.
 *
 * Rebuilt to match the live welcome email (`sendWelcomeEmail`, whose source
 * lives only on GCP) so a campaign lands in the inbox looking like it came
 * from the same place: deep-green header band, gold wordmark, cream body,
 * dark-green call to action.
 *
 * ⚠️ A near-copy of this lives in the dashboard, at
 * src/app/modules/dash/pages/settings/email-campaign/email-shell.ts, used
 * only to render the preview. Change the design here and change it there too
 * or the preview stops telling the truth. This copy is the one that sends.
 *
 * Written with tables and inline styles on purpose. Gmail strips <style>
 * blocks and Outlook ignores most modern CSS — this is the one place where
 * 2005-era HTML is the correct answer.
 */

export const BRAND = {
  green: "#0E4A3C",
  greenDark: "#0A3429",
  gold: "#D9B96A",
  goldText: "#B8912F",
  cream: "#FBF6EC",
  panel: "#FDF3DF",
  panelBorder: "#EADFC0",
  warn: "#FEF6E0",
  warnBorder: "#F0DFA8",
  text: "#1F2D2A",
  muted: "#7A8784",
  page: "#F1EEE7",
};

const FONT = "'Segoe UI',Tahoma,Arial,sans-serif";

/** Inputs for the branded wrapper. */
export interface ShellOptions {
  /** Small line under the wordmark. Falls back to the club name. */
  preheader?: string;
  /** The campaign body, already personalized. Trusted admin-authored HTML. */
  bodyHtml: string;
  /** Mailgun swaps this per recipient; omitted for the preview. */
  unsubscribeUrl?: string;
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
 * @param {ShellOptions} options The preheader, body and unsubscribe link.
 * @return {string} A complete HTML document ready to send.
 */
export function renderEmail(options: ShellOptions): string {
  const {preheader, bodyHtml, unsubscribeUrl} = options;
  const year = new Date().getFullYear();
  const subtitle = escapeHtml(preheader || "Elev8 Club");

  const unsubscribe = unsubscribeUrl ? `
            <div style="font-family:${FONT}; font-size:12px; padding-top:8px;">
              <a href="${unsubscribeUrl}" style="color:${BRAND.muted};
                 text-decoration:underline;">إلغاء الاشتراك من هذه الرسائل</a>
            </div>` : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Elev8 Club</title>
</head>
<body style="margin:0; padding:0; background:${BRAND.page};
             -webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       border="0" style="background:${BRAND.page};">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             border="0" style="width:600px; max-width:100%;
             border-collapse:separate; border-radius:14px; overflow:hidden;
             background:${BRAND.cream};">

        <tr>
          <td align="center" style="background:${BRAND.green};
              padding:30px 24px 26px 24px;">
            <div style="font-family:${FONT}; font-size:26px; font-weight:bold;
                 letter-spacing:3px; color:${BRAND.gold};">ELEV8 CLUB</div>
            <div style="width:54px; height:3px; background:${BRAND.gold};
                 margin:10px auto 0 auto; border-radius:2px;">&nbsp;</div>
            <div style="font-family:${FONT}; font-size:14px; color:#FFFFFF;
                 padding-top:12px;">${subtitle}</div>
          </td>
        </tr>

        <tr>
          <td dir="rtl" align="right" style="padding:30px 30px 8px 30px;
              font-family:${FONT}; font-size:15px; line-height:1.9;
              color:${BRAND.text};">
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:22px 24px 26px 24px;
              border-top:1px solid ${BRAND.panelBorder};">
            <div style="font-family:${FONT}; font-size:12px;
                 color:${BRAND.muted};">
              &copy; ${year} Elev8 Club، جميع الحقوق محفوظة.
            </div>${unsubscribe}
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
  return `<table role="presentation" width="100%" cellpadding="0"
    cellspacing="0" border="0" style="margin:16px 0;"><tr>
    <td style="background:${BRAND.panel}; border:1px solid
    ${BRAND.panelBorder}; border-radius:10px; padding:16px 18px;
    font-family:${FONT}; font-size:14px; line-height:1.9;
    color:${BRAND.text};">${innerHtml}</td></tr></table>`;
}

/**
 * The pale-yellow caution box.
 * @param {string} innerHtml What goes inside.
 * @return {string} The box markup.
 */
export function warn(innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0"
    cellspacing="0" border="0" style="margin:16px 0;"><tr>
    <td style="background:${BRAND.warn}; border:1px solid
    ${BRAND.warnBorder}; border-radius:10px; padding:14px 16px;
    font-family:${FONT}; font-size:13px; line-height:1.8;
    color:${BRAND.text};">${innerHtml}</td></tr></table>`;
}

/**
 * The dark-green call to action, centred as in the welcome email.
 * @param {string} label The button text.
 * @param {string} href Where it goes.
 * @return {string} The button markup.
 */
export function button(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0"
    cellspacing="0" border="0" style="margin:22px 0;"><tr><td align="center">
    <a href="${href}" style="display:inline-block; background:${BRAND.green};
    color:#FFFFFF; font-family:${FONT}; font-size:15px; font-weight:bold;
    text-decoration:none; padding:14px 30px; border-radius:8px;">
    ${escapeHtml(label)}</a></td></tr></table>`;
}
