import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * `leads_index`: a small read-only copy of each lead, for the dashboard lists.
 *
 * ## Why
 *
 * A lead carries the whole questionnaire, the bot state, group links and so
 * on, so the leads of one version are ~0.7 MB. The Sales Performance and
 * Overview pages only need a handful of fields per lead, but Realtime
 * Database cannot return a subset of fields, so every page open downloaded
 * everything over the websocket. These pages read this index instead.
 *
 * ## What this never does
 *
 * It only READS `leads` and only WRITES `leads_index`. It never changes a
 * lead. The index can always be deleted and rebuilt from `leads`
 * (`rebuildLeadsIndex`), and the browser cannot write to it (see the rules).
 */

/** The fields the dashboard lists use. Add one, then rebuild, to expose it. */
const INDEX_FIELDS = [
  "versionKey", "fullName", "email", "phone", "source", "step",
  "sales_status", "sales_package", "salesMemberKey", "affiliateKey",
  "createdAt", "completedAt", "payment_status", "accountVerificationStatus",
  "qualification", "offerPlan", "botStartedAt",
] as const;

/**
 * @param {unknown} lead A raw lead record.
 * @return {Record<string, unknown>|null} Its index entry, or null.
 */
export function toIndexEntry(lead: unknown): Record<string, unknown> | null {
  if (!lead || typeof lead !== "object") return null;
  const src = lead as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of INDEX_FIELDS) {
    if (src[field] !== undefined && src[field] !== null) {
      out[field] = src[field];
    }
  }
  return out;
}

/** Keeps `leads_index/{leadKey}` in step with `leads/{leadKey}`. */
export const syncLeadsIndex = functions.database
  .ref("/leads/{leadKey}")
  .onWrite(async (change, context) => {
    const after = toIndexEntry(change.after.val());
    const before = toIndexEntry(change.before.val());
    // The bot rewrites leads often; most of those writes touch nothing in the
    // index, so skip them.
    if (JSON.stringify(after) === JSON.stringify(before)) return null;

    const ref = admin.database().ref(`leads_index/${context.params.leadKey}`);
    return after ? ref.set(after) : ref.remove();
  });

/**
 * Admin-only. Rebuilds the whole index from `leads` (also removes entries for
 * leads that no longer exist). Safe to run any number of times.
 */
export const rebuildLeadsIndex = functions
  .runWith({invoker: "public", timeoutSeconds: 300, memory: "512MB"})
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated", "You must be signed in."
      );
    }
    const db = admin.database();
    const profile = (await db
      .ref(`dashboard_users/${context.auth.uid}`).once("value")).val() || {};
    if (profile.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied", "Only admins can rebuild the leads index."
      );
    }

    const leads = (await db.ref("leads").once("value")).val() || {};
    const existing = (await db.ref("leads_index").once("value")).val() || {};

    const updates: Record<string, unknown> = {};
    let written = 0;
    let removed = 0;
    for (const [key, lead] of Object.entries(leads)) {
      updates[key] = toIndexEntry(lead);
      written++;
    }
    for (const key of Object.keys(existing)) {
      if (!(key in leads)) {
        updates[key] = null;
        removed++;
      }
    }

    const keys = Object.keys(updates);
    for (let i = 0; i < keys.length; i += 200) {
      const chunk: Record<string, unknown> = {};
      keys.slice(i, i + 200).forEach((k) => {
        chunk[k] = updates[k];
      });
      await db.ref("leads_index").update(chunk);
    }
    return {written, removed};
  });
