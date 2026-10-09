import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {botFieldDefaults, reserveCode} from "./register-lead";

/**
 * A sales member adding a lead from the dashboard's Leads page.
 *
 * Admins keep their own path (the browser writes the lead itself, as the
 * database rules allow only admins to create leads). Sales members cannot
 * write to `leads`, and must not be able to: this function is the only door,
 * and it enforces what the UI only suggests.
 *
 *  - The caller must be signed in with the `sales` (or `admin`) role.
 *  - A sales member's lead is ALWAYS owned by that member. The owner comes
 *    from their own `dashboard_users` profile, never from the request, so
 *    nobody can add a lead to someone else's list.
 *  - No affiliate can be attached, and an existing lead is never touched: if
 *    the email is already registered in this version and source the call is
 *    refused instead of updating it (which would let one member overwrite the
 *    name and phone of a lead that belongs to another).
 *  - Only the two dashboard sources, `v1` and `v2`, and only an existing
 *    version.
 *
 * The lead is shaped exactly as the admin path shapes it: v1 is a plain
 * insert, v2 also reserves a subscription number and gets the bot defaults.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AddDashboardLeadRequest {
  versionKey: string;
  fullName: string;
  email: string;
  phone: string;
  /** 'v1' | 'v2'. */
  source: string;
  country?: string;
  city?: string;
}

export const addDashboardLead = functions
  .runWith({invoker: "public", timeoutSeconds: 60})
  .https.onCall(async (data: AddDashboardLeadRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated", "You must be signed in."
      );
    }
    const db = admin.database();

    const profileSnap = await db
      .ref(`dashboard_users/${context.auth.uid}`).once("value");
    const profile = profileSnap.val() || {};
    const role = String(profile.role || "");
    if (role !== "sales" && role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied", "Only sales members and admins can add leads."
      );
    }

    // The owner. Sales: always themselves. Admins use their own screen, but
    // if one calls this, they must say who the lead is for.
    const salesMemberKey = String(profile.salesMemberKey || "").trim();
    if (role === "sales" && !salesMemberKey) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Your account is not linked to a sales member yet."
      );
    }

    // ── Validate ────────────────────────────────────────────────────────
    const versionKey = String(data?.versionKey || "").trim();
    const fullName = String(data?.fullName || "").trim();
    const email = String(data?.email || "").trim();
    const phone = String(data?.phone || "").trim();
    const source = String(data?.source || "").trim();
    const country = String(data?.country || "").trim();
    const city = String(data?.city || "").trim();

    if (!versionKey || !fullName || !email || !phone) {
      throw new functions.https.HttpsError(
        "invalid-argument", "Name, email, phone and version are all required."
      );
    }
    if (!EMAIL_PATTERN.test(email)) {
      throw new functions.https.HttpsError(
        "invalid-argument", "That email address is not valid."
      );
    }
    if (source !== "v1" && source !== "v2") {
      throw new functions.https.HttpsError(
        "invalid-argument", "Unknown source."
      );
    }
    if (
      fullName.length > 120 || email.length > 200 || phone.length > 40 ||
      country.length > 100 || city.length > 100
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument", "One of the fields is too long."
      );
    }

    const version = await db.ref(`versions/${versionKey}`).once("value");
    if (!version.exists()) {
      throw new functions.https.HttpsError(
        "invalid-argument", "That version does not exist."
      );
    }

    // ── Duplicate? Refuse, never update. ────────────────────────────────
    const lower = email.toLowerCase();
    const snap = await db.ref("leads")
      .orderByChild("emailLower").equalTo(lower).once("value");
    let duplicate = false;
    snap.forEach((child) => {
      const lead = child.val() || {};
      if (
        lead.versionKey === versionKey &&
        (lead.source || "v1") === source &&
        String(lead.email || "").trim().toLowerCase() === lower
      ) {
        duplicate = true;
      }
      return false;
    });
    if (duplicate) {
      throw new functions.https.HttpsError(
        "already-exists",
        "This email already exists in the same version and source."
      );
    }

    // ── Create ──────────────────────────────────────────────────────────
    const ref = db.ref("leads").push();
    const leadKey = ref.key as string;

    const lead: Record<string, unknown> = {
      key: leadKey,
      versionKey,
      fullName,
      email,
      emailLower: lower,
      phone,
      step: 1,
      consent: true,
      source,
      createdAt: new Date().toISOString(),
      registrationCount: 1,
      // v2's first pipeline step is the bot follow-up; v1's is "new".
      sales_status: source === "v2" ? "bot_followup" : "new",
    };
    if (country) lead.country = country;
    if (city) lead.city = city;
    if (salesMemberKey) lead.salesMemberKey = salesMemberKey;

    let subscriptionNumber: string | null = null;
    if (source === "v2") {
      subscriptionNumber = await reserveCode();
      if (!subscriptionNumber) {
        throw new functions.https.HttpsError(
          "resource-exhausted", "Could not reserve a subscription code."
        );
      }
      Object.assign(lead, botFieldDefaults(subscriptionNumber));
    }

    await ref.set(lead);

    return {leadKey, subscriptionNumber};
  });
