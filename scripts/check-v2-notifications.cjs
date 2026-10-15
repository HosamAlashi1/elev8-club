// Offline checks: invoke the actual handlers with fake Firebase and Mailgun.
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');

// Protect the original messages except tracking options and the approved
// qualified-result subject experiment. Every body and HTML byte is preserved.
const root = path.resolve(__dirname, '..');
for (const file of ['send-v2-email.ts', 'v2-question-reminder.ts',
  'v2-qualification-email.ts', 'index.ts']) {
  const relative = `functions/src/${file}`;
  const original = execFileSync('git', ['show', `HEAD:${relative}`],
    {cwd: root, encoding: 'utf8'}).replace(/\r\n/g, '\n');
  let current = fs.readFileSync(path.join(root, relative), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace('import {disableNotificationTracking} from "./notification-mailgun-options";\n', '')
    .replace('    disableNotificationTracking(form);\n', '');
  if (file === 'v2-qualification-email.ts') {
    current = current.replace(
      'subject: "نتيجة تسجيلك ورقم اشتراكك في Elev8 Club"',
      'subject: "Congratulation 🎉 أنت الان جاهز تبدأ بمجتمع elev8 club"');
  }
  assert.equal(current, original, `${file}: original content must be preserved`);
}

const lib = path.resolve(__dirname, '../functions/lib');
let record;
let sent = [];
let updates = [];
const originalLoad = Module._load;
Module._load = function(request, parent, ...rest) {
  if (request === 'firebase-admin' && parent.filename.startsWith(lib)) {
    return {database: () => ({ref: () => ({
      get: async () => ({val: () => record}),
      update: async patch => updates.push(patch),
    })})};
  }
  return originalLoad.call(this, request, parent, ...rest);
};
const welcome = require('../functions/lib/send-v2-email');
const reminder = require('../functions/lib/v2-question-reminder');
const result = require('../functions/lib/v2-qualification-email');
Module._load = originalLoad;

const originalFetch = global.fetch;
const originalKey = process.env.MAILGUN_API_KEY;
process.env.MAILGUN_API_KEY = 'offline-test-key';
global.fetch = async (url, options) => {
  assert.equal(url, 'https://api.mailgun.net/v3/elev8club.com/messages');
  assert.equal(options.method, 'POST');
  sent.push(new URLSearchParams(options.body));
  return {ok: true, text: async () => '{}'};
};

function reset(patch = {}) {
  sent = [];
  updates = [];
  record = {
    source: 'v2', step: 1, email: 'recipient@example.invalid',
    fullName: 'سارة<img>', subscriptionNumber: '123456',
    createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    ...patch,
  };
}

function checkDelivery(expectedUrl, expectedLinks = 1) {
  assert.equal(sent.length, 1);
  const mail = sent[0];
  assert.equal(mail.get('to'), record.email);
  for (const option of ['o:tracking', 'o:tracking-clicks', 'o:tracking-opens']) {
    assert.equal(mail.get(option), expectedUrl ? 'no' : null);
  }
  const html = mail.get('html');
  const text = mail.get('text');
  assert.ok(text && html);
  assert.match(html, /<table/);
  assert.match(html, /linear-gradient/);
  assert.match(html, /dir="rtl"/);
  assert.equal((html.match(/<a /g) || []).length, expectedUrl ? expectedLinks : 0);
  if (expectedUrl) {
    assert.ok(text.includes(expectedUrl));
    assert.ok(html.includes(`href="${expectedUrl}"`));
  }
  assert.equal(updates.length, 1);
}

async function main() {
  reset();
  const event = {params: {leadId: 'offline-lead-123'}, data: {val: () => record}};
  await welcome.sendV2Email.run(event);
  checkDelivery();
  assert.equal(updates[0].v2EmailSent, true);
  reset({v2EmailSent: true});
  await welcome.sendV2Email.run(event);
  assert.equal(sent.length, 0);
  reset({source: 'v1'});
  await welcome.sendV2Email.run(event);
  assert.equal(sent.length, 0);

  reset();
  const task = {data: {leadId: 'offline-lead-123'}};
  await reminder.sendV2QuestionReminder.run(task);
  checkDelivery(reminder.v2QuestionUrl(task.data.leadId));
  assert.equal(updates[0].v2QuestionReminderSent, true);
  for (const patch of [{step: 2}, {v2QuestionReminderSent: true}, {source: 'v1'}]) {
    reset(patch);
    await reminder.sendV2QuestionReminder.run(task);
    assert.equal(sent.length, 0);
  }
  reset({createdAt: new Date().toISOString()});
  await assert.rejects(reminder.sendV2QuestionReminder.run(task), /early/);
  assert.equal(sent.length, 0);

  for (const qualification of ['qualified', 'qualified_prep', 'not_qualified']) {
    reset({step: 2, qualification});
    const updateEvent = {params: event.params, data: {
      before: {val: () => ({source: 'v2', step: 1})},
      after: {val: () => record},
    }};
    await result.sendV2QualificationEmail.run(updateEvent);
    if (qualification === 'qualified') {
      assert.equal(sent[0].get('subject'),
        'نتيجة تسجيلك ورقم اشتراكك في Elev8 Club');
    }
    checkDelivery(qualification === 'not_qualified' ?
      'https://t.me/elev8clubplas' : 'https://t.me/elev8_club_community_bot',
    qualification === 'not_qualified' ? 2 : 1);
    assert.match(sent[0].get('html'), /سارة&lt;img&gt;/);
    if (qualification === 'not_qualified') {
      assert.ok(!sent[0].get('text').includes('123456'));
    } else {
      assert.match(sent[0].get('html'), /<strong dir="ltr"[^>]*>123456<\/strong>/);
    }
    assert.equal(updates[0].v2ResultEmailSent, true);
    record.v2ResultEmailSent = true;
    sent = [];
    await result.sendV2QualificationEmail.run(updateEvent);
    assert.equal(sent.length, 0);
  }
  console.log('V2 notifications passed: delivery payloads, three outcomes, RTL,');
  console.log('escaping, tracking overrides, sent guards and reminder timing.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.MAILGUN_API_KEY;
  else process.env.MAILGUN_API_KEY = originalKey;
});
