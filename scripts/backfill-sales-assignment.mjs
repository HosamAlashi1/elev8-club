/**
 * Assigns a sales member to every lead that has none.
 *
 * Why this exists: assignment used to happen only when a lead finished the questions, so anyone
 * who registered and never came back was left with no owner and fell out of the funnel silently.
 * The landing pages now assign at registration instead, but the leads stranded before that change
 * still need an owner — that is what this fixes.
 *
 * It is safe to re-run: a lead that already has `salesMemberKey` is skipped, so a second run
 * assigns nothing.
 *
 *   node scripts/backfill-sales-assignment.mjs              # dry run, writes nothing
 *   node scripts/backfill-sales-assignment.mjs --apply      # actually writes
 *
 * Reads and writes through the Firebase CLI, so it uses your existing `firebase login` and needs
 * no service-account file. You must be logged in as someone with write access to the project.
 *
 * WHAT IT WRITES: exactly one field per lead, `salesMemberKey`, through a deep PATCH. It never
 * touches any other field, never deletes, and never writes a lead that already has an owner.
 * `sales_status` is deliberately left alone — the dashboard already reads a missing status as the
 * first step of the lead's pipeline, and overwriting it could undo a sales member's own work.
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
    maxBuffer: 64 * 1024 * 1024,
    shell: true,
  });
}

function read(path) {
  return JSON.parse(cli(['database:get', `"${path}"`]) || 'null');
}

console.log(`Project: ${PROJECT}`);
console.log(APPLY ? 'Mode: APPLY (will write)\n' : 'Mode: DRY RUN (nothing will be written)\n');

// ── Who can receive leads ───────────────────────────────────────────────────
const members = Object.entries(read('/sales_members') || {})
  .map(([key, value]) => ({ key, ...value }))
  .filter(m => m.isActive);

if (members.length === 0) {
  console.error('No active sales member exists — nothing can be assigned. Aborting.');
  process.exit(1);
}

console.log(`Active sales members: ${members.length}`);
members.forEach(m => console.log(`  - ${m.name} (${m.key})  version ${m.versionKey}`));

// ── Which leads need one ────────────────────────────────────────────────────
const leads = read('/leads') || {};
const all = Object.entries(leads);
const unassigned = all.filter(([, lead]) => lead && !lead.salesMemberKey);

console.log(`\nLeads: ${all.length} total, ${all.length - unassigned.length} already owned, ${unassigned.length} unowned`);

if (unassigned.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

// ── Hand them out ───────────────────────────────────────────────────────────
// Same rule the landing pages use (FirebaseService.assignNextSalesMember): least recently
// assigned wins, and a member who has never been assigned goes first. Here it is applied in one
// pass rather than one write per lead, so the pool comes out evenly loaded.
const pool = members.slice().sort((a, b) => {
  if (!a.last_assigned_at && !b.last_assigned_at) return 0;
  if (!a.last_assigned_at) return -1;
  if (!b.last_assigned_at) return 1;
  return a.last_assigned_at - b.last_assigned_at;
});

const patch = {};
const tally = {};
let cursor = 0;

for (const [leadKey, lead] of unassigned) {
  // Only members belonging to this lead's version may take it; fall back to the whole pool if
  // that version has none, so a lead is never left unowned just because of a version mismatch.
  const eligible = pool.filter(m => m.versionKey === lead.versionKey);
  const from = eligible.length > 0 ? eligible : pool;
  const chosen = from[cursor % from.length];
  cursor++;

  // Deep path: patches this one field and leaves the rest of the lead untouched.
  patch[`${leadKey}/salesMemberKey`] = chosen.key;
  tally[chosen.name] = (tally[chosen.name] || 0) + 1;
}

console.log('\nPlanned assignment:');
Object.entries(tally).forEach(([name, count]) => console.log(`  ${name}: ${count} leads`));

const byStep = {};
unassigned.forEach(([, l]) => { byStep[`step ${l.step}`] = (byStep[`step ${l.step}`] || 0) + 1; });
console.log(`  (by step: ${JSON.stringify(byStep)})`);

if (!APPLY) {
  console.log(`\nDry run — nothing written. Re-run with --apply to write ${Object.keys(patch).length} fields.`);
  process.exit(0);
}

// ── Write ───────────────────────────────────────────────────────────────────
const file = join(mkdtempSync(join(tmpdir(), 'assign-')), 'patch.json');
writeFileSync(file, JSON.stringify(patch, null, 2));
console.log(`\nPatch written to ${file}`);
console.log(`Applying ${Object.keys(patch).length} field updates to /leads ...`);

cli(['database:update', '"/leads"', `"${file}"`, '--force']);

// Keep the round robin honest: the members that just took leads should not immediately win the
// next one on the landing page too.
const now = Date.now();
const stamps = {};
Object.keys(tally).forEach(name => {
  const m = pool.find(x => x.name === name);
  if (m) stamps[`${m.key}/last_assigned_at`] = now;
});
const stampFile = join(mkdtempSync(join(tmpdir(), 'assign-')), 'stamps.json');
writeFileSync(stampFile, JSON.stringify(stamps, null, 2));
cli(['database:update', '"/sales_members"', `"${stampFile}"`, '--force']);

// ── Verify ──────────────────────────────────────────────────────────────────
const after = read('/leads') || {};
const stillUnowned = Object.entries(after).filter(([, l]) => l && !l.salesMemberKey);
const lost = Object.keys(leads).filter(k => !(k in after));

console.log('\n--- verification ---');
console.log(`leads before: ${all.length}   leads after: ${Object.keys(after).length}`);
console.log(`leads lost:   ${lost.length} ${lost.length ? JSON.stringify(lost) : '(none)'}`);
console.log(`still unowned: ${stillUnowned.length}`);
console.log(stillUnowned.length === 0 && lost.length === 0 ? '\nDone — every lead has an owner.' : '\nCheck the numbers above.');
