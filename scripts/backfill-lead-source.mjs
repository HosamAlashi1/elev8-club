#!/usr/bin/env node
/**
 * Stamps `source: 'v1'` onto every existing lead in the shared `leads` node that predates the
 * LeadSource field (see src/app/core/models/lead.model.ts). New leads already get `source`
 * set at creation time (register-popup.component.ts / elev8-club-v2's LeadService) — this
 * script only backfills history so the dashboard's Source column/filter is accurate for old
 * records too, instead of relying on the "missing source = v1" fallback everywhere.
 *
 * Safe by default: running it with no flags only PRINTS a report (how many leads are missing
 * `source`, a few sample keys) and writes NOTHING. Pass --apply to actually perform the update.
 *
 * Usage:
 *   node scripts/backfill-lead-source.mjs                       # dry run (report only)
 *   node scripts/backfill-lead-source.mjs --apply                # actually writes source:'v1'
 *   node scripts/backfill-lead-source.mjs --apply --database-url=https://...firebaseio.com
 *
 * Requires:
 *   - `npm install --save-dev firebase-admin` (not installed by default — this is a one-off
 *     maintenance script, not part of the app bundle).
 *   - A service account key with write access to the Realtime Database, referenced via the
 *     GOOGLE_APPLICATION_CREDENTIALS env var, e.g.:
 *       GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/backfill-lead-source.mjs --apply
 *     (Firebase Console → Project Settings → Service Accounts → Generate new private key.)
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const DEFAULT_DATABASE_URL = 'https://elev8-club-3-default-rtdb.firebaseio.com';

function parseArgs(argv) {
  const apply = argv.includes('--apply') || argv.includes('--write');
  const urlArg = argv.find(a => a.startsWith('--database-url='));
  const databaseURL = urlArg ? urlArg.split('=').slice(1).join('=') : DEFAULT_DATABASE_URL;
  return { apply, databaseURL };
}

async function main() {
  const { apply, databaseURL } = parseArgs(process.argv.slice(2));

  const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? applicationDefault()
    : (() => {
        console.error(
          'GOOGLE_APPLICATION_CREDENTIALS is not set. Point it at a service-account JSON with\n' +
          'Realtime Database write access before running this script. See the header comment.'
        );
        process.exit(1);
      })();

  initializeApp({ credential, databaseURL });

  const db = getDatabase();
  const snapshot = await db.ref('leads').get();

  if (!snapshot.exists()) {
    console.log('No leads found at all — nothing to do.');
    return;
  }

  const allLeads = snapshot.val();
  const missingSourceKeys = Object.keys(allLeads).filter(key => !allLeads[key]?.source);
  const totalLeads = Object.keys(allLeads).length;

  console.log(`Total leads: ${totalLeads}`);
  console.log(`Leads missing 'source': ${missingSourceKeys.length}`);
  console.log('Sample keys:', missingSourceKeys.slice(0, 10));

  if (missingSourceKeys.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  if (!apply) {
    console.log('\nDry run only — no writes were made. Re-run with --apply to stamp source: "v1".');
    return;
  }

  const updates = {};
  missingSourceKeys.forEach(key => {
    updates[`leads/${key}/source`] = 'v1';
  });

  await db.ref().update(updates);
  console.log(`\nDone — stamped source: 'v1' on ${missingSourceKeys.length} lead(s).`);
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
