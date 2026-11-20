import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const GROUP_CAPACITY = 1000;

interface WhatsAppGroup {
  versionKey?: string;
  group_link?: string;
  whatsapp_link?: string;
  whatsapp_number?: string;
  group_name?: string;
  name?: string;
  group_order?: number;
  counter?: number;
  last_assigned_at?: number;
}

interface WhatsAppAssignment {
  sales_id: string;
  group_id?: string;
  group_name?: string;
  group_link: string;
  group_order?: number;
  whatsapp_number?: string;
  assigned_at: number;
  assigned_via: string;
  versionKey?: string;
}

interface RegistrationLead {
  source?: string;
  versionKey?: string;
  step?: number;
  assigned_sales?: WhatsAppAssignment;
}

/**
 * @param {string} link A configured WhatsApp link, optionally without a scheme.
 * @return {string} A safe link to use in both destinations.
 */
function whatsappUrl(link: string): string {
  const value = link.trim();
  if (!value) return "";
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      !["chat.whatsapp.com", "wa.me"].includes(url.hostname) ||
      url.username || url.password || url.port || url.pathname === "/"
    ) return "";
    return candidate;
  } catch {
    return "";
  }
}

/**
 * @param {WhatsAppGroup} group A group from the registration's version.
 * @return {string} The invite, or the legacy WhatsApp contact link.
 */
function groupUrl(group: WhatsAppGroup): string {
  const number = String(group.whatsapp_number || "").replace(/\D/g, "");
  return whatsappUrl(String(group.group_link || "")) ||
    whatsappUrl(String(group.whatsapp_link || "")) ||
    (number ? `https://wa.me/${number}` : "");
}

/**
 * @param {RegistrationLead|null} lead The current lead record.
 * @return {WhatsAppAssignment|null} The saved, validated destination.
 */
function savedAssignment(
  lead: RegistrationLead | null
): WhatsAppAssignment | null {
  const saved = lead?.assigned_sales;
  const link = whatsappUrl(String(saved?.group_link || ""));
  return saved && link ? {...saved, group_link: link} : null;
}

/**
 * Reuses the saved assignment, or reserves a group for both email and the form.
 * Concurrent requests keep the winner's assignment and release the extra slot.
 * @param {admin.database.Reference} leadRef The registrant's database record.
 * @param {RegistrationLead} lead The current registration data.
 * @return {Promise<WhatsAppAssignment|null>} The saved WhatsApp destination.
 */
export async function getOrAssignRegistrationWhatsApp(
  leadRef: admin.database.Reference,
  lead: RegistrationLead
): Promise<WhatsAppAssignment | null> {
  const existing = savedAssignment(lead);
  if (existing) return existing;
  const version = lead.versionKey;
  if (!version) return null;

  const db = admin.database();
  const groups = await db.ref("sales").orderByChild("versionKey")
    .equalTo(version).get();
  const candidates: { key: string; order: number }[] = [];
  let index = 0;
  groups.forEach((child) => {
    const group = child.val() as WhatsAppGroup;
    index++;
    if (child.key && groupUrl(group)) {
      candidates.push({
        key: child.key,
        order: Number(group.group_order) || index,
      });
    }
  });
  candidates.sort((a, b) => a.order - b.order);

  for (const {key, order} of candidates) {
    const groupRef = db.ref(`sales/${key}`);
    const assignedAt = Date.now();
    const reservation = await groupRef.transaction(
      (group: WhatsAppGroup | null) => {
        // A cold transaction can first see null before Firebase supplies data.
        if (group === null) return null;
        const count = Number(group.counter) || 0;
        if (group.versionKey !== version || !groupUrl(group) ||
          count >= GROUP_CAPACITY) return;
        return {...group, counter: count + 1, last_assigned_at: assignedAt};
      }
    );
    const group = reservation.snapshot.val() as WhatsAppGroup | null;
    if (!reservation.committed || !group) continue;

    const assignment: WhatsAppAssignment = {
      sales_id: key,
      group_id: key,
      group_name: group.group_name || group.name || `WhatsApp Group ${order}`,
      group_link: groupUrl(group),
      group_order: order,
      whatsapp_number: group.whatsapp_number || "",
      assigned_at: assignedAt,
      assigned_via: "whatsapp_group",
      versionKey: version,
    };

    const result = await leadRef.transaction(
      (current: RegistrationLead | null) => {
        if (current === null) return null;
        if (current.versionKey !== version) return;
        if (savedAssignment(current)) return;
        return {...current, assigned_sales: assignment};
      }
    ).catch(async (error: unknown) => {
      await releaseGroupSlot(groupRef);
      throw error;
    });
    if (result.committed && result.snapshot.exists()) return assignment;

    await releaseGroupSlot(groupRef);
    break;
  }

  // A competing request might have taken the last slot for this same lead.
  return savedAssignment((await leadRef.get()).val());
}

/**
 * @param {admin.database.Reference} groupRef The reserved group.
 */
async function releaseGroupSlot(
  groupRef: admin.database.Reference
): Promise<void> {
  await groupRef.child("counter").transaction((current: number | null) => {
    if (current === null) return null;
    const count = Number(current);
    return count > 0 ? count - 1 : undefined;
  });
}

export const assignRegistrationWhatsApp = functions.region("us-central1")
  .https.onCall(async (data) => {
    const leadId = String(data?.leadId || "").trim();
    if (!/^[A-Za-z0-9_-]{10,100}$/.test(leadId)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid lead.");
    }
    const leadRef = admin.database().ref(`leads/${leadId}`);
    const lead = (await leadRef.get()).val() as RegistrationLead | null;
    const source = lead?.source || "v1";
    if (!lead || Number(lead.step) !== 2 ||
      (source !== "v1" && source !== "webinar2")) {
      throw new functions.https.HttpsError(
        "failed-precondition", "Complete registration first."
      );
    }
    const assignment = await getOrAssignRegistrationWhatsApp(leadRef, lead);
    if (!assignment) {
      throw new functions.https.HttpsError(
        "resource-exhausted", "No WhatsApp group is available."
      );
    }
    return assignment;
  });
