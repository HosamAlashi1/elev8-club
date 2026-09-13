/**
 * Stamps `emailLower` on every lead that does not have one.
 *
 * Registration de-duplicates by looking a lead up with
 * `orderByChild('emailLower').equalTo(...)`. Firebase can only query a field that actually
 * exists on the record, so every lead created before that field was introduced is invisible to
 * the lookup — and the first time one of those people registers again they would get a second
 * record, which is the whole thing this is meant to prevent.
 *
 *   node scripts/backfill-email-lower.mjs           # dry run, writes nothing
 *   node scripts/backfill-email-lower.mjs --apply   # actually writes
 *
 * WHAT IT WRITES: exactly one new field per lead, through a deep PATCH. It never changes
 * `email` itself, never touches any other field, and never deletes. Safe to re-run — a lead
 * that already has the field is skipped.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECT = 'elev8-club-3';
const APPLY = process.argv.includes('--apply');

function cli(args) {
  return execFileSync('npx', ['firebase', ...args, '--project', PROJECT], {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    shell: true,
  });
}

console.log(`Project: ${PROJECT}`);
console.log(APPLY ? 'Mode: APPLY (will write)\n' : 'Mode: DRY RUN (nothing will be written)\n');

const leads = JSON.parse(cli(['database:get', '"/leads"']) || '{}');
const all = Object.entries(leads);

const patch = {};
let already = 0;
let noEmail = 0;
const changedCasing = [];

for (const [key, lead] of all) {
  if (!lead || typeof lead !== 'object') continue;

  const email = String(lead.email || '').trim();
  if (!email) { noEmail++; continue; }

  if (lead.emailLower) { already++; continue; }

  const lower = email.toLowerCase();
  patch[`${key}/emailLower`] = lower;

  // Worth reporting: these are the records the old case-sensitive lookup would have missed.
  if (lower !== email) changedCasing.push({ key, email, lower });
}

console.log(`leads                : ${all.length}`);
console.log(`already have it      : ${already}`);
console.log(`no email at all      : ${noEmail}`);
console.log(`to stamp             : ${Object.keys(patch).length}`);
console.log(`whose address is not already lower-case: ${changedCasing.length}`);
changedCasing.slice(0, 8).forEach(c => console.log(`   ${c.email}  →  ${c.lower}`));

// How many DISTINCT mailboxes this reveals, once casing stops splitting them.
const boxes = new Map();
for (const [, lead] of all) {
  if (!lead?.email) continue;
  const k = `${lead.versionKey}|${lead.source || 'v1'}|${String(lead.email).trim().toLowerCase()}`;
  boxes.set(k, (boxes.get(k) || 0) + 1);
}
const dup = [...boxes.values()].filter(n => n > 1);
console.log(`\nmailboxes registered more than once: ${dup.length}`);
console.log(`extra records they account for     : ${dup.reduce((s, n) => s + n - 1, 0)}`);

if (!APPLY) {
  console.log(`\nDry run — nothing written. Re-run with --apply.`);
  process.exit(0);
}

if (Object.keys(patch).length === 0) {
  console.log('\nNothing to do.');
  process.exit(0);
}

const file = join(mkdtempSync(join(tmpdir(), 'emaillower-')), 'patch.json');
writeFileSync(file, JSON.stringify(patch, null, 2));
console.log(`\nPatch written to ${file}`);
cli(['database:update', '"/leads"', `"${file}"`, '--force']);

// ── Verify ────────────────────────────────────────────────────────────────
const after = JSON.parse(cli(['database:get', '"/leads"']) || '{}');
const afterEntries = Object.entries(after);
const missing = afterEntries.filter(([, l]) => l?.email && !l.emailLower).length;
const lost = Object.keys(leads).filter(k => !(k in after));

console.log('\n--- verification ---');
console.log(`leads before: ${all.length}   after: ${afterEntries.length}`);
console.log(`leads lost  : ${lost.length} ${lost.length ? JSON.stringify(lost) : '(none)'}`);
console.log(`still missing emailLower: ${missing}`);
console.log(missing === 0 && lost.length === 0 ? '\nDone.' : '\nCheck the numbers above.');
