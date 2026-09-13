import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Registration for the landing pages, with de-duplication by email.
 *
 * ## Why this is a function and not a browser write
 *
 * The pages used to write to `leads` directly, which worked because the
 * security rules allow an
 * anonymous create. De-duplication cannot be done that way:
 *
 *  1. **Finding the existing lead needs a query on `leads` by email.** Allowing
 *  that from the
 *     browser would let anyone type an address and read back that person's
 *     name, phone and
 *     answers. The rules deliberately permit only `subscriptionNumber` and
 *     `telegramChatId`
 *     lookups, and opening a third is not worth it.
 *  2. **Updating the lead needs to change `fullName` and `phone`.** The
 *  anonymous write rule
 *     freezes exactly those, so the browser cannot do it even with the key in
 *     hand.
 *
 * Running here solves both, and puts the merge rules somewhere they cannot be
 * bypassed by
 * anything calling the database from outside.
 *
 * ## Scope of "duplicate"
 *
 * Same **versionKey + source + email**. Not email alone:
 *   - a v1 and a v2 record for one person are two funnels, with different
 *   fields and different
 *     pipelines — merging them corrupts both;
 *   - a new campaign version is a new funnel, so someone returning next season
 *   is a new lead.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CODE_MIN = 10000;
const CODE_MAX = 99999;
const MAX_CODE_ATTEMPTS = 12;

export interface RegisterLeadRequest {
  versionKey: string;
  fullName: string;
  email: string;
  phone: string;
  /** 'v1' | 'v2'. Anything else is refused rather than guessed at. */
  source: string;
  affiliateKey?: string;
  affiliateCode?: string;
}

/**
 * Reserves an unused code by transaction, so two people registering in the same
 * instant cannot
 * be handed the same one. Mirrors the client's SubscriptionCodeService, and the
 * node stores only
 * a timestamp — never the lead key, because a five-digit code is guessable and
 * `leads/$leadId`
 * is readable by key.
 * @return {Promise<string|null>} The code, or null if none could be reserved.
 */
async function reserveCode(): Promise<string | null> {
  const db = admin.database();
  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = String(
      CODE_MIN + Math.floor(Math.random() * (CODE_MAX - CODE_MIN + 1))
    );
    const ref = db.ref(`subscription_codes/${code}`);
    const res = await ref.transaction(
      (cur: unknown) => (cur === null ? {claimedAt: Date.now()} : undefined)
    );
    if (res.committed) return code;
  }
  return null;
}

/**
 * The bot's fields at their defaults, written once when a lead first gets a
 * number.
 * @param {string} subscriptionNumber The reserved code.
 * @return {object} The block to merge into a new lead.
 */
function botFieldDefaults(subscriptionNumber: string) {
  return {
    subscriptionNumber,
    type: "free",
    telegramChatId: null,
    currentStepNumber: 1,
    tradingAccountNumber: "",
    accountVerificationStatus: "not_submitted",
    botStartedAt: null,
    botCompletedAt: null,
    botLastInteractionAt: null,
  };
}

export const registerLead = functions
  .runWith({invoker: "public", timeoutSeconds: 60})
  .https.onCall(async (data: RegisterLeadRequest) => {
    // ── Validate ──────────────────────────────────────────────────────────
    const versionKey = String(data?.versionKey || "").trim();
    const fullName = String(data?.fullName || "").trim();
    const email = String(data?.email || "").trim();
    const phone = String(data?.phone || "").trim();
    const source = String(data?.source || "").trim();

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
    if (fullName.length > 120 || email.length > 200 || phone.length > 40) {
      throw new functions.https.HttpsError(
        "invalid-argument", "One of the fields is too long."
      );
    }

    const db = admin.database();
    const lower = email.toLowerCase();

    // ── Is this address already registered in this funnel? ────────────────
    // Queried on "emailLower", not "email".
    //
    // Firebase's equalTo is an exact string match, so searching the raw field
    // makes Ahmad@Gmail.com and ahmad@gmail.com two different leads — the same
    // mailbox registered twice, which is exactly what this exists to stop.
    // The result is still filtered below rather than trusted.
    const snap = await db.ref("leads")
      .orderByChild("emailLower")
      .equalTo(lower)
      .once("value");

    let existingKey: string | null = null;
    let existing: Record<string, unknown> | null = null;

    snap.forEach((child) => {
      const lead = child.val() || {};
      const sameVersion = lead.versionKey === versionKey;
      const sameSource = (lead.source || "v1") === source;
      const sameEmail = String(lead.email || "").trim().toLowerCase() === lower;
      if (sameVersion && sameSource && sameEmail && !existingKey) {
        existingKey = child.key;
        existing = lead;
      }
      return false;
    });

    // ── Returning registrant: update, never insert ────────────────────────
    if (existingKey && existing) {
      const prev = existing as Record<string, any>;

      // The number is reused. A returning lead may already have typed theirs
      // into the bot, and
      // issuing a second one would orphan whatever progress that conversation
      // has made.
      const subscriptionNumber = prev.subscriptionNumber || await reserveCode();

      const update: Record<string, unknown> = {
        // Their own details, corrected to whatever they just typed.
        fullName,
        phone,
        // NOT `step`. A lead who already finished the questions stays finished
        // — re-registering
        // must never knock them back from completed to pending, which is what
        // writing step 1
        // here would do.
        lastRegisteredAt: new Date().toISOString(),
        registrationCount: (Number(prev.registrationCount) || 1) + 1,
      };

      if (data.affiliateKey) update.affiliateKey = data.affiliateKey;
      if (data.affiliateCode) update.affiliateCode = data.affiliateCode;

      // Backfill for a lead that predates the field, so the NEXT lookup
      // finds it too.
      if (!prev.emailLower) update.emailLower = lower;

      // Only stamp the bot block if the record never had a number — rewriting
      // it would reset
      // telegramChatId and currentStepNumber, which the bot's backend owns.
      if (!prev.subscriptionNumber && subscriptionNumber) {
        Object.assign(update, botFieldDefaults(subscriptionNumber));
      }

      await db.ref(`leads/${existingKey}`).update(update);

      return {
        leadKey: existingKey,
        subscriptionNumber: subscriptionNumber || null,
        isReturning: true,
        step: Number(prev.step) || 1,
      };
    }

    // ── New registrant ────────────────────────────────────────────────────
    const subscriptionNumber = await reserveCode();

    const lead: Record<string, unknown> = {
      versionKey,
      fullName,
      email,
      // The lower-cased copy the lookup above queries on. Stored rather than
      // derived at read time because Firebase can only index a real field.
      emailLower: lower,
      phone,
      step: 1,
      consent: true,
      source,
      createdAt: new Date().toISOString(),
      registrationCount: 1,
      ...(subscriptionNumber ? botFieldDefaults(subscriptionNumber) : {}),
    };

    if (data.affiliateKey) lead.affiliateKey = data.affiliateKey;
    if (data.affiliateCode) lead.affiliateCode = data.affiliateCode;

    const ref = db.ref("leads").push();
    const leadKey = ref.key as string;
    await ref.set({...lead, key: leadKey});

    return {
      leadKey,
      subscriptionNumber: subscriptionNumber || null,
      isReturning: false,
      step: 1,
    };
  });
