import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {google} from "googleapis";

admin.initializeApp();

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
