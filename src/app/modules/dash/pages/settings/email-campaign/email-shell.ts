/**
 * Preview-only copy of the email shell.
 *
 * ⚠️ Mirrors `functions/src/email-template.ts`, which is the one that actually sends. They are
 * duplicated rather than shared because the Cloud Functions package compiles separately from the
 * Angular app and neither can import across that boundary.
 *
 * The duplication is CHECKED, not trusted: `npm run check:email-parity` renders both shells with
 * the same input and diffs them byte for byte, and firebase.json runs it before every functions
 * deploy, so a preview that has drifted from the sending template cannot ship. An earlier version
 * of this file compared only the colour palette at runtime, which missed everything else — sizes,
 * padding, markup — and the preview lied for a whole afternoon about the header.
 *
 * Deliberately free of Angular imports so the parity script can load it outside the app.
 *
 * Only `renderPreview` and the placeholder list live here — the snippet helpers are a sending
 * concern and have no preview equivalent.
 */

/**
 * Sampled from the live welcome email's MIME source (Gmail → Show original), not from a
 * screenshot. Keep in step with BRAND in functions/src/email-template.ts.
 */
export const BRAND = {
  green: '#0d3233',
  greenLight: '#125254',
  gold: '#EFCB63',
  goldRule: '#D7A747',
  goldShine: '#FDF28E',
  goldText: '#B8892E',
  card: '#FFFFFF',
  cardBorder: '#ECE0C4',
  page: '#F6F1E4',
  panel: '#FBF6E8',
  warn: '#FFF8E5',
  warnBorder: '#F0D991',
  warnText: '#66500F',
  heading: '#0d3233',
  body: '#3a4a4a',
  muted: '#9a9284',
};

const FONT = "Tajawal, 'Noto Kufi Arabic', Tahoma, Arial, sans-serif";

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
  { token: '{{code}}', alias: '{{رقم_الاشتراك}}', label: 'رقم الاشتراك', sample: '48291' },
];

const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z_؀-ۿ]+)\s*\}\}/g;

const SAMPLE: Record<string, string> = {
  name: 'محمد أحمد',
  الاسم: 'محمد أحمد',
  email: 'lead@example.com',
  الايميل: 'lead@example.com',
  phone: '+970594136058',
  الجوال: '+970594136058',
  code: '48291',
  رقم_الاشتراك: '48291',
};

/**
 * Escapes untrusted text before it goes into HTML.
 *
 * Identical to `escapeHtml` in the sending template — the preheader has to be escaped the same
 * way on both sides or the preview and the real email would differ the moment someone types an
 * ampersand into it.
 */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Fills placeholders with sample values so the preview reads like a real email rather than like
 * a template. An unknown token is left visible on purpose — that is the admin's typo, and the
 * preview is where they should notice it.
 *
 * This is the ONE legitimate difference between the two shells: the sending side substitutes
 * real recipient data upstream, in send-campaign.ts, and hands `renderEmail` a finished body.
 */
export function fillSampleData(html: string): string {
  return html.replace(PLACEHOLDER_PATTERN, (whole, raw) => SAMPLE[String(raw).trim()] ?? whole);
}

/**
 * A COMPLETE HTML document for the preview, byte-identical to what
 * `functions/src/email-template.ts` sends for the same body and preheader.
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
  const subtitle = escapeHtml(preheader || 'Elev8 Club');
  const body = fillSampleData(bodyHtml);

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
            ${body}
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
