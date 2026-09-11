# Realtime Database rules

`database.rules.json` at the repo root is the **only** source of truth for the rules on
`elev8-club-3`. Deploy it with:

```
npx firebase deploy --only database --project elev8-club-3
```

`--only database` is not optional. `firebase.json` also declares `hosting` (which publishes
whatever is sitting in `dist/`) and `functions` (whose predeploy runs a lint + build). A bare
`firebase deploy` would push a stale local build over the live site.

Validate first — it costs nothing and catches a syntax error before it reaches production:

```
npx firebase deploy --only database --dry-run --project elev8-club-3
```

## Never edit the rules in the Firebase console

On 2026-09-11 the live rules were found to be, in their entirety:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "leads": { ".indexOn": ["telegramChatId", "subscriptionNumber"] }
  }
}
```

Someone had opened the console to add the two `indexOn` entries the Telegram bot needs, and in
doing so replaced the whole ruleset. The database was left **world-readable and world-writable**:
143 leads with names, emails and phone numbers readable by anyone with the URL, `dashboard_users`
readable *and writable* (so anyone could grant themselves `role: admin`), and every node
deletable by a single unauthenticated request.

The console edits the live rules directly and does not touch this file, so the repo looked
correct the whole time. Two habits prevent a repeat:

1. Change rules **here**, deploy with the command above.
2. Before deploying, read what is actually live and diff it against this file — a console edit
   made since the last deploy would otherwise be silently overwritten:

```
MSYS_NO_PATHCONV=1 npx firebase database:get "/.settings/rules" --project elev8-club-3
```

(`MSYS_NO_PATHCONV=1` is needed in Git Bash on Windows, which otherwise rewrites the leading `/`
into a Windows path and the command fails with "Path must begin with /".)

## The one rule that is not obvious

```
"leads": {
  ".read": "auth != null || ((query.orderByChild == 'subscriptionNumber' || query.orderByChild == 'telegramChatId') && query.equalTo != null)"
}
```

The bot's backend looks a lead up by its subscription number or its Telegram chat id. Whether
rules apply to it at all depends on how it connects — the Admin SDK with a service account
bypasses them entirely; a plain REST call is anonymous and is subject to them. Rather than depend
on which, this rule permits **exactly those two lookups** without authentication.

`query.equalTo != null` is the part that matters. Without it, `orderByChild('subscriptionNumber')`
with no filter would return every lead — the same full dump the rule exists to prevent.

A bare `GET /leads.json` carries no query, so it is denied. Reading a *single* lead by key stays
public (`$leadId/.read: true`) because the v2 questions page loads the lead straight out of the
`?lead=` URL parameter; that is safe for an unguessable push key.

## What was verified after the 2026-09-11 deploy

All unauthenticated, against the live database:

| | Expected | Result |
|---|---|---|
| Create a lead the way v1's landing page does | allow | 200 |
| Read one lead by key (v2 questions page) | allow | 200 |
| Query by `subscriptionNumber` + `equalTo` | allow | 200 |
| Query by `telegramChatId` + `equalTo` | allow | 200 |
| PATCH bot fields onto an existing lead | allow | 200 |
| Claim `subscription_codes/{code}` | allow | 200 |
| Overwrite a claimed code | deny | 401 |
| `GET /leads.json` (full dump) | deny | 401 |
| `GET /dashboard_users.json` | deny | 401 |
| Write to `dashboard_users` | deny | 401 |
| Delete a lead | deny | 401 |
| Delete the whole `leads` node | deny | 401 |
| Change a lead's email | deny | 401 |

The write tests used a throwaway key (`_rules_check_<timestamp>`) rather than a pushed key, so
nothing could be confused with a real lead; every one of the 143 lead keys was captured before
and compared after, and none were lost.

## `subscription_codes`

Holds the six-digit numbers handed to v2 leads for the bot. Each entry is `{ claimedAt }` and
**never the lead key** — the reasoning is in
`elev8-club-v2/docs/10-BOT-HANDOFF.md`. The parent is unreadable so the set cannot be listed;
each child is readable so the claiming transaction can check its own candidate; a child can be
created but not overwritten, which is what makes the code unique.
