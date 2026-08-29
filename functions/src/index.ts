import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import * as sgMail from "@sendgrid/mail";

admin.initializeApp();

interface BulkEmailRecipient {
  email: string;
  name: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes a legacy email string or a personalized recipient object.
 * @param {unknown} recipient Raw callable input.
 * @return {BulkEmailRecipient|null} A valid normalized recipient.
 */
function normalizeRecipient(recipient: unknown): BulkEmailRecipient | null {
  if (typeof recipient === "string") {
    const email = recipient.trim();
    return EMAIL_PATTERN.test(email) ? {email, name: ""} : null;
  }

  if (!recipient || typeof recipient !== "object") return null;
  const value = recipient as Record<string, unknown>;
  if (typeof value.email !== "string") return null;

  const email = value.email.trim();
  if (!EMAIL_PATTERN.test(email)) return null;

  return {
    email,
    name: typeof value.name === "string" ? value.name.trim() : "",
  };
}

/**
 * Escapes a lead name before inserting it into an HTML email.
 * @param {string} value Untrusted display name.
 * @return {string} HTML-safe text.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Replaces supported name placeholders in an email template.
 * @param {string} html Campaign HTML.
 * @param {string} name Recipient display name.
 * @return {string} Personalized campaign HTML.
 */
function personalizeEmail(html: string, name: string): string {
  const safeName = escapeHtml(name || "بك");
  return html.replace(/\{\{\s*(?:الاسم|name)\s*\}\}/gi, safeName);
}

// معلومات الـ Google Sheet
// ID فقط من الـ URL
const SPREADSHEET_ID = "15EijmLwIpjWgdOHhHR8YbsGJsg_K8b46T5qwLw1gkks";
const SHEET_NAME = "Sheet1"; // اسم الورقة

// تهيئة Google Sheets API
const auth = new google.auth.GoogleAuth({
  keyFile: "./service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({version: "v4", auth});

// الدالة اللي بتشتغل عند إضافة lead جديد
export const onLeadCreated = functions.firestore
  .document("leads/{leadId}")
  .onCreate(async (snapshot, context) => {
    const lead = snapshot.data();
    const leadId = context.params.leadId;

    try {
    // تحضير البيانات
      const row = [
        leadId,
        lead.fullName || "",
        lead.email || "",
        lead.phone || "",
        lead.country || "",
        lead.city || "",
        lead.affiliateCode || "none",
        lead.answers?.experienceLevel || "-",
        lead.answers?.readyAmount || "-",
        lead.createdAt || new Date().toISOString(),
        lead.step === 2 ? "Completed" : "Pending",
      ];

      // إضافة الصف للـ Google Sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:K`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [row],
        },
      });

      console.log(`✅ Lead ${leadId} added to Google Sheets`);
    } catch (error) {
      console.error("❌ Error adding lead to Google Sheets:", error);
    }
  });

// دالة إضافية: تحديث عند تعديل Lead
export const onLeadUpdated = functions.firestore
  .document("leads/{leadId}")
  .onUpdate(async (change, context) => {
    const leadBefore = change.before.data();
    const leadAfter = change.after.data();
    const leadId = context.params.leadId;

    // إذا تغير الـ step من 1 لـ 2 (أكمل الأسئلة)
    if (leadBefore.step === 1 && leadAfter.step === 2) {
      try {
      // ابحث عن الصف وحدثه
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A:K`,
        });

        const rows = response.data.values || [];
        let rowIndex = -1;

        // ابحث عن الصف اللي فيه الـ leadId
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][0] === leadId) {
            rowIndex = i + 1; // +1 لأن Google Sheets بتبدأ من 1
            break;
          }
        }

        if (rowIndex > 0) {
        // حدّث البيانات الجديدة
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!H${rowIndex}:K${rowIndex}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[
                leadAfter.answers?.experienceLevel || "-",
                leadAfter.answers?.readyAmount || "-",
                leadAfter.createdAt || "",
                "Completed",
              ]],
            },
          });

          console.log(`✅ Lead ${leadId} updated in Google Sheets`);
        }
      } catch (error) {
        console.error("❌ Error updating lead in Google Sheets:", error);
      }
    }
  });

/**
 * Firebase Function لإرسال الإيميلات الجماعية
 * تستقبل: subject, htmlContent, recipients[{email, name}]
 */
export const sendBulkEmail = functions.runWith({
  secrets: ["SENDGRID_API_KEY"],
}).https.onCall(async (data, context) => {
  // التحقق من أن المستخدم مصادق عليه
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to send emails"
    );
  }

  const callerSnapshot = await admin.database()
    .ref(`dashboard_users/${context.auth.uid}`)
    .once("value");
  if (callerSnapshot.val()?.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can send bulk emails"
    );
  }

  const {subject, htmlContent, recipients} = data;

  // التحقق من البيانات المطلوبة
  if (
    typeof subject !== "string" ||
    typeof htmlContent !== "string" ||
    !Array.isArray(recipients)
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: subject, htmlContent, or recipients"
    );
  }

  if (recipients.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Recipients array is empty"
    );
  }

  if (recipients.length > 1000) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A campaign cannot exceed 1000 recipients"
    );
  }

  if (String(subject).length > 150 || String(htmlContent).length > 200000) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email subject or content is too large"
    );
  }

  const uniqueRecipients = new Map<string, BulkEmailRecipient>();
  recipients.forEach((recipient: unknown) => {
    const normalized = normalizeRecipient(recipient);
    if (normalized) {
      uniqueRecipients.set(normalized.email.toLowerCase(), normalized);
    }
  });
  const validRecipients = Array.from(uniqueRecipients.values());

  if (validRecipients.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Recipients do not contain any valid email addresses"
    );
  }

  try {
    // جلب إعدادات البريد من Firebase
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (!sendgridKey) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "SendGrid API key is not configured"
      );
    }

    const settingsSnapshot = await admin.database()
      .ref("settings")
      .once("value");

    const settings = settingsSnapshot.val();

    if (!settings) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Email sender settings are not configured"
      );
    }

    // تهيئة SendGrid
    sgMail.setApiKey(sendgridKey);

    const senderEmail = settings.sender_email ||
      "noreply@elev8club.com";
    const senderName = settings.sender_name || "Elev8 Club";

    // إرسال الإيميلات على دفعات (100 لكل دفعة)
    const BATCH_SIZE = 100;
    const batches = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
      const batch = validRecipients.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }

    const batchMsg = "📧 Sending to " + validRecipients.length +
      " recipients in " + batches.length + " batches";
    console.log(batchMsg);

    // معالجة كل دفعة
    for (const batch of batches) {
      const emailPromises = batch.map(async (recipient) => {
        try {
          await sgMail.send({
            to: recipient.email,
            from: {
              email: senderEmail,
              name: senderName,
            },
            subject: subject,
            html: personalizeEmail(htmlContent, recipient.name),
          });
          successCount++;
          return {success: true};
        } catch (error) {
          console.error("Failed to send campaign email:", error);
          failedCount++;
          return {success: false};
        }
      });

      await Promise.all(emailPromises);
    }

    const completeMsg = "✅ Email campaign completed: " +
      successCount + " sent, " + failedCount + " failed";
    console.log(completeMsg);

    const resultMsg = "Email sent to " + successCount +
      " out of " + validRecipients.length + " recipients";

    return {
      success: true,
      totalRecipients: validRecipients.length,
      successCount,
      failedCount,
      message: resultMsg,
    };
  } catch (error: unknown) {
    if (error instanceof functions.https.HttpsError) throw error;
    const errorMessage = error instanceof Error ?
      error.message : "Unknown error";
    console.error("❌ Error sending bulk emails:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send emails: " + errorMessage
    );
  }
});

/**
 * Firebase Function لإنشاء مستخدم Dashboard جديد (Sales / Account Manager)
 * Creates a dashboard login without changing the admin's browser session.
 */
const publicHttps = functions.runWith({invoker: "public"}).https;

export const createDashboardUser = publicHttps.onCall(async (
  data,
  context,
) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated",
    );
  }

  // Verify caller is admin
  const callerUid = context.auth.uid;
  const callerSnap = await admin.database()
    .ref(`dashboard_users/${callerUid}`)
    .once("value");
  const caller = callerSnap.val();
  if (!caller || caller.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can create users",
    );
  }

  const {
    email, password, name, role, salesMemberKey, affiliateKey, versionKey,
  } = data;

  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields",
    );
  }
  if (!["sales", "account_manager", "affiliate"].includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid dashboard role",
    );
  }

  try {
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });
    const uid = userRecord.uid;

    // Write to dashboard_users
    const userData: any = {
      uid, email, name, role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    if (salesMemberKey) userData.salesMemberKey = salesMemberKey;
    if (affiliateKey) userData.affiliateKey = affiliateKey;
    if (versionKey) userData.versionKey = versionKey;
    if (role === "account_manager") userData.last_assigned_at = null;

    await admin.database().ref(`dashboard_users/${uid}`).set(userData);

    return {uid, success: true};
  } catch (err: any) {
    throw new functions.https.HttpsError(
      "internal",
      err.message || "Failed to create user",
    );
  }
});

/** Update Firebase Auth credentials and the matching dashboard profile. */
export const updateDashboardUserAuth = publicHttps.onCall(async (
  data,
  context,
) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated",
    );
  }

  const callerSnap = await admin.database()
    .ref(`dashboard_users/${context.auth.uid}`)
    .once("value");
  const caller = callerSnap.val();
  if (!caller || caller.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can update users",
    );
  }

  const {uid, email, password, name, isActive} = data;
  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User id is required",
    );
  }

  const authUpdate: admin.auth.UpdateRequest = {};
  if (email) authUpdate.email = email;
  if (password) authUpdate.password = password;
  if (name) authUpdate.displayName = name;
  if (typeof isActive === "boolean") authUpdate.disabled = !isActive;

  try {
    if (Object.keys(authUpdate).length) {
      await admin.auth().updateUser(uid, authUpdate);
    }
    const profileUpdate: Record<string, unknown> = {};
    if (email) profileUpdate.email = email;
    if (name) profileUpdate.name = name;
    if (typeof isActive === "boolean") profileUpdate.isActive = isActive;
    if (Object.keys(profileUpdate).length) {
      await admin.database()
        .ref(`dashboard_users/${uid}`)
        .update(profileUpdate);
    }
  } catch (err: any) {
    throw new functions.https.HttpsError(
      "internal",
      err.message || "Failed to update dashboard user",
    );
  }
});
