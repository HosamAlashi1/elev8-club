/**
 * Preview-only copy of the email shell.
 *
 * ⚠️ Mirrors `functions/src/email-template.ts`, which is the one that actually sends. They are
 * duplicated rather than shared because the Cloud Functions package builds separately from the
 * Angular app and cannot import across that boundary. Change the design there and change it
 * here, or the preview quietly stops matching what lands in the inbox.
 *
 * Only `renderPreview` and the placeholder list live here — the snippet helpers are a sending
 * concern and have no preview equivalent.
 */

export const BRAND = {
  green: '#0E4A3C',
  gold: '#D9B96A',
  cream: '#FBF6EC',
  panelBorder: '#EADFC0',
  text: '#1F2D2A',
  muted: '#7A8784',
  page: '#F1EEE7',
};

const FONT = "'Segoe UI',Tahoma,Arial,sans-serif";

/** What an admin may type into the editor, and what it becomes. */
export interface PlaceholderHint {
  /** Inserted on click. */
  token: string;
  /** The Arabic spelling of the same field, still accepted if typed by hand. */
  alias: string;
  label: string;
  sample: string;
}

/**
 * ONE ENTRY PER FIELD, and the token is English.
 *
 * Two reasons it is not Arabic, even though the copy around it is:
 *
 *  1. **It names a database field.** The lead record has `fullName`, `email`, `phone`,
 *     `subscriptionNumber` — all English. A token that looks like the field it refers to is one
 *     less translation for anyone reading the campaign later.
 *  2. **`{{` and `}}` are bidi-neutral.** Around Arabic text inside an RTL paragraph they take
 *     their direction from the surrounding run and render on unpredictable sides, so a line of
 *     Arabic tokens comes out visually jumbled and very easy to break while editing. An English
 *     token is a self-contained LTR run that bidi isolates and draws correctly every time. The
 *     *stored* characters were always fine — the rendering was not, and that is what people
 *     edit against.
 *
 * The Arabic spellings still resolve (see PLACEHOLDERS in functions/src/campaign.ts), so copy
 * written before this change keeps working. They are simply not what the buttons insert.
 *
 * A lead has a single name field. Listing `{{name}}` and `{{الاسم}}` as separate chips — an
 * earlier version did — reads as "there is an Arabic name and an English name", which is wrong.
 */
export const PLACEHOLDER_HINTS: PlaceholderHint[] = [
  { token: '{{name}}', alias: '{{الاسم}}', label: 'اسم الليد', sample: 'محمد أحمد' },
  { token: '{{email}}', alias: '{{الايميل}}', label: 'الإيميل', sample: 'lead@example.com' },
  { token: '{{phone}}', alias: '{{الجوال}}', label: 'رقم الجوال', sample: '+970594136058' },
  { token: '{{code}}', alias: '{{رقم_الاشتراك}}', label: 'رقم الاشتراك', sample: '482915' },
];

const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z_؀-ۿ]+)\s*\}\}/g;

const SAMPLE: Record<string, string> = {
  name: 'محمد أحمد',
  الاسم: 'محمد أحمد',
  email: 'lead@example.com',
  الايميل: 'lead@example.com',
  phone: '+970594136058',
  الجوال: '+970594136058',
  code: '482915',
  رقم_الاشتراك: '482915',
};

/**
 * Fills placeholders with sample values so the preview reads like a real email rather than like
 * a template. An unknown token is left visible on purpose — that is the admin's typo, and the
 * preview is where they should notice it.
 */
export function fillSampleData(html: string): string {
  return html.replace(PLACEHOLDER_PATTERN, (whole, raw) => SAMPLE[String(raw).trim()] ?? whole);
}

/**
 * A COMPLETE HTML document for the preview, structurally identical to what
 * `functions/src/email-template.ts` sends — same tables, same inline styles.
 *
 * It has to be a whole document, and it has to go into an `<iframe srcdoc>`, for two reasons:
 *
 *  1. **Angular strips `style` attributes from `[innerHTML]`.** An email template is nothing
 *     but inline styles, so binding it that way left an unstyled wall of text that looked
 *     nothing like the real email — which is exactly what a preview must never do.
 *  2. **The dashboard's own CSS would leak into it.** Bootstrap and the theme bundle restyle
 *     `table`, `p`, `a` and more; a preview wearing the dashboard's typography is still lying,
 *     just more subtly. An iframe is its own document, so nothing outside reaches in.
 */
export function renderPreview(bodyHtml: string, preheader?: string): string {
  const year = new Date().getFullYear();
  const subtitle = preheader || 'Elev8 Club';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0; padding:0; background:${BRAND.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:${BRAND.page};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px; max-width:100%; border-collapse:separate; border-radius:14px;
             overflow:hidden; background:${BRAND.cream};">

        <tr>
          <td align="center" style="background:${BRAND.green}; padding:30px 24px 26px 24px;">
            <div style="font-family:${FONT}; font-size:26px; font-weight:bold;
                 letter-spacing:3px; color:${BRAND.gold};">ELEV8 CLUB</div>
            <div style="width:54px; height:3px; background:${BRAND.gold};
                 margin:10px auto 0 auto; border-radius:2px;">&nbsp;</div>
            <div style="font-family:${FONT}; font-size:14px; color:#FFFFFF;
                 padding-top:12px;">${subtitle}</div>
          </td>
        </tr>

        <tr>
          <td dir="rtl" align="right" style="padding:30px 30px 8px 30px; font-family:${FONT};
              font-size:15px; line-height:1.9; color:${BRAND.text};">
            ${fillSampleData(bodyHtml)}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:22px 24px 26px 24px;
              border-top:1px solid ${BRAND.panelBorder};">
            <div style="font-family:${FONT}; font-size:12px; color:${BRAND.muted};">
              &copy; ${year} Elev8 Club، جميع الحقوق محفوظة.
            </div>
            <div style="font-family:${FONT}; font-size:12px; padding-top:8px;">
              <a href="#" style="color:${BRAND.muted}; text-decoration:underline;">إلغاء الاشتراك من هذه الرسائل</a>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
