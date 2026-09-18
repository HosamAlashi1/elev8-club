/**
 * Proves the campaign preview renders exactly what the campaign sends.
 *
 * The two shells cannot import each other: functions/ compiles with its own
 * tsconfig to CommonJS for Node 20, and the Angular app compiles with the CLI.
 * So the markup is duplicated — and duplication that nobody checks is just a
 * bug with a delay on it. This renders both with identical input and diffs the
 * output byte for byte.
 *
 * It is not a style check. It is the answer to "is the thing I am looking at
 * the thing that will land in the inbox", which is the only question a preview
 * exists to answer, and which was answered wrongly for most of a day when the
 * palette was fixed on the sending side alone.
 *
 *   node scripts/check-email-parity.mjs
 *
 * firebase.json runs it as a functions predeploy hook, so a drifted preview
 * blocks the deploy rather than shipping quietly.
 *
 * Exit 0 = identical. Exit 1 = drifted, with the first differing line shown.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SENDING = join(ROOT, 'functions', 'src', 'email-template.ts');
const PREVIEW = join(
  ROOT, 'src', 'app', 'modules', 'dash', 'pages', 'settings',
  'email-campaign', 'email-shell.ts',
);

/**
 * Compiles a standalone TypeScript file and evaluates it, returning its
 * exports. Both shells are deliberately dependency-free — no Angular, no
 * firebase-admin — precisely so this can load them without a build step or a
 * stub for anything.
 */
function loadTs(file) {
  const source = readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: file,
  });

  const mod = new Module(file);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(dirname(file));
  mod._compile(outputText, file);
  return mod.exports;
}

/**
 * The bodies must contain no {{placeholders}}: the preview substitutes sample
 * data for them and the sending side receives a body whose substitution has
 * already happened upstream in send-campaign.ts. That single, intended
 * difference is the reason the input is token-free rather than the reason to
 * skip the comparison.
 */
const CASES = [
  {
    name: 'typical campaign body',
    body:
      '<p>مرحباً، هاي رسالة تجريبية.</p>' +
      '<ul><li>نقطة أولى</li><li>نقطة تانية</li></ul>' +
      '<p><a href="https://elev8club.com">رابط</a></p>',
    preheader: 'تحدي إيليف8',
  },
  {
    name: 'empty preheader falls back to the club name',
    body: '<p>نص</p>',
    preheader: '',
  },
  {
    name: 'preheader needing HTML escaping',
    body: '<p>نص</p>',
    preheader: 'Tom & Jerry <b>x</b> "q" \'p\'',
  },
  {
    name: 'custom wordmark',
    body: '<p>نص</p>',
    preheader: '',
    wordmark: 'Elev8 VIP',
  },
  {
    name: 'empty wordmark falls back to the default',
    body: '<p>نص</p>',
    preheader: '',
    wordmark: '   ',
  },
  {
    name: 'wordmark needing HTML escaping',
    body: '<p>نص</p>',
    preheader: '',
    wordmark: 'Tom & Jerry <b>x</b>',
  },
];

const sending = loadTs(SENDING);
const preview = loadTs(PREVIEW);

let failed = 0;

for (const c of CASES) {
  const sent = sending.renderEmail({ bodyHtml: c.body, preheader: c.preheader, wordmark: c.wordmark });
  const shown = preview.renderPreview(c.body, c.preheader, c.wordmark);

  if (sent === shown) {
    console.log(`  ok   ${c.name}`);
    continue;
  }

  failed++;
  console.error(`  FAIL ${c.name}`);

  const a = sent.split('\n');
  const b = shown.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    console.error(`       line ${i + 1}`);
    console.error(`         sent:    ${JSON.stringify(a[i] ?? '<missing>')}`);
    console.error(`         preview: ${JSON.stringify(b[i] ?? '<missing>')}`);
    break;
  }
}

if (failed) {
  console.error('');
  console.error('The preview does not match what gets sent.');
  console.error('Both shells must render identically:');
  console.error(`  ${SENDING}`);
  console.error(`  ${PREVIEW}`);
  process.exit(1);
}

console.log('');
console.log('Preview and sending template are byte-identical.');
