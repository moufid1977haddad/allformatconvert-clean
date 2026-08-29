# Quota and Spend-Cap Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the server-side barrier — global spend cap with real-cost reconciliation, per-IP rate limiting, and a per-user-quota primitive — that protects every paid provider call (OpenAI, remove.bg, pre-provisioned Adobe) before the Product Hunt launch. No new tools are built; `pdf-to-excel`, `pdf-to-ppt`, `image-generator` stay "Coming Soon."

**Architecture:** One Postgres table (`usage_counters`) and three SQL functions (`increment_usage_counter`, `decrement_usage_counter`, `adjust_usage_counter`) provide a single atomic reserve/release/reconcile primitive reused by all three layers. A second table (`usage_events`) is an append-only observability log. A `lib/quota/` module tree wraps these primitives; a `guardPaidRoute()` orchestrator wraps the 4 existing shared OpenAI/remove.bg routes.

**Tech Stack:** Next.js App Router (existing), Supabase Postgres via `@supabase/supabase-js` service-role client (existing pattern from `contact_messages`), no new dependencies.

**Spec:** `docs/specs/2026-08-28-quota-spend-limits-design.md` — this plan implements every section; read it alongside this plan.

**Progress (2026-08-29):** Tasks 0-8 complete and review-clean (schema, all `lib/quota/` primitives, the `guardPaidRoute` orchestrator) — see `.superpowers/sdd/2026-08-28-quota-spend-limits-plan/progress.md` for the full ledger, including two real bugs the review loop caught and fixed (a Postgres cap check that silently skipped a brand-new bucket; an ESM-module-namespace monkeypatch that silently no-oped) plus a financial-correctness fix (alert-check failures could orphan a reservation). Stopped here per the mandatory gate before Task 9 touches the first of the 4 existing production routes.

## Global Constraints

- All new Supabase tables get `alter table ... enable row level security` with **no policies** (service-role only), and all new RPC functions get `revoke execute ... from public, anon, authenticated` (spec §2).
- Atomicity is via `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE ... RETURNING` — never a read followed by a write (spec §3).
- Status codes: **429** (IP hour/day, `Retry-After` header) / **503** (global spend, Adobe counter, `Retry-After` header) / **403** (per-user quota, body states balance + reset date, no `Retry-After`) (spec §5).
- Global-cap and Adobe-cap denial messages must never imply the visitor did something wrong (spec §5.1).
- IP addresses are sha256-hashed before ever reaching the database (spec §2).
- **`lib/quota/*.js` files use CommonJS (`require`/`module.exports`), not ESM `import`/`export`.** This repo's other `lib/*.js` files (e.g. `lib/supabase.js`) use ESM syntax that only runs through Next's bundler — fine for code only ever imported by Next routes, but this plan's verification steps run `lib/quota/` modules directly via plain `node`, which cannot parse ESM syntax in a `.js` file when `package.json` has no `"type": "module"` (confirmed: it doesn't). CommonJS avoids this — Next's TS/ESM route files import CJS modules via `esModuleInterop` without any special handling, and the same files run unmodified via `node scripts/quota-tests/foo.js`.
- `lib/quota/*.js` files import each other via **relative paths** (`require('./counters')`), never the `@/` alias — the alias is a Next-specific `tsconfig.json` path mapping that plain `node` doesn't resolve.
- `lib/quota/limits.js` has zero `process.env` reads and zero server-only imports — it's imported by client components (`'use client'` pages) as well as server routes.
- **`SUPABASE_SERVICE_ROLE_KEY` never enters the implementer's or controller's working environment — no exception, permanent rule (ruled 2026-08-28, see ledger).** It is never written to `.env.local` or any other file either agent can read, and never pasted into chat. Consequence: no implementer or reviewer subagent runs any script that touches `usage_counters`/`usage_events` via `supabaseAdmin`. Every `scripts/quota-tests/*.js` file reads Supabase credentials **only** from `process.env` (no `.env.local` file loader, no `_env.js` helper — that step from Task 2 is dropped) and is written, but never executed, by the implementer. The controller hands the exact `SUPABASE_SERVICE_ROLE_KEY=... node scripts/quota-tests/NN-name.js` command to the user, who runs it in their own terminal (never through the agent's Bash tool) and pastes back the output. That pasted output — not an agent's own run — is the live-verification evidence for marking a task's ledger line complete. The same applies to Task 1's SQL: the implementer writes the `.sql` files; the user applies them via the Supabase SQL Editor and confirms. It also applies to every "manual verification" step elsewhere in this plan that exercises a `guardPaidRoute`-wrapped route or any other service-role-backed behavior (Tasks 9-17) — those are relayed to the user the same way; only purely client-side checks that make zero network calls may be verified directly by the controller or an implementer.
- No content, file bytes, or prompt/response text is ever written to `usage_counters` or `usage_events` — only the metrics named in the spec.
- Config values (caps) come from env vars with the exact names in spec §7; nothing is hardcoded in business logic.

---

## Task 0: Safety tag and local secrets

**Files:** none (environment setup only)

- [x] **Step 1: Tag the pre-change state**

```bash
git tag pre-quota-infra-2026-08-28
```

- [x] **Step 2: Confirm `SUPABASE_SERVICE_ROLE_KEY` is available locally**

`.env.local` currently only has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the service-role key needed for every quota primitive isn't there yet. If the Vercel CLI isn't installed (`vercel --version` fails), install it (`npm i -g vercel`), then run:

```bash
vercel env pull .env.local --environment=preview
```

Confirm `SUPABASE_SERVICE_ROLE_KEY` and `NTFY_TOPIC` now appear in `.env.local` (check names only, never print values):

```bash
grep -oE "^[A-Z_]+=" .env.local | sort -u
```

- [x] **Step 3: No commit for this task** (environment-only, nothing to version).

---

## Task 1: Supabase schema — `usage_counters`, `usage_events`, RPC functions

**Files:**
- Create: `supabase/usage_counters.sql`
- Create: `supabase/usage_events.sql`
- Test: `scripts/quota-tests/00-schema.js`

**Interfaces:**
- Produces: table `usage_counters(bucket_key text, period_key text, value bigint, updated_at timestamptz)`, PK `(bucket_key, period_key)`; table `usage_events(id, created_at, route, tool, outcome, estimated_cost_cents, account_id)`; RPC functions `increment_usage_counter(p_bucket_key, p_period_key, p_amount, p_cap) returns table(new_value bigint, allowed boolean)`, `decrement_usage_counter(p_bucket_key, p_period_key, p_amount) returns void`, `adjust_usage_counter(p_bucket_key, p_period_key, p_delta) returns bigint`.

- [x] **Step 1: Write `supabase/usage_counters.sql`**

```sql
-- The single atomic-capped-counter primitive behind all three layers: global
-- spend, the Adobe transaction counter, per-user quotas, per-IP rate limits,
-- and the exactly-once-per-threshold alert flags all reuse this one table
-- and function pair. See docs/specs/2026-08-28-quota-spend-limits-design.md.
create table if not exists usage_counters (
  bucket_key  text not null,
  period_key  text not null,
  value       bigint not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (bucket_key, period_key)
);
alter table usage_counters enable row level security;
-- No policies added: only the service role (used server-side in lib/quota/*)
-- can read/write this table.

create or replace function increment_usage_counter(
  p_bucket_key text, p_period_key text, p_amount bigint, p_cap bigint
) returns table(new_value bigint, allowed boolean)
language sql as $$
  -- The `where p_amount <= p_cap` on the SELECT gates the plain-INSERT path
  -- (a brand-new bucket_key/period_key -- true for every first request of
  -- every new hour/day/month bucket, i.e. routine, not an edge case), and
  -- the `where` on DO UPDATE gates the conflict path. Without the first
  -- one, a fresh bucket's opening request bypassed the cap entirely
  -- (caught in Task 1 review, 2026-08-28 -- see ledger). Safe to add: since
  -- decrement/adjust both clamp at 0, stored value is always >= 0, so
  -- `p_amount <= p_cap` failing implies `existing.value + p_amount <= p_cap`
  -- also fails -- this can only narrow, never change, the conflict path's
  -- own outcome.
  with upsert as (
    insert into usage_counters (bucket_key, period_key, value)
    select p_bucket_key, p_period_key, p_amount
    where p_amount <= p_cap
    on conflict (bucket_key, period_key) do update
      set value = usage_counters.value + p_amount, updated_at = now()
      where usage_counters.value + p_amount <= p_cap
    returning value
  )
  select
    coalesce((select value from upsert), (select value from usage_counters where bucket_key = p_bucket_key and period_key = p_period_key), 0),
    exists(select 1 from upsert);
$$;

create or replace function decrement_usage_counter(
  p_bucket_key text, p_period_key text, p_amount bigint
) returns void
language sql as $$
  update usage_counters
     set value = greatest(value - p_amount, 0), updated_at = now()
   where bucket_key = p_bucket_key and period_key = p_period_key;
$$;

-- Post-hoc correction after a real cost is known. Unconditional by design: a
-- reconciliation must never fail even if it pushes the counter over cap -- it
-- is recording what already happened, not gating a new request.
create or replace function adjust_usage_counter(
  p_bucket_key text, p_period_key text, p_delta bigint
) returns bigint
language sql as $$
  insert into usage_counters (bucket_key, period_key, value)
  values (p_bucket_key, p_period_key, greatest(p_delta, 0))
  on conflict (bucket_key, period_key) do update
    set value = greatest(usage_counters.value + p_delta, 0), updated_at = now()
  returning value;
$$;

revoke execute on function increment_usage_counter, decrement_usage_counter, adjust_usage_counter
  from public, anon, authenticated;
```

- [x] **Step 2: Write `supabase/usage_events.sql`**

```sql
-- Append-only observability log. Never used for enforcement (usage_counters
-- is the sole source of truth for caps) -- this is what the daily digest
-- reads for "top 3 tools" and refusal counts. Every attempt is logged,
-- accepted or denied.
create table if not exists usage_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  route text not null,
  tool  text,
  outcome text not null check (outcome in (
    'accepted', 'denied_ip_hour', 'denied_ip_day', 'denied_global_spend',
    'denied_adobe_cap', 'denied_user_quota', 'provider_failed'
  )),
  estimated_cost_cents integer not null default 0,
  account_id uuid
);
alter table usage_events enable row level security;
create index if not exists usage_events_created_at_idx on usage_events (created_at);
create index if not exists usage_events_tool_idx on usage_events (tool, created_at);
```

- [x] **Step 3: Apply both files to Supabase**

Open the Supabase project's SQL Editor (same place `supabase/contact_messages.sql` was applied) and run both files' contents, in order (`usage_counters.sql` first — `usage_events.sql` has no dependency on it, but keep the order for readability).

- [x] **Step 4: Write and run the schema verification script**

```js
// scripts/quota-tests/00-schema.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv-fallback')(); // see note below if this fails
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const testBucket = 'test:schema-check';
  const testPeriod = '2000-01';

  const inc = await admin.rpc('increment_usage_counter', {
    p_bucket_key: testBucket, p_period_key: testPeriod, p_amount: 3, p_cap: 10,
  });
  if (inc.error) throw new Error('increment_usage_counter failed: ' + inc.error.message);
  const row = inc.data[0];
  if (row.new_value !== 3 || row.allowed !== true) throw new Error('unexpected increment result: ' + JSON.stringify(row));

  const capped = await admin.rpc('increment_usage_counter', {
    p_bucket_key: testBucket, p_period_key: testPeriod, p_amount: 100, p_cap: 10,
  });
  if (capped.error) throw new Error(capped.error.message);
  if (capped.data[0].allowed !== false) throw new Error('expected cap to block a 100-unit increment on a cap of 10');

  const dec = await admin.rpc('decrement_usage_counter', { p_bucket_key: testBucket, p_period_key: testPeriod, p_amount: 3 });
  if (dec.error) throw new Error(dec.error.message);

  const adj = await admin.rpc('adjust_usage_counter', { p_bucket_key: testBucket, p_period_key: testPeriod, p_delta: -5 });
  if (adj.error) throw new Error(adj.error.message);
  if (adj.data !== 0) throw new Error('expected adjust to clamp at 0, got ' + adj.data);

  await admin.from('usage_counters').delete().eq('bucket_key', testBucket);

  const eventInsert = await admin.from('usage_events').insert({ route: 'test', tool: 'test', outcome: 'accepted', estimated_cost_cents: 1 });
  if (eventInsert.error) throw new Error('usage_events insert failed: ' + eventInsert.error.message);
  await admin.from('usage_events').delete().eq('route', 'test');

  console.log('PASS: schema, RPC functions, and grants all behave as designed.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
```

Since this repo has no `dotenv` package, load `.env.local` manually instead of the `require('dotenv-fallback')()` placeholder above — replace that line with:

```js
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = process.env[m[1]] || m[2];
});
```

Run: `node scripts/quota-tests/00-schema.js`
Expected: `PASS: schema, RPC functions, and grants all behave as designed.`

- [x] **Step 5: Commit**

```bash
git add supabase/usage_counters.sql supabase/usage_events.sql scripts/quota-tests/00-schema.js
git commit -m "feat(quota): add usage_counters/usage_events schema and atomic RPC functions"
```

---

## Task 2: Core primitives — env loading, period keys, IP hashing, Supabase admin client, counter wrapper

**Files:**
- Create: `scripts/quota-tests/_env.js` (shared env loader for every test script in this plan)
- Create: `lib/quota/supabaseAdmin.js`
- Create: `lib/quota/period.js`
- Create: `lib/quota/ipHash.js`
- Create: `lib/quota/counters.js`
- Test: `scripts/quota-tests/01-period.js`
- Test: `scripts/quota-tests/02-counters.js`

**Interfaces:**
- Produces: `supabaseAdmin` (Supabase client, service role); `currentUtcMonthKey(now?)`, `currentUtcDayKey(now?)`, `currentUtcHourKey(now?)`, `secondsUntilNextUtcMonth(now?)`, `secondsUntilNextUtcHour(now?)`, `secondsUntilNextUtcDay(now?)`, `nextUtcMonthIso(now?)`; `hashIp(ip)`, `getClientIp(req)`; `incrementCounter(bucketKey, periodKey, amount, cap)` → `{newValue, allowed}`, `decrementCounter(bucketKey, periodKey, amount)` → `void`, `adjustCounter(bucketKey, periodKey, delta)` → `newValue`.

- [x] **Step 1: Write the shared test env loader**

```js
// scripts/quota-tests/_env.js
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = process.env[m[1]] || m[2];
});
```

(Retroactively, Task 1's Step 4 script should `require('./_env')` instead of inlining the loader — update `scripts/quota-tests/00-schema.js` to replace its inline loader with `require('./_env');` at this point.)

- [x] **Step 2: Write `lib/quota/supabaseAdmin.js`**

```js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

module.exports = { supabaseAdmin };
```

- [x] **Step 3: Write `lib/quota/period.js`**

```js
function pad(n) { return String(n).padStart(2, '0'); }

function currentUtcMonthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`;
}

function currentUtcDayKey(now = new Date()) {
  return `${currentUtcMonthKey(now)}-${pad(now.getUTCDate())}`;
}

function currentUtcHourKey(now = new Date()) {
  return `${currentUtcDayKey(now)}T${pad(now.getUTCHours())}`;
}

function nextUtcMonthDate(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
}

function nextUtcMonthIso(now = new Date()) {
  return nextUtcMonthDate(now).toISOString();
}

function secondsUntilNextUtcMonth(now = new Date()) {
  return Math.max(1, Math.round((nextUtcMonthDate(now).getTime() - now.getTime()) / 1000));
}

function secondsUntilNextUtcHour(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1, 0, 0));
  return Math.max(1, Math.round((next.getTime() - now.getTime()) / 1000));
}

function secondsUntilNextUtcDay(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(1, Math.round((next.getTime() - now.getTime()) / 1000));
}

module.exports = {
  currentUtcMonthKey, currentUtcDayKey, currentUtcHourKey,
  nextUtcMonthIso, secondsUntilNextUtcMonth, secondsUntilNextUtcHour, secondsUntilNextUtcDay,
};
```

- [x] **Step 4: Write `lib/quota/ipHash.js`**

```js
const { createHash } = require('node:crypto');

function hashIp(ip) {
  return createHash('sha256').update(ip).digest('hex');
}

// req is a Next.js NextRequest (Headers has a .get method). Returns null if
// no forwarded-for header is present -- callers fall back to a shared
// 'unknown-ip' bucket rather than skipping the rate-limit check entirely.
function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (!xff) return null;
  const first = xff.split(',')[0].trim();
  return first || null;
}

module.exports = { hashIp, getClientIp };
```

- [x] **Step 5: Write `lib/quota/counters.js`**

```js
const { supabaseAdmin } = require('./supabaseAdmin');

async function incrementCounter(bucketKey, periodKey, amount, cap) {
  const { data, error } = await supabaseAdmin.rpc('increment_usage_counter', {
    p_bucket_key: bucketKey, p_period_key: periodKey, p_amount: amount, p_cap: cap,
  });
  if (error) throw new Error(`increment_usage_counter failed: ${error.message}`);
  const row = data && data[0];
  return { newValue: Number((row && row.new_value) || 0), allowed: !!(row && row.allowed === true) };
}

async function decrementCounter(bucketKey, periodKey, amount) {
  const { error } = await supabaseAdmin.rpc('decrement_usage_counter', {
    p_bucket_key: bucketKey, p_period_key: periodKey, p_amount: amount,
  });
  if (error) throw new Error(`decrement_usage_counter failed: ${error.message}`);
}

async function adjustCounter(bucketKey, periodKey, delta) {
  const { data, error } = await supabaseAdmin.rpc('adjust_usage_counter', {
    p_bucket_key: bucketKey, p_period_key: periodKey, p_delta: delta,
  });
  if (error) throw new Error(`adjust_usage_counter failed: ${error.message}`);
  return Number(data || 0);
}

module.exports = { incrementCounter, decrementCounter, adjustCounter };
```

- [x] **Step 6: Write and run the period-keys test**

```js
// scripts/quota-tests/01-period.js
const assert = require('node:assert');
const { currentUtcMonthKey, currentUtcDayKey, currentUtcHourKey, secondsUntilNextUtcMonth, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('../../lib/quota/period');

const fixedNow = new Date(Date.UTC(2026, 7, 28, 14, 30, 0)); // 2026-08-28T14:30:00Z

assert.strictEqual(currentUtcMonthKey(fixedNow), '2026-08');
assert.strictEqual(currentUtcDayKey(fixedNow), '2026-08-28');
assert.strictEqual(currentUtcHourKey(fixedNow), '2026-08-28T14');
assert.strictEqual(secondsUntilNextUtcHour(fixedNow), 30 * 60);
assert.strictEqual(secondsUntilNextUtcDay(fixedNow), (9 * 3600 + 30 * 60));
const expectedMonthSeconds = Math.round((Date.UTC(2026, 8, 1, 0, 0, 0) - fixedNow.getTime()) / 1000);
assert.strictEqual(secondsUntilNextUtcMonth(fixedNow), expectedMonthSeconds);

console.log('PASS: period key and reset-countdown helpers.');
```

Run: `node scripts/quota-tests/01-period.js`
Expected: FAIL first (files don't exist yet if run before Step 3) — since Steps 3-5 already ran above, this should now PASS directly. Run it and confirm `PASS: period key and reset-countdown helpers.`

- [x] **Step 7: Write and run the counters integration test**

```js
// scripts/quota-tests/02-counters.js
require('./_env');
const assert = require('node:assert');
const { incrementCounter, decrementCounter, adjustCounter } = require('../../lib/quota/counters');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');

async function main() {
  const bucket = 'test:counters-' + Date.now();
  const period = '2000-01';

  const first = await incrementCounter(bucket, period, 4, 10);
  assert.strictEqual(first.newValue, 4);
  assert.strictEqual(first.allowed, true);

  const second = await incrementCounter(bucket, period, 4, 10);
  assert.strictEqual(second.newValue, 8);
  assert.strictEqual(second.allowed, true);

  const blocked = await incrementCounter(bucket, period, 4, 10);
  assert.strictEqual(blocked.allowed, false);
  assert.strictEqual(blocked.newValue, 8, 'a blocked increment must not change the stored value');

  await decrementCounter(bucket, period, 3);
  const afterDecrement = await incrementCounter(bucket, period, 0, 10);
  assert.strictEqual(afterDecrement.newValue, 5);

  const reconciled = await adjustCounter(bucket, period, -5);
  assert.strictEqual(reconciled, 0);

  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucket);
  console.log('PASS: counters.js wraps the RPC functions correctly.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
```

Run: `node scripts/quota-tests/02-counters.js`
Expected: `PASS: counters.js wraps the RPC functions correctly.`

- [x] **Step 8: Commit**

```bash
git add scripts/quota-tests lib/quota/supabaseAdmin.js lib/quota/period.js lib/quota/ipHash.js lib/quota/counters.js
git commit -m "feat(quota): add core primitives (period keys, IP hashing, counter wrapper)"
```

---

## Task 3: Configuration modules — `config.js` (server-only caps/costs) and `limits.js` (client-safe input bounds)

**Files:**
- Create: `lib/quota/limits.js`
- Create: `lib/quota/config.js`
- Test: `scripts/quota-tests/03-config.js`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: `MAX_PROMPT_CHARS`, `MAX_VISION_IMAGE_BYTES`, `MAX_AUDIO_UPLOAD_BYTES`, `MAX_REMOVEBG_IMAGE_BYTES`, `checkPromptLength(text)` → `{ok, message?}`, `checkFileSize(file, maxBytes, label)` → `{ok, message?}` (all from `limits.js`); `GLOBAL_SPEND_CAP_CENTS`, `ADOBE_TX_CAP`, `USER_QUOTA_PDF_CONVERSIONS`, `USER_QUOTA_IMAGES`, `IP_RATE_LIMIT_PER_HOUR`, `IP_RATE_LIMIT_PER_DAY`, `WORST_CASE_COST_CENTS` (object keyed `ai`/`ai-vision`/`ai-transcribe`/`remove-bg`), `actualAiCostCents(usage)`, `actualAiTranscribeCostCents(durationSeconds)` (all from `config.js`).

- [x] **Step 1: Write `lib/quota/limits.js`**

```js
// Client-safe: no process.env reads, no server-only imports. Imported by
// both the guarded API routes (authoritative enforcement) and the tool
// pages themselves (client-side pre-upload UX, spec §4.2.1).

const MAX_PROMPT_CHARS = 8000; // ~2,000 tokens
const MAX_VISION_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024; // see spec §4.2 "Why 10 MB, not OpenAI's own 25 MB ceiling"
const MAX_REMOVEBG_IMAGE_BYTES = 12 * 1024 * 1024;

function checkPromptLength(text) {
  const length = (text || '').length;
  if (length <= MAX_PROMPT_CHARS) return { ok: true };
  return {
    ok: false,
    message: `Text is limited to ${MAX_PROMPT_CHARS.toLocaleString()} characters — this input is ${length.toLocaleString()}.`,
  };
}

function checkFileSize(file, maxBytes, label) {
  if (!file || file.size <= maxBytes) return { ok: true };
  const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
  const fileMb = (file.size / (1024 * 1024)).toFixed(1);
  return { ok: false, message: `${label} are limited to ${maxMb} MB — this file is ${fileMb} MB.` };
}

module.exports = {
  MAX_PROMPT_CHARS, MAX_VISION_IMAGE_BYTES, MAX_AUDIO_UPLOAD_BYTES, MAX_REMOVEBG_IMAGE_BYTES,
  checkPromptLength, checkFileSize,
};
```

- [x] **Step 2: Write `lib/quota/config.js`**

```js
// Server-only: reads process.env. Never imported by a 'use client' page --
// client components import lib/quota/limits.js instead.
const { MAX_PROMPT_CHARS, MAX_AUDIO_UPLOAD_BYTES } = require('./limits');

const GLOBAL_SPEND_CAP_CENTS = Math.round(Number(process.env.GLOBAL_SPEND_CAP_USD || 20) * 100);
const ADOBE_TX_CAP = Number(process.env.ADOBE_TX_CAP || 450);
const USER_QUOTA_PDF_CONVERSIONS = Number(process.env.USER_QUOTA_PDF_CONVERSIONS || 5);
const USER_QUOTA_IMAGES = Number(process.env.USER_QUOTA_IMAGES || 5);
const IP_RATE_LIMIT_PER_HOUR = Number(process.env.IP_RATE_LIMIT_PER_HOUR || 10);
const IP_RATE_LIMIT_PER_DAY = Number(process.env.IP_RATE_LIMIT_PER_DAY || 30);

const ALERT_THRESHOLDS = [50, 80, 100];

// gpt-4o-mini list pricing (2026-08, per spec §4.3 -- flagged there for the
// user to confirm against their actual billing tier before launch).
const GPT4O_MINI_INPUT_PER_TOKEN = 0.15 / 1_000_000;
const GPT4O_MINI_OUTPUT_PER_TOKEN = 0.60 / 1_000_000;
const WHISPER_PER_MINUTE = 0.006;
const REMOVEBG_PER_IMAGE_DOLLARS = 0.20;

const CHARS_PER_TOKEN = 4; // standard conservative approximation for English text
const AI_MAX_OUTPUT_TOKENS = 1000; // matches max_tokens in app/api/ai/route.ts
const AI_VISION_MAX_OUTPUT_TOKENS = 500; // matches max_tokens in app/api/ai-vision/route.ts
// A high-detail image at typical online-tool resolutions costs at most
// ~1500 tokens under OpenAI's image-tokenization formula -- used as the
// worst case since the byte-size bound doesn't fix a specific resolution.
const VISION_IMAGE_WORST_CASE_TOKENS = 1500;
// Conservative floor: real-world speech audio rarely encodes below ~32kbps;
// a LOWER assumed bitrate yields a LONGER worst-case duration for the same
// file size, which is the conservative (safe) direction for a reservation.
const AUDIO_WORST_CASE_BITRATE_KBPS = 32;

function dollarsToCents(dollars) {
  return Math.ceil(dollars * 100);
}

function worstCaseAiCostCents() {
  const inputTokens = MAX_PROMPT_CHARS / CHARS_PER_TOKEN;
  return dollarsToCents(inputTokens * GPT4O_MINI_INPUT_PER_TOKEN + AI_MAX_OUTPUT_TOKENS * GPT4O_MINI_OUTPUT_PER_TOKEN);
}

function worstCaseAiVisionCostCents() {
  const inputTokens = MAX_PROMPT_CHARS / CHARS_PER_TOKEN + VISION_IMAGE_WORST_CASE_TOKENS;
  return dollarsToCents(inputTokens * GPT4O_MINI_INPUT_PER_TOKEN + AI_VISION_MAX_OUTPUT_TOKENS * GPT4O_MINI_OUTPUT_PER_TOKEN);
}

function worstCaseAudioSeconds() {
  const bytesPerSecond = (AUDIO_WORST_CASE_BITRATE_KBPS * 1000) / 8;
  return MAX_AUDIO_UPLOAD_BYTES / bytesPerSecond;
}

function worstCaseAiTranscribeCostCents() {
  const minutes = worstCaseAudioSeconds() / 60;
  return dollarsToCents(minutes * WHISPER_PER_MINUTE);
}

function worstCaseRemoveBgCostCents() {
  return dollarsToCents(REMOVEBG_PER_IMAGE_DOLLARS);
}

const WORST_CASE_COST_CENTS = {
  ai: worstCaseAiCostCents(),
  'ai-vision': worstCaseAiVisionCostCents(),
  'ai-transcribe': worstCaseAiTranscribeCostCents(),
  'remove-bg': worstCaseRemoveBgCostCents(),
};

function actualAiCostCents(usage) {
  const promptTokens = (usage && usage.prompt_tokens) || 0;
  const completionTokens = (usage && usage.completion_tokens) || 0;
  return dollarsToCents(promptTokens * GPT4O_MINI_INPUT_PER_TOKEN + completionTokens * GPT4O_MINI_OUTPUT_PER_TOKEN);
}

function actualAiTranscribeCostCents(durationSeconds) {
  const minutes = (durationSeconds || 0) / 60;
  return dollarsToCents(minutes * WHISPER_PER_MINUTE);
}

module.exports = {
  GLOBAL_SPEND_CAP_CENTS, ADOBE_TX_CAP, USER_QUOTA_PDF_CONVERSIONS, USER_QUOTA_IMAGES,
  IP_RATE_LIMIT_PER_HOUR, IP_RATE_LIMIT_PER_DAY, ALERT_THRESHOLDS,
  WORST_CASE_COST_CENTS, actualAiCostCents, actualAiTranscribeCostCents,
};
```

- [x] **Step 3: Write and run the config test**

```js
// scripts/quota-tests/03-config.js
const assert = require('node:assert');
const { checkPromptLength, checkFileSize, MAX_PROMPT_CHARS, MAX_AUDIO_UPLOAD_BYTES } = require('../../lib/quota/limits');
const { WORST_CASE_COST_CENTS, actualAiCostCents, actualAiTranscribeCostCents, GLOBAL_SPEND_CAP_CENTS } = require('../../lib/quota/config');

assert.strictEqual(checkPromptLength('a'.repeat(MAX_PROMPT_CHARS)).ok, true);
assert.strictEqual(checkPromptLength('a'.repeat(MAX_PROMPT_CHARS + 1)).ok, false);

assert.strictEqual(checkFileSize({ size: MAX_AUDIO_UPLOAD_BYTES }, MAX_AUDIO_UPLOAD_BYTES, 'Audio files').ok, true);
assert.strictEqual(checkFileSize({ size: MAX_AUDIO_UPLOAD_BYTES + 1 }, MAX_AUDIO_UPLOAD_BYTES, 'Audio files').ok, false);

// The worst-case reservation for a single transcribe call must stay well
// under the global cap -- this is the exact regression this bound exists to
// prevent (spec §4.2 "Why 10 MB, not OpenAI's own 25 MB ceiling").
assert.ok(WORST_CASE_COST_CENTS['ai-transcribe'] < GLOBAL_SPEND_CAP_CENTS / 10,
  `a single worst-case transcribe reservation (${WORST_CASE_COST_CENTS['ai-transcribe']}c) should allow at least 10 calls/month under the cap (${GLOBAL_SPEND_CAP_CENTS}c)`);

assert.strictEqual(actualAiCostCents({ prompt_tokens: 0, completion_tokens: 0 }), 0);
assert.ok(actualAiCostCents({ prompt_tokens: 1000, completion_tokens: 1000 }) > 0);
assert.ok(actualAiTranscribeCostCents(120) > 0);

console.log('PASS: config.js cost formulas and limits.js client checks.', WORST_CASE_COST_CENTS);
```

Run: `node scripts/quota-tests/03-config.js`
Expected: `PASS: ...` line, printing the worst-case cost table.

- [x] **Step 4: Commit**

```bash
git add lib/quota/limits.js lib/quota/config.js scripts/quota-tests/03-config.js
git commit -m "feat(quota): add config.js (caps, cost table) and limits.js (input bounds)"
```

---

## Task 4: Alert-threshold primitive

**Files:**
- Create: `lib/quota/alerts.js`
- Test: `scripts/quota-tests/04-alerts.js`

**Interfaces:**
- Consumes: `incrementCounter` (Task 2), `sendAlert` (existing `lib/alert.js`).
- Produces: `checkAndAlertThresholds({ counterName, periodKey, value, cap })` → `void`.

- [x] **Step 1: Write `lib/quota/alerts.js`**

```js
const { incrementCounter } = require('./counters');
const { ALERT_THRESHOLDS } = require('./config');
const { sendAlert } = require('../alert');

// Threshold-crossing is itself a capped-at-1 counter increment: if it
// succeeds (flag was 0, now 1), this is the first time this threshold was
// crossed this period -- send the alert. If it fails (already 1), skip
// silently. Exactly-once per threshold per period, no separate bookkeeping.
//
// sendAlertFn is injectable (defaults to the real sendAlert) so tests can
// pass a stub instead of the real function. This isn't just a testing nicety:
// `lib/alert.js` uses ESM `export` syntax, so `require('../alert')` returns a
// module namespace object whose properties are non-writable by spec --
// `alertModule.sendAlert = stub` silently no-ops (verified 2026-08-28, see
// ledger) rather than throwing, so a monkeypatch-based test would always
// exercise the REAL sendAlert and either fail or send genuine ntfy alerts.
// Passing the stub as an argument sidesteps that entirely.
async function checkAndAlertThresholds({ counterName, periodKey, value, cap }, sendAlertFn = sendAlert) {
  if (cap <= 0) return;
  const pct = (value / cap) * 100;
  for (const threshold of ALERT_THRESHOLDS) {
    if (pct < threshold) continue;
    const flagBucket = `alert_sent:${counterName}:${threshold}`;
    const { allowed } = await incrementCounter(flagBucket, periodKey, 1, 1);
    if (allowed) {
      await sendAlertFn(counterName, `${threshold}pct_of_cap_${value}_of_${cap}`);
    }
  }
}

module.exports = { checkAndAlertThresholds };
```

- [x] **Step 2: Write and run the alerts test**

This test passes a stub `sendAlertFn` directly into `checkAndAlertThresholds` (see the comment above — monkeypatching `lib/alert.js`'s export does not work, since `require()` of an ESM module returns a non-writable namespace object).

```js
// scripts/quota-tests/04-alerts.js
const assert = require('node:assert');
const { checkAndAlertThresholds } = require('../../lib/quota/alerts');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');

const sent = [];
const stubSendAlert = async (service, status) => { sent.push({ service, status }); };

async function main() {
  const counterName = 'test-alert-' + Date.now();
  const period = '2000-01';

  try {
    await checkAndAlertThresholds({ counterName, periodKey: period, value: 40, cap: 100 }, stubSendAlert); // 40% -- no threshold crossed
    assert.strictEqual(sent.length, 0, 'no alert should fire below 50%');

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 55, cap: 100 }, stubSendAlert); // crosses 50%
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].service, counterName);

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 60, cap: 100 }, stubSendAlert); // still only past 50%, already sent
    assert.strictEqual(sent.length, 1, 'the 50% alert must not fire twice');

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 85, cap: 100 }, stubSendAlert); // crosses 80%
    assert.strictEqual(sent.length, 2);

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 100, cap: 100 }, stubSendAlert); // crosses 100%
    assert.strictEqual(sent.length, 3);

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 100, cap: 100 }, stubSendAlert); // repeat call at same value
    assert.strictEqual(sent.length, 3, 'no threshold should re-fire on a repeat call');

    console.log('PASS: alert thresholds fire exactly once each, in order 50/80/100.');
  } finally {
    await supabaseAdmin.from('usage_counters').delete().like('bucket_key', `alert_sent:${counterName}:%`);
  }
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
```

Run: `node scripts/quota-tests/04-alerts.js`
Expected: `PASS: alert thresholds fire exactly once each, in order 50/80/100.`

This directly proves spec verification #5 (§10.5) — keep this script; it's referenced again in Task 12.

- [x] **Step 3: Commit**

```bash
git add lib/quota/alerts.js scripts/quota-tests/04-alerts.js
git commit -m "feat(quota): add exactly-once-per-threshold alert primitive"
```

---

## Task 5: Global spend and Adobe transaction counters

**Files:**
- Create: `lib/quota/globalSpend.js`
- Create: `lib/quota/adobeCounter.js`
- Test: `scripts/quota-tests/05-global-spend.js`

**Interfaces:**
- Consumes: `incrementCounter`/`decrementCounter`/`adjustCounter` (Task 2), `checkAndAlertThresholds` (Task 4), `currentUtcMonthKey` (Task 2), `GLOBAL_SPEND_CAP_CENTS`/`ADOBE_TX_CAP`/`WORST_CASE_COST_CENTS` (Task 3).
- Produces: `reserveGlobalSpend(route)` → `{allowed, reservedCents, periodKey}`; `releaseGlobalSpend(periodKey, reservedCents)`; `reconcileGlobalSpend(periodKey, reservedCents, actualCents)`; `reserveAdobeTransaction()` → `{allowed, periodKey}`; `releaseAdobeTransaction(periodKey)`.

- [x] **Step 1: Write `lib/quota/globalSpend.js`**

```js
const { incrementCounter, decrementCounter, adjustCounter } = require('./counters');
const { checkAndAlertThresholds } = require('./alerts');
const { currentUtcMonthKey } = require('./period');
const { GLOBAL_SPEND_CAP_CENTS, WORST_CASE_COST_CENTS } = require('./config');

const BUCKET = 'global_spend_cents';

// Alerting is best-effort and must never be allowed to corrupt a reservation
// that already succeeded: a transient DB error inside checkAndAlertThresholds
// (it does its own incrementCounter call, on the alert-flag bucket) would
// otherwise propagate up through reserveGlobalSpend/reconcileGlobalSpend
// AFTER the real spend counter was already mutated, orphaning that
// reservation -- no commit/release closure would ever reach the caller
// (caught in Task 8 review, 2026-08-29 -- see ledger).
async function safeCheckAndAlertThresholds(args) {
  try {
    await checkAndAlertThresholds(args);
  } catch (err) {
    console.error('Alert-threshold check failed (non-fatal, reservation stands):', err.message);
  }
}

async function reserveGlobalSpend(route) {
  const periodKey = currentUtcMonthKey();
  const reservedCents = WORST_CASE_COST_CENTS[route];
  if (typeof reservedCents !== 'number') throw new Error(`No worst-case cost configured for route "${route}"`);
  const { newValue, allowed } = await incrementCounter(BUCKET, periodKey, reservedCents, GLOBAL_SPEND_CAP_CENTS);
  await safeCheckAndAlertThresholds({ counterName: 'global_spend', periodKey, value: newValue, cap: GLOBAL_SPEND_CAP_CENTS });
  return { allowed, reservedCents, periodKey };
}

async function releaseGlobalSpend(periodKey, reservedCents) {
  await decrementCounter(BUCKET, periodKey, reservedCents);
}

async function reconcileGlobalSpend(periodKey, reservedCents, actualCents) {
  const delta = actualCents - reservedCents;
  const newValue = await adjustCounter(BUCKET, periodKey, delta);
  await safeCheckAndAlertThresholds({ counterName: 'global_spend', periodKey, value: newValue, cap: GLOBAL_SPEND_CAP_CENTS });
}

module.exports = { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend };
```

- [x] **Step 2: Write `lib/quota/adobeCounter.js`**

Not called from any route yet — exported ready for the next chantier's Adobe-backed tools (spec §4.4).

```js
const { incrementCounter, decrementCounter } = require('./counters');
const { checkAndAlertThresholds } = require('./alerts');
const { currentUtcMonthKey } = require('./period');
const { ADOBE_TX_CAP } = require('./config');

const BUCKET = 'adobe_tx';

// Same non-fatal-alert-check rationale as lib/quota/globalSpend.js.
async function safeCheckAndAlertThresholds(args) {
  try {
    await checkAndAlertThresholds(args);
  } catch (err) {
    console.error('Alert-threshold check failed (non-fatal, reservation stands):', err.message);
  }
}

async function reserveAdobeTransaction() {
  const periodKey = currentUtcMonthKey();
  const { newValue, allowed } = await incrementCounter(BUCKET, periodKey, 1, ADOBE_TX_CAP);
  await safeCheckAndAlertThresholds({ counterName: 'adobe_tx', periodKey, value: newValue, cap: ADOBE_TX_CAP });
  return { allowed, periodKey };
}

async function releaseAdobeTransaction(periodKey) {
  await decrementCounter(BUCKET, periodKey, 1);
}

module.exports = { reserveAdobeTransaction, releaseAdobeTransaction };
```

- [x] **Step 3: Write and run the global-spend test**

```js
// scripts/quota-tests/05-global-spend.js
require('./_env');
const assert = require('node:assert');
const { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend } = require('../../lib/quota/globalSpend');
const { reserveAdobeTransaction, releaseAdobeTransaction } = require('../../lib/quota/adobeCounter');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');

async function main() {
  const period = currentUtcMonthKey();
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'global_spend_cents').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'adobe_tx').eq('period_key', period);

  const r1 = await reserveGlobalSpend('ai');
  assert.strictEqual(r1.allowed, true);

  await reconcileGlobalSpend(r1.periodKey, r1.reservedCents, 1); // actual cost much lower than worst-case reservation
  const { data: afterReconcile } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', period).single();
  assert.strictEqual(Number(afterReconcile.value), 1, 'reconciliation should replace the worst-case reservation with the real cost');

  const r2 = await reserveGlobalSpend('remove-bg');
  assert.strictEqual(r2.allowed, true);
  await releaseGlobalSpend(r2.periodKey, r2.reservedCents);
  const { data: afterRelease } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', period).single();
  assert.strictEqual(Number(afterRelease.value), 1, 'a released reservation must leave the counter exactly where it was before the reservation');

  const a1 = await reserveAdobeTransaction();
  assert.strictEqual(a1.allowed, true);
  await releaseAdobeTransaction(a1.periodKey);
  const { data: adobeAfter } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'adobe_tx').eq('period_key', period).single();
  assert.strictEqual(Number(adobeAfter.value), 0);

  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'global_spend_cents').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'adobe_tx').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().like('bucket_key', 'alert_sent:global_spend:%').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().like('bucket_key', 'alert_sent:adobe_tx:%').eq('period_key', period);

  console.log('PASS: global spend reserve/reconcile/release and Adobe counter.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
```

Run: `node scripts/quota-tests/05-global-spend.js`
Expected: `PASS: global spend reserve/reconcile/release and Adobe counter.`

- [x] **Step 4: Commit**

```bash
git add lib/quota/globalSpend.js lib/quota/adobeCounter.js scripts/quota-tests/05-global-spend.js
git commit -m "feat(quota): add global spend cap and pre-provisioned Adobe transaction counter"
```

---

## Task 6: IP rate limit (Couche C)

**Files:**
- Create: `lib/quota/ipRateLimit.js`
- Test: `scripts/quota-tests/06-ip-rate-limit.js`

**Interfaces:**
- Consumes: `incrementCounter`/`decrementCounter` (Task 2), `hashIp`/`getClientIp` (Task 2), `currentUtcHourKey`/`currentUtcDayKey`/`secondsUntilNextUtcHour`/`secondsUntilNextUtcDay` (Task 2), `IP_RATE_LIMIT_PER_HOUR`/`IP_RATE_LIMIT_PER_DAY` (Task 3).
- Produces: `checkIpRateLimit(req)` → `{allowed: true}` or `{allowed: false, layer: 'ip_hour'|'ip_day', retryAfterSeconds}`.

- [x] **Step 1: Write `lib/quota/ipRateLimit.js`**

```js
const { incrementCounter, decrementCounter } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { hashIp, getClientIp } = require('./ipHash');
const { IP_RATE_LIMIT_PER_HOUR, IP_RATE_LIMIT_PER_DAY } = require('./config');

// One shared bucket per IP across all 16 tools + Background Remover (spec
// §5) -- not per-tool, so rotating between tools doesn't reset the count.
async function checkIpRateLimit(req) {
  const rawIp = getClientIp(req);
  const hash = rawIp ? hashIp(rawIp) : 'unknown-ip';
  const hourKey = currentUtcHourKey();
  const dayKey = currentUtcDayKey();
  const hourBucket = `ip_rate:hour:${hash}`;
  const dayBucket = `ip_rate:day:${hash}`;

  const hourResult = await incrementCounter(hourBucket, hourKey, 1, IP_RATE_LIMIT_PER_HOUR);
  if (!hourResult.allowed) {
    return { allowed: false, layer: 'ip_hour', retryAfterSeconds: secondsUntilNextUtcHour() };
  }

  const dayResult = await incrementCounter(dayBucket, dayKey, 1, IP_RATE_LIMIT_PER_DAY);
  if (!dayResult.allowed) {
    // A blocked attempt must never inflate the hourly count either.
    await decrementCounter(hourBucket, hourKey, 1);
    return { allowed: false, layer: 'ip_day', retryAfterSeconds: secondsUntilNextUtcDay() };
  }

  return { allowed: true };
}

module.exports = { checkIpRateLimit };
```

- [x] **Step 2: Write and run the IP rate-limit test — this is verification #2 (spec §10.2), the 10-concurrent-against-5 proof**

```js
// scripts/quota-tests/06-ip-rate-limit.js
require('./_env');
const assert = require('node:assert');
const { checkIpRateLimit } = require('../../lib/quota/ipRateLimit');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { hashIp } = require('../../lib/quota/ipHash');
const { currentUtcHourKey, currentUtcDayKey } = require('../../lib/quota/period');

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

async function cleanup(ip) {
  const hash = hashIp(ip);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
}

async function main() {
  // Sequential: hour bucket cap is enforced (this repo's IP_RATE_LIMIT_PER_HOUR default).
  const seqIp = '203.0.113.10';
  await cleanup(seqIp);
  const { IP_RATE_LIMIT_PER_HOUR } = require('../../lib/quota/config');
  for (let i = 0; i < IP_RATE_LIMIT_PER_HOUR; i++) {
    const result = await checkIpRateLimit(fakeReq(seqIp));
    assert.strictEqual(result.allowed, true, `request ${i + 1}/${IP_RATE_LIMIT_PER_HOUR} should be allowed`);
  }
  const overLimit = await checkIpRateLimit(fakeReq(seqIp));
  assert.strictEqual(overLimit.allowed, false);
  assert.strictEqual(overLimit.layer, 'ip_hour');
  await cleanup(seqIp);

  // Concurrent: 10 simultaneous requests against a hand-seeded cap of 5 must
  // let exactly 5 through -- proves the atomicity claim at this layer too.
  const concurrentIp = '203.0.113.20';
  await cleanup(concurrentIp);
  const hash = hashIp(concurrentIp);
  const hourKey = currentUtcHourKey();
  // Seed a temporary cap of 5 by racing against incrementCounter directly with cap=5.
  const { incrementCounter } = require('../../lib/quota/counters');
  const results = await Promise.all(
    Array.from({ length: 10 }, () => incrementCounter(`ip_rate:hour:${hash}`, hourKey, 1, 5))
  );
  const allowedCount = results.filter((r) => r.allowed).length;
  assert.strictEqual(allowedCount, 5, `expected exactly 5 of 10 concurrent requests to pass a cap of 5, got ${allowedCount}`);
  await cleanup(concurrentIp);

  // unknown-ip fallback
  const unknownReq = { headers: { get: () => null } };
  const unknownResult = await checkIpRateLimit(unknownReq);
  assert.strictEqual(unknownResult.allowed, true);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'ip_rate:hour:unknown-ip');
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'ip_rate:day:unknown-ip');

  console.log('PASS: IP rate limit -- sequential cap, concurrent atomicity (exactly 5/10), unknown-IP fallback.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
```

Run: `node scripts/quota-tests/06-ip-rate-limit.js`
Expected: `PASS: IP rate limit -- sequential cap, concurrent atomicity (exactly 5/10), unknown-IP fallback.`

- [x] **Step 3: Commit**

```bash
git add lib/quota/ipRateLimit.js scripts/quota-tests/06-ip-rate-limit.js
git commit -m "feat(quota): add shared per-IP hour/day rate limit (Couche C)"
```

---

## Task 7: Per-user quota (Couche B primitive)

**Files:**
- Create: `lib/quota/userQuota.js`
- Test: `scripts/quota-tests/07-user-quota.js`

**Interfaces:**
- Consumes: `incrementCounter`/`decrementCounter` (Task 2), `currentUtcMonthKey`/`nextUtcMonthIso` (Task 2), `USER_QUOTA_PDF_CONVERSIONS`/`USER_QUOTA_IMAGES` (Task 3).
- Produces: `reserveUserQuota(userId, bucket)` → `{allowed, remaining, cap, resetsAt, periodKey}`; `releaseUserQuota(userId, bucket)`; `getUserQuotaRemaining(userId, bucket)` → `{remaining, cap, resetsAt}`. `bucket` is `'pdf_conversions'` or `'images'`.

- [x] **Step 1: Write `lib/quota/userQuota.js`**

```js
const { incrementCounter, decrementCounter } = require('./counters');
const { currentUtcMonthKey, nextUtcMonthIso } = require('./period');
const { USER_QUOTA_PDF_CONVERSIONS, USER_QUOTA_IMAGES } = require('./config');

const CAPS = { pdf_conversions: USER_QUOTA_PDF_CONVERSIONS, images: USER_QUOTA_IMAGES };

function bucketFor(userId, bucket) {
  // A type check, not a truthiness check: every cap in config.js derives via
  // `Number(process.env.X || default)`, so an operator setting e.g.
  // USER_QUOTA_PDF_CONVERSIONS=0 as a kill-switch produces CAPS.x = 0, which
  // `!CAPS[bucket]` would wrongly treat as "unknown bucket" (caught in
  // Task 7 review, 2026-08-29 -- see ledger; globalSpend.js already used
  // this correct pattern).
  if (typeof CAPS[bucket] !== 'number') throw new Error(`Unknown user quota bucket "${bucket}"`);
  return `user_quota:${bucket}:${userId}`;
}

async function reserveUserQuota(userId, bucket) {
  const cap = CAPS[bucket];
  const periodKey = currentUtcMonthKey();
  const { newValue, allowed } = await incrementCounter(bucketFor(userId, bucket), periodKey, 1, cap);
  return { allowed, remaining: Math.max(cap - newValue, 0), cap, resetsAt: nextUtcMonthIso(), periodKey };
}

async function releaseUserQuota(userId, bucket) {
  await decrementCounter(bucketFor(userId, bucket), currentUtcMonthKey(), 1);
}

// Read-only balance check: reserving 0 units never fails the cap check, so
// this reuses the same RPC to read the current value without mutating it.
async function getUserQuotaRemaining(userId, bucket) {
  const cap = CAPS[bucket];
  const { newValue } = await incrementCounter(bucketFor(userId, bucket), currentUtcMonthKey(), 0, cap);
  return { remaining: Math.max(cap - newValue, 0), cap, resetsAt: nextUtcMonthIso() };
}

module.exports = { reserveUserQuota, releaseUserQuota, getUserQuotaRemaining };
```

- [x] **Step 2: Write and run the user-quota test — this also directly proves spec verification #2 (§10.2) at the account layer**

```js
// scripts/quota-tests/07-user-quota.js
require('./_env');
const assert = require('node:assert');
const { reserveUserQuota, releaseUserQuota, getUserQuotaRemaining } = require('../../lib/quota/userQuota');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');

async function main() {
  const userId = 'test-user-' + Date.now();
  const bucketKey = `user_quota:pdf_conversions:${userId}`;
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucketKey);

  const before = await getUserQuotaRemaining(userId, 'pdf_conversions');
  assert.strictEqual(before.remaining, before.cap, 'a brand-new account should start at full balance');

  const r1 = await reserveUserQuota(userId, 'pdf_conversions');
  assert.strictEqual(r1.allowed, true);
  assert.strictEqual(r1.remaining, before.cap - 1);

  await releaseUserQuota(userId, 'pdf_conversions'); // simulates a provider failure after reservation
  const afterRelease = await getUserQuotaRemaining(userId, 'pdf_conversions');
  assert.strictEqual(afterRelease.remaining, before.cap, 'a released reservation must restore the full balance -- verification #4');

  // 10 concurrent reservations against this account's quota-of-5 default must let exactly 5 through.
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucketKey);
  const { incrementCounter } = require('../../lib/quota/counters');
  const period = currentUtcMonthKey();
  const results = await Promise.all(Array.from({ length: 10 }, () => incrementCounter(bucketKey, period, 1, 5)));
  const allowedCount = results.filter((r) => r.allowed).length;
  assert.strictEqual(allowedCount, 5, `expected exactly 5 of 10 concurrent reservations against a quota of 5, got ${allowedCount}`);

  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucketKey);
  console.log('PASS: user quota reserve/release, balance read, and 10-concurrent-vs-5 atomicity.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
```

Run: `node scripts/quota-tests/07-user-quota.js`
Expected: `PASS: user quota reserve/release, balance read, and 10-concurrent-vs-5 atomicity.`

- [x] **Step 3: Commit**

```bash
git add lib/quota/userQuota.js scripts/quota-tests/07-user-quota.js
git commit -m "feat(quota): add per-user monthly quota primitive (Couche B, no tools wired yet)"
```

---

## Task 8: Event logging and the `guardPaidRoute` orchestrator

**Files:**
- Create: `lib/quota/logEvent.js`
- Create: `lib/quota/guard.js`
- Test: `scripts/quota-tests/08-guard.js`

**Interfaces:**
- Consumes: `checkIpRateLimit` (Task 6), `reserveGlobalSpend`/`releaseGlobalSpend`/`reconcileGlobalSpend` (Task 5), `secondsUntilNextUtcMonth`/`nextUtcMonthIso` (Task 2).
- Produces: `logUsageEvent({route, tool, outcome, estimatedCostCents?, accountId?})`; `guardPaidRoute(req, {route, tool}) → {ok:false, response: NextResponse} | {ok:true, commit: async (actualCostCents?) => void, release: async () => void}`.

- [x] **Step 1: Write `lib/quota/logEvent.js`**

```js
const { supabaseAdmin } = require('./supabaseAdmin');

// Never throws -- a logging failure must not break the guarded request.
async function logUsageEvent({ route, tool, outcome, estimatedCostCents = 0, accountId = null }) {
  try {
    const { error } = await supabaseAdmin.from('usage_events').insert({
      route, tool: tool || null, outcome, estimated_cost_cents: estimatedCostCents, account_id: accountId,
    });
    if (error) console.error('Failed to log usage event (non-fatal):', error.message);
  } catch (err) {
    console.error('Failed to log usage event (non-fatal):', err.message);
  }
}

module.exports = { logUsageEvent };
```

- [x] **Step 2: Write `lib/quota/guard.js`**

```js
const { NextResponse } = require('next/server');
const { checkIpRateLimit } = require('./ipRateLimit');
const { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend } = require('./globalSpend');
const { logUsageEvent } = require('./logEvent');
const { secondsUntilNextUtcMonth, nextUtcMonthIso } = require('./period');

// Wraps the 4 shared OpenAI/remove.bg routes. Order: Couche C (IP) first,
// then Couche A (global spend) -- a blocked IP attempt never reaches the
// spend reservation, but a request that clears the IP check still counts
// against the IP bucket even if it's then blocked by the spend cap (so a
// flood during a maxed-out month is still rate-limited, which is exactly
// when Couche C matters most).
async function guardPaidRoute(req, { route, tool }) {
  const ipCheck = await checkIpRateLimit(req);
  if (!ipCheck.allowed) {
    const outcome = ipCheck.layer === 'ip_hour' ? 'denied_ip_hour' : 'denied_ip_day';
    await logUsageEvent({ route, tool, outcome });
    const minutes = Math.ceil(ipCheck.retryAfterSeconds / 60);
    const response = NextResponse.json(
      { error: `Too many requests from this network. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(ipCheck.retryAfterSeconds) } }
    );
    return { ok: false, response };
  }

  const reservation = await reserveGlobalSpend(route);
  if (!reservation.allowed) {
    await logUsageEvent({ route, tool, outcome: 'denied_global_spend' });
    const response = NextResponse.json(
      {
        error: `This tool has reached its usage limit for the month — that's a site-wide limit, not something on your end. It resets on ${nextUtcMonthIso()}.`,
      },
      { status: 503, headers: { 'Retry-After': String(secondsUntilNextUtcMonth()) } }
    );
    return { ok: false, response };
  }

  // Guards against a caller invoking commit()/release() more than once, in
  // any combination -- either would otherwise double-adjust the spend
  // counter and double-log the event (caught in Task 8 review, 2026-08-29 --
  // see ledger). Does not defend against neither ever being called; the
  // route integrations that consume this must call exactly one, always
  // (try/finally), since that gap can't be closed from inside the guard.
  let settled = false;
  return {
    ok: true,
    async commit(actualCostCents) {
      if (settled) return;
      settled = true;
      if (typeof actualCostCents === 'number') {
        await reconcileGlobalSpend(reservation.periodKey, reservation.reservedCents, actualCostCents);
        await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostCents: actualCostCents });
      } else {
        await logUsageEvent({ route, tool, outcome: 'accepted', estimatedCostCents: reservation.reservedCents });
      }
    },
    async release() {
      if (settled) return;
      settled = true;
      await releaseGlobalSpend(reservation.periodKey, reservation.reservedCents);
      await logUsageEvent({ route, tool, outcome: 'provider_failed' });
    },
  };
}

module.exports = { guardPaidRoute };
```

- [x] **Step 3: Write and run the guard test**

```js
// scripts/quota-tests/08-guard.js
require('./_env');
const assert = require('node:assert');
const { guardPaidRoute } = require('../../lib/quota/guard');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { hashIp } = require('../../lib/quota/ipHash');

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

async function cleanupAll(ip) {
  const hash = hashIp(ip);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey());
  await supabaseAdmin.from('usage_events').delete().eq('route', 'test-guard-route');
}

async function main() {
  const ip = '198.51.100.7';
  await cleanupAll(ip);

  const guard1 = await guardPaidRoute(fakeReq(ip), { route: 'ai', tool: 'test-guard-route' });
  assert.strictEqual(guard1.ok, true);
  await guard1.commit(1); // reconcile down to 1 cent actual

  const { data: afterCommit } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey()).single();
  assert.strictEqual(Number(afterCommit.value), 1);

  const guard2 = await guardPaidRoute(fakeReq(ip), { route: 'ai', tool: 'test-guard-route' });
  assert.strictEqual(guard2.ok, true);
  await guard2.release(); // simulate provider failure
  const { data: afterRelease } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey()).single();
  assert.strictEqual(Number(afterRelease.value), 1, 'a released reservation must not leave residual spend -- verification #4');

  const { data: events } = await supabaseAdmin.from('usage_events').select('outcome').eq('route', 'test-guard-route').order('id');
  assert.deepStrictEqual(events.map((e) => e.outcome), ['accepted', 'provider_failed']);

  await cleanupAll(ip);
  console.log('PASS: guardPaidRoute -- commit reconciles, release restores, both logged.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
```

Run: `node scripts/quota-tests/08-guard.js`
Expected: `PASS: guardPaidRoute -- commit reconciles, release restores, both logged.`

- [x] **Step 4: Commit**

```bash
git add lib/quota/logEvent.js lib/quota/guard.js scripts/quota-tests/08-guard.js
git commit -m "feat(quota): add usage-event logging and the guardPaidRoute orchestrator"
```

---

## Task 9: Wire the guard into `/api/ai` (13 text-tool pages)

**Files:**
- Modify: `app/api/ai/route.ts`
- Modify (add `tool` field + client-side length guard): `app/tools/ai-tools/text-summarizer/page.jsx:17-24`, `app/tools/pdf-tools/pdf-translate/page.jsx:33-40`, `app/tools/ai-tools/sentiment-analyzer/page.jsx:17-24`, `app/tools/ai-tools/keyword-extractor/page.jsx:17-24`, `app/tools/ai-tools/grammar-fixer/page.jsx:17-24`, `app/tools/ai-tools/email-generator/page.jsx:20-27`, `app/tools/ai-tools/data-extractor/page.jsx:17-24`, `app/tools/pdf-tools/pdf-ai-summary/page.jsx:27-34`, `app/tools/ai-tools/ai-writer/page.jsx:17-24`, `app/tools/ai-tools/ai-translator/page.jsx:20-27`, `app/tools/ai-tools/ai-paraphraser/page.jsx:17-24`, `app/tools/ai-tools/ai-detector/page.jsx:17-24`, `app/tools/ai-tools/ai-chatbot/page.jsx:19-26`

**Interfaces:**
- Consumes: `guardPaidRoute` (Task 8), `checkPromptLength`/`MAX_PROMPT_CHARS` (Task 3), `actualAiCostCents` (Task 3).

- [x] **Step 1: Modify `app/api/ai/route.ts`**

Current file (`app/api/ai/route.ts`, full contents):

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export async function POST(req: NextRequest) {
  try {
    const { system, prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "No prompt provided" }, { status: 400 });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 429) {
        await sendAlert("openai", data.error?.code || "429");
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }
    const text = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

Replace it with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { checkPromptLength } from "@/lib/quota/limits";
import { actualAiCostCents } from "@/lib/quota/config";

export async function POST(req: NextRequest) {
  try {
    const { system, prompt, tool } = await req.json();
    if (!prompt) return NextResponse.json({ error: "No prompt provided" }, { status: 400 });

    const promptCheck = checkPromptLength(prompt);
    if (!promptCheck.ok) return NextResponse.json({ error: promptCheck.message }, { status: 400 });

    const guard = await guardPaidRoute(req, { route: "ai", tool });
    if (!guard.ok) return guard.response;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      await guard.release();
      if (response.status === 429) {
        await sendAlert("openai", data.error?.code || "429");
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }
    await guard.commit(actualAiCostCents(data.usage));
    const text = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [x] **Step 2: Add `tool` + client-side length guard to each of the 13 pages**

For each file below, add the import and a guard clause immediately before the existing `fetch('/api/ai', ...)` call, and add a `tool: '<slug>'` field to the JSON body. The pattern is identical across all 13 — only the prompt variable name, tool slug, and exact surrounding code differ. Apply each one exactly as shown (old block → new block).

**`app/tools/ai-tools/text-summarizer/page.jsx`** (add import at top near other imports, then replace lines 17-24):

Old:
```jsx
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a text summarizer. Create a concise summary of the provided text. Keep the key points and main ideas. Return only the summary.',
          prompt: input,
        }),
      });
```
New:
```jsx
      const lengthCheck = checkPromptLength(input);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a text summarizer. Create a concise summary of the provided text. Keep the key points and main ideas. Return only the summary.',
          prompt: input,
          tool: 'text-summarizer',
        }),
      });
```
Add near the top: `import { checkPromptLength } from '@/lib/quota/limits';`

**`app/tools/pdf-tools/pdf-translate/page.jsx`** (lines 33-40, prompt variable is `text.slice(0, 3000)`):

Old:
```jsx
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a professional translator. Translate the following text to ${targetLang}. Return only the translation.`,
          prompt: text.slice(0, 3000),
        }),
      });
```
New:
```jsx
      const lengthCheck = checkPromptLength(text.slice(0, 3000));
      if (!lengthCheck.ok) { setError(lengthCheck.message); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a professional translator. Translate the following text to ${targetLang}. Return only the translation.`,
          prompt: text.slice(0, 3000),
          tool: 'pdf-translate',
        }),
      });
```
Add near the top: `import { checkPromptLength } from '@/lib/quota/limits';`

(`text.slice(0, 3000)` is already well under `MAX_PROMPT_CHARS` (8000), so this check will always pass here — it's included for consistency and in case that slice length changes later.)

**`app/tools/ai-tools/sentiment-analyzer/page.jsx`** (lines 17-24, prompt: `input`) — same pattern as `text-summarizer`, `tool: 'sentiment-analyzer'`, system string unchanged (`'You are a sentiment analysis expert...'`).

**`app/tools/ai-tools/keyword-extractor/page.jsx`** (lines 17-24, prompt: `input`) — same pattern, `tool: 'keyword-extractor'`, system string unchanged (`'You are a keyword extraction expert...'`).

**`app/tools/ai-tools/grammar-fixer/page.jsx`** (lines 17-24, prompt: `input`) — same pattern, `tool: 'grammar-fixer'`, system string unchanged (`'You are a grammar expert...'`).

**`app/tools/ai-tools/email-generator/page.jsx`** (lines 20-27, prompt: `input`) — same pattern, `tool: 'email-generator'`, system string unchanged (the template-literal tone string).

**`app/tools/ai-tools/data-extractor/page.jsx`** (lines 17-24, prompt: `input`) — same pattern, `tool: 'data-extractor'`, system string unchanged (`'You are a data extraction expert...'`).

**`app/tools/pdf-tools/pdf-ai-summary/page.jsx`** (lines 27-34, prompt: `'Please summarize this PDF document: ' + base64.slice(0, 5000)`):

Old:
```jsx
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a document summarizer. Provide a clear and concise summary of the PDF document content.',
          prompt: 'Please summarize this PDF document: ' + base64.slice(0, 5000),
        }),
      });
```
New:
```jsx
      const summaryPrompt = 'Please summarize this PDF document: ' + base64.slice(0, 5000);
      const lengthCheck = checkPromptLength(summaryPrompt);
      if (!lengthCheck.ok) { setError(lengthCheck.message); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a document summarizer. Provide a clear and concise summary of the PDF document content.',
          prompt: summaryPrompt,
          tool: 'pdf-ai-summary',
        }),
      });
```
Add near the top: `import { checkPromptLength } from '@/lib/quota/limits';`

**`app/tools/ai-tools/ai-writer/page.jsx`** (lines 17-24, prompt: `input`) — same pattern, `tool: 'ai-writer'`, system string unchanged (`'You are a professional content writer...'`).

**`app/tools/ai-tools/ai-translator/page.jsx`** (lines 20-27, prompt: `input`) — same pattern, `tool: 'ai-translator'`, system string unchanged (the template-literal translator string).

**`app/tools/ai-tools/ai-paraphraser/page.jsx`** (lines 17-24, prompt: `input`) — same pattern, `tool: 'ai-paraphraser'`, system string unchanged (`'You are a paraphrasing expert...'`).

**`app/tools/ai-tools/ai-detector/page.jsx`** (lines 17-24, prompt: `input`) — same pattern, `tool: 'ai-detector'`, system string unchanged (`'You are an AI text detector...'`).

**`app/tools/ai-tools/ai-chatbot/page.jsx`** (lines 19-26, prompt: `userMsg`) — same pattern but the length-check variable is `userMsg` not `input`, `tool: 'ai-chatbot'`, system string unchanged (`'You are a helpful, friendly AI assistant...'`).

For each of the 9 "same pattern" entries above (sentiment-analyzer, keyword-extractor, grammar-fixer, email-generator, data-extractor, ai-writer, ai-translator, ai-paraphraser, ai-detector, ai-chatbot), apply this shape: add `import { checkPromptLength } from '@/lib/quota/limits';` near the top of the file, insert `const lengthCheck = checkPromptLength(<promptVar>); if (!lengthCheck.ok) { setError(lengthCheck.message); return; }` as the line immediately before `const response = await fetch('/api/ai', {`, and add `tool: '<slug>',` as a new line immediately after the existing `prompt: <promptVar>,` line inside the `JSON.stringify({...})` body — using each file's own prompt variable (`input` for all except `ai-chatbot`, which uses `userMsg`) and its own tool slug as listed above.

- [ ] **Step 3: Manual verification (no automated test framework for React components in this repo)** — PENDING USER ACTION (cannot be run by any agent — these routes call `guardPaidRoute`, which touches Supabase via the service-role key; see Global Constraints and the SDD ledger's Task 9 entry).

```bash
npm run dev
```

Open `http://localhost:3000/tools/ai-tools/text-summarizer`, paste text over 8,000 characters, submit, and confirm the page shows the character-limit error **without any network request firing** (check the browser Network panel), and that the submit control re-enables (fixed in the Task 9 fix round — it previously stuck in "Processing..." on this path for 12 of the 13 pages). Paste text under the limit and confirm a normal summary comes back. Repeat for `ai-chatbot` (checking `userMsg`, not `input`) and at least one more of the 13 pages.

- [x] **Step 4: Commit**

```bash
git add app/api/ai/route.ts app/tools/ai-tools/text-summarizer/page.jsx app/tools/pdf-tools/pdf-translate/page.jsx app/tools/ai-tools/sentiment-analyzer/page.jsx app/tools/ai-tools/keyword-extractor/page.jsx app/tools/ai-tools/grammar-fixer/page.jsx app/tools/ai-tools/email-generator/page.jsx app/tools/ai-tools/data-extractor/page.jsx app/tools/pdf-tools/pdf-ai-summary/page.jsx app/tools/ai-tools/ai-writer/page.jsx app/tools/ai-tools/ai-translator/page.jsx app/tools/ai-tools/ai-paraphraser/page.jsx app/tools/ai-tools/ai-detector/page.jsx app/tools/ai-tools/ai-chatbot/page.jsx
git commit -m "feat(quota): wire guardPaidRoute into /api/ai and its 13 tool pages"
```

---

## Task 10: Wire the guard into `/api/ai-vision` (image-captioner)

**Files:**
- Modify: `app/api/ai-vision/route.ts`
- Modify: `app/tools/ai-tools/image-captioner/page.jsx:30-34`

- [ ] **Step 1: Modify `app/api/ai-vision/route.ts`**

Current file, full contents:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || "Generate a creative caption for this image." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 429) {
        await sendAlert("openai", data.error?.code || "429");
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }
    const text = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

Replace it with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_VISION_IMAGE_BYTES } from "@/lib/quota/limits";
import { actualAiCostCents } from "@/lib/quota/config";

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, tool } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const imageBytes = Buffer.byteLength(image, "base64");
    if (imageBytes > MAX_VISION_IMAGE_BYTES) {
      const maxMb = (MAX_VISION_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `Images are limited to ${maxMb} MB.` }, { status: 400 });
    }

    const guard = await guardPaidRoute(req, { route: "ai-vision", tool });
    if (!guard.ok) return guard.response;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || "Generate a creative caption for this image." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      await guard.release();
      if (response.status === 429) {
        await sendAlert("openai", data.error?.code || "429");
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }
    await guard.commit(actualAiCostCents(data.usage));
    const text = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Modify `app/tools/ai-tools/image-captioner/page.jsx`**

Old (lines 30-34):
```jsx
      const response = await fetch('/api/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, prompt: 'Generate a creative, descriptive caption for this image.' }),
      });
```
New:
```jsx
      const sizeCheck = checkFileSize(imageFile, MAX_VISION_IMAGE_BYTES, 'Images');
      if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
      const response = await fetch('/api/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, prompt: 'Generate a creative, descriptive caption for this image.', tool: 'image-captioner' }),
      });
```
Add near the top: `import { checkFileSize, MAX_VISION_IMAGE_BYTES } from '@/lib/quota/limits';`

Read the full file first to confirm the exact name of the File object variable in scope at this point (it will be whatever variable holds the originally-selected `File`, before it was converted to `base64` — likely named `file` or `imageFile`; use whichever the file actually uses, since `checkFileSize` needs the raw `File` for its `.size` property, not the base64 string).

- [ ] **Step 3: Manual verification**

`npm run dev`, open `/tools/ai-tools/image-captioner`, select an image over 5 MB, confirm the client-side error with no network request; select one under the limit and confirm a caption comes back.

- [ ] **Step 4: Commit**

```bash
git add app/api/ai-vision/route.ts app/tools/ai-tools/image-captioner/page.jsx
git commit -m "feat(quota): wire guardPaidRoute into /api/ai-vision and image-captioner"
```

---

## Task 11: Wire the guard into `/api/ai-transcribe` (audio-transcriber, audio-to-text) with real-duration reconciliation

**Files:**
- Modify: `app/api/ai-transcribe/route.ts`
- Modify: `app/tools/ai-tools/audio-transcriber/page.jsx:23-26`
- Modify: `app/tools/audio-tools/audio-to-text/page.jsx:68`

- [ ] **Step 1: Modify `app/api/ai-transcribe/route.ts`**

Current file, full contents:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const openaiForm = new FormData();
    openaiForm.append("file", file);
    openaiForm.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiForm,
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 429) {
        await sendAlert("openai", data.error?.code || "429");
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }
    return NextResponse.json({ text: data.text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

Replace it with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_AUDIO_UPLOAD_BYTES } from "@/lib/quota/limits";
import { actualAiTranscribeCostCents } from "@/lib/quota/config";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tool = formData.get("tool") as string | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      const maxMb = (MAX_AUDIO_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `Audio files are limited to ${maxMb} MB.` }, { status: 400 });
    }

    const guard = await guardPaidRoute(req, { route: "ai-transcribe", tool: tool || undefined });
    if (!guard.ok) return guard.response;

    const openaiForm = new FormData();
    openaiForm.append("file", file);
    openaiForm.append("model", "whisper-1");
    // verbose_json adds a real `duration` (seconds) to the response, used
    // below to reconcile the worst-case reservation down to the actual
    // cost -- `text` is still present, so the client-facing shape (only
    // `data.text` is ever returned to the browser) is unchanged.
    openaiForm.append("response_format", "verbose_json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiForm,
    });

    const data = await response.json();
    if (!response.ok) {
      await guard.release();
      if (response.status === 429) {
        await sendAlert("openai", data.error?.code || "429");
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }
    await guard.commit(actualAiTranscribeCostCents(data.duration));
    return NextResponse.json({ text: data.text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Modify `app/tools/ai-tools/audio-transcriber/page.jsx`**

Read the full file to find where the `FormData` is built (the current snippet only shows the fetch call at lines 23-26; the `formData.append('file', ...)` call is earlier in the same handler). Add, right after the existing `formData.append('file', <fileVar>)` line: `formData.append('tool', 'audio-transcriber');`. Immediately before the `const response = await fetch('/api/ai-transcribe', {` line (line 23), insert:

```jsx
      const sizeCheck = checkFileSize(<fileVar>, MAX_AUDIO_UPLOAD_BYTES, 'Audio files');
      if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
```

replacing `<fileVar>` with whatever variable name the file already goes by in this handler (it's whatever was passed to `formData.append('file', ...)`). Add near the top: `import { checkFileSize, MAX_AUDIO_UPLOAD_BYTES } from '@/lib/quota/limits';`

- [ ] **Step 3: Modify `app/tools/audio-tools/audio-to-text/page.jsx`**

Read the full file around line 68 to find the `FormData` construction (same as Step 2 — the fetch call at line 68 is a one-liner, so the `formData.append('file', ...)` and the enclosing handler start are above it). Apply the identical pattern: add `formData.append('tool', 'audio-to-text');` after the file append, add the `checkFileSize` guard immediately before the `fetch('/api/ai-transcribe', ...)` call, and add the same `import { checkFileSize, MAX_AUDIO_UPLOAD_BYTES } from '@/lib/quota/limits';` near the top.

- [ ] **Step 4: Manual verification**

`npm run dev`, open `/tools/ai-tools/audio-transcriber`, select an audio file over 10 MB, confirm the client-side rejection with no network call; select one under the limit and confirm a transcript comes back. Repeat for `/tools/audio-tools/audio-to-text`.

- [ ] **Step 5: Commit**

```bash
git add app/api/ai-transcribe/route.ts app/tools/ai-tools/audio-transcriber/page.jsx app/tools/audio-tools/audio-to-text/page.jsx
git commit -m "feat(quota): wire guardPaidRoute into /api/ai-transcribe with real-duration cost reconciliation"
```

---

## Task 12: Wire the guard into `/api/remove-bg` (background-remover)

**Files:**
- Modify: `app/api/remove-bg/route.ts`
- Modify: `app/tools/ai-tools/background-remover/page.jsx:29-33`

- [ ] **Step 1: Modify `app/api/remove-bg/route.ts`**

Current file, full contents:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const formData = new FormData();
    formData.append("image_file_b64", image);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY || "",
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 429) {
        await sendAlert("remove.bg", String(response.status));
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      const err = await response.json();
      return NextResponse.json({ error: err.errors?.[0]?.title || "remove.bg error" }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ image: base64 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

Replace it with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_REMOVEBG_IMAGE_BYTES } from "@/lib/quota/limits";

export async function POST(req: NextRequest) {
  try {
    const { image, tool } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const imageBytes = Buffer.byteLength(image, "base64");
    if (imageBytes > MAX_REMOVEBG_IMAGE_BYTES) {
      const maxMb = (MAX_REMOVEBG_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `Images are limited to ${maxMb} MB.` }, { status: 400 });
    }

    const guard = await guardPaidRoute(req, { route: "remove-bg", tool });
    if (!guard.ok) return guard.response;

    const formData = new FormData();
    formData.append("image_file_b64", image);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY || "",
      },
      body: formData,
    });

    if (!response.ok) {
      await guard.release();
      if (response.status === 402 || response.status === 429) {
        await sendAlert("remove.bg", String(response.status));
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      const err = await response.json();
      return NextResponse.json({ error: err.errors?.[0]?.title || "remove.bg error" }, { status: 500 });
    }

    // remove.bg's cost is a flat, deterministic credit per call (fixed
    // `size: "auto"` above) -- the reservation already equals the actual
    // cost, so commit() is called with no argument (no reconciliation).
    await guard.commit();
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ image: base64 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Modify `app/tools/ai-tools/background-remover/page.jsx`**

Read the full file to find the `File`/`Blob` variable used before it was base64-encoded (the shown snippet only has the fetch call at lines 29-33). Old:
```jsx
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
```
New:
```jsx
      const sizeCheck = checkFileSize(<fileVar>, MAX_REMOVEBG_IMAGE_BYTES, 'Images');
      if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, tool: 'background-remover' }),
      });
```
(`<fileVar>` is whatever variable held the originally-selected image `File` before base64 conversion — confirm the exact name by reading the file.) Add near the top: `import { checkFileSize, MAX_REMOVEBG_IMAGE_BYTES } from '@/lib/quota/limits';`

- [ ] **Step 3: Manual verification**

`npm run dev`, open `/tools/ai-tools/background-remover`, select an image over 12 MB, confirm client-side rejection with no network call; select one under the limit and confirm the background is removed normally.

- [ ] **Step 4: Commit**

```bash
git add app/api/remove-bg/route.ts app/tools/ai-tools/background-remover/page.jsx
git commit -m "feat(quota): wire guardPaidRoute into /api/remove-bg"
```

---

## Task 13: `useSupabaseUser` hook and `/api/quota/me` balance endpoint

**Files:**
- Create: `lib/hooks/useSupabaseUser.js`
- Create: `app/api/quota/me/route.ts`

**Interfaces:**
- Consumes: `getUserQuotaRemaining` (Task 7), existing `lib/supabase.js` client.
- Produces: `useSupabaseUser()` React hook → `{ user, loading }`; `GET /api/quota/me?bucket=pdf_conversions|images` → `{ remaining, cap, resetsAt }` (200) or `{ error }` (401 if no/invalid bearer token, 400 if bad `bucket`).

- [ ] **Step 1: Write `lib/hooks/useSupabaseUser.js`**

Extracted from the exact pattern already in `app/components/Navbar.jsx:720-727` (`getSession()` + `onAuthStateChange`) — no new auth mechanism.

```js
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

- [ ] **Step 2: Write `app/api/quota/me/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserQuotaRemaining } from "@/lib/quota/userQuota";

const VALID_BUCKETS = ["pdf_conversions", "images"];

export async function GET(req: NextRequest) {
  const bucket = new URL(req.url).searchParams.get("bucket");
  if (!bucket || !VALID_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid or missing bucket parameter." }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Verifies the JWT against Supabase Auth itself -- a client-supplied user
  // id is never trusted; the anon key is sufficient to validate a token,
  // it just can't be used to read another user's data (which this route
  // never does -- it always reads the token's own subject).
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await getUserQuotaRemaining(userData.user.id, bucket);
  return NextResponse.json(result);
}
```

`lib/quota/userQuota.js` is CommonJS (`module.exports = {...}`) per this plan's Global Constraints, and this route imports it with a normal ESM named `import` — the same interop this codebase already relies on for `import { createClient } from "@supabase/supabase-js"` (also a CJS package), so no new pattern is introduced.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

With no `Authorization` header:
```bash
curl -s http://localhost:3000/api/quota/me?bucket=pdf_conversions
```
Expected: `{"error":"Not signed in."}` with 401.

With a bad bucket name and a fake token:
```bash
curl -s "http://localhost:3000/api/quota/me?bucket=nonsense" -H "Authorization: Bearer x"
```
Expected: `{"error":"Invalid or missing bucket parameter."}` with 400.

Full sign-in-and-fetch verification happens in Task 14 once the UI can obtain a real session token.

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useSupabaseUser.js app/api/quota/me/route.ts
git commit -m "feat(quota): add useSupabaseUser hook and /api/quota/me balance endpoint"
```

---

## Task 14: Couche B UI on the 3 stub pages

**Files:**
- Modify: `app/tools/ai-tools/image-generator/page.jsx` (full file, currently 24 lines, shown in full below)
- Modify: `app/tools/pdf-tools/pdf-to-excel/page.jsx`
- Modify: `app/tools/pdf-tools/pdf-to-ppt/page.jsx`

**Interfaces:**
- Consumes: `useSupabaseUser` (Task 13), `GET /api/quota/me` (Task 13).

- [ ] **Step 1: Read `pdf-to-excel/page.jsx` and `pdf-to-ppt/page.jsx` in full** to confirm they follow the same static "Coming Soon" shape as `image-generator/page.jsx` (already read in full during spec research — reproduced below) before editing, since their exact JSX structure determines where the banner/balance block is inserted.

- [ ] **Step 2: Replace `app/tools/ai-tools/image-generator/page.jsx`**

Current file (full contents):

```jsx
import SeoContent from '../../../components/SeoContent';
import { ToolIcon } from '../../../lib/toolIcons';

export default function ImageGeneratorPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">AI Image Generator</h1>
        <p className="text-neutral-500 mb-10">Generate stunning images with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ToolIcon slug="image-generator" className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">We are integrating advanced AI image generation. Stay tuned for updates!</p>
        </div>
      </div>
      <SeoContent
        title="Image Generator"
        description="AI Image Generator is not yet available — this feature is under development. We're working on integrating AI-powered image generation so you'll be able to create images from a text description directly in your browser. Check back soon, or explore our other free AI tools in the meantime."
      />
    </div>
  );
}
```

Replace it with:

```jsx
'use client';
import SeoContent from '../../../components/SeoContent';
import { ToolIcon } from '../../../lib/toolIcons';
import { useSupabaseUser } from '../../../lib/hooks/useSupabaseUser';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

function QuotaStatus({ bucket }) {
  const { user, loading } = useSupabaseUser();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const res = await fetch(`/api/quota/me?bucket=${bucket}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setBalance(await res.json());
    });
  }, [user, bucket]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
        <a href="/signin" className="font-bold underline">Log in</a> to use this tool once it launches — it's included free with an account, with a monthly limit.
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-600">
      {balance ? `${balance.remaining} / ${balance.cap} remaining this month` : 'Checking your balance…'}
    </div>
  );
}

export default function ImageGeneratorPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">AI Image Generator</h1>
        <p className="text-neutral-500 mb-10">Generate stunning images with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ToolIcon slug="image-generator" className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm mb-4">We are integrating advanced AI image generation. Stay tuned for updates!</p>
          <QuotaStatus bucket="images" />
        </div>
      </div>
      <SeoContent
        title="Image Generator"
        description="AI Image Generator is not yet available — this feature is under development. We're working on integrating AI-powered image generation so you'll be able to create images from a text description directly in your browser. Check back soon, or explore our other free AI tools in the meantime."
      />
    </div>
  );
}
```

- [ ] **Step 3: Apply the equivalent change to `app/tools/pdf-tools/pdf-to-excel/page.jsx` and `app/tools/pdf-tools/pdf-to-ppt/page.jsx`**

Using the same `QuotaStatus` component shape as Step 2 (duplicated in each file, matching this repo's existing convention of not sharing tiny presentational components across unrelated route folders — consistent with how `SeoContent` is the only cross-page shared component already in use here, imported via relative path from `../../../components/`), but with `bucket="pdf_conversions"` instead of `bucket="images"` (both `pdf-to-excel` and `pdf-to-ppt` share the same `pdf_conversions` bucket per spec §6). Preserve each file's existing headline, icon slug, and "Coming Soon" copy exactly as they are today — only add the `'use client'` directive, the imports, the `QuotaStatus` function, and its `<QuotaStatus bucket="pdf_conversions" />` placement inside the existing "Coming Soon" card, mirroring Step 2's structure.

- [ ] **Step 4: Manual verification**

`npm run dev`. Logged out, visit `/tools/ai-tools/image-generator`, `/tools/pdf-tools/pdf-to-excel`, `/tools/pdf-tools/pdf-to-ppt` — confirm each shows the "Log in to use this tool" banner, never a hard block. Sign in via `/signin` with a real test account, revisit each page, confirm each shows `5 / 5 remaining this month` (or the configured default). Then visit at least 3 unrelated tool pages (e.g. `/tools/ai-tools/ai-chatbot`, `/tools/image-tools/image-blur`, `/tools/pdf-tools/pdf-merge`) both logged in and logged out, and confirm none of them show any login prompt or quota UI at all — this is verification #3 (spec §10.3).

- [ ] **Step 5: Commit**

```bash
git add app/tools/ai-tools/image-generator/page.jsx app/tools/pdf-tools/pdf-to-excel/page.jsx app/tools/pdf-tools/pdf-to-ppt/page.jsx
git commit -m "feat(quota): add login invitation and quota balance to the 3 future paid-tool stubs"
```

---

## Task 15: `/api/cron/health-check` daily digest and housekeeping

**Files:**
- Modify: `app/api/cron/health-check/route.ts`

**Interfaces:**
- Consumes: `supabaseAdmin` (Task 2), `GLOBAL_SPEND_CAP_CENTS`/`ADOBE_TX_CAP` (Task 3), `currentUtcMonthKey`/`currentUtcDayKey` (Task 2).

- [ ] **Step 1: Add the digest and housekeeping to `app/api/cron/health-check/route.ts`**

Read the current file in full first (already read during spec research — it ends with the `GET` handler building `checks` and looping `sendAlert` on failures, then returning `NextResponse.json({ checks })`).

First, add these three imports at the top of the file, alongside the existing `import { sendAlert } from "@/lib/alert";`:

```ts
import { supabaseAdmin } from "@/lib/quota/supabaseAdmin";
import { GLOBAL_SPEND_CAP_CENTS, ADOBE_TX_CAP } from "@/lib/quota/config";
import { currentUtcMonthKey, currentUtcDayKey } from "@/lib/quota/period";
```

Next, add this function at module level, alongside the existing `checkGotenberg`/`checkOpenAI`/etc. functions and before `export async function GET`:

```ts
async function buildDailyDigest() {
  const monthKey = currentUtcMonthKey();
  const dayStart = `${currentUtcDayKey()}T00:00:00.000Z`;

  const { data: spendRow } = await supabaseAdmin
    .from("usage_counters").select("value")
    .eq("bucket_key", "global_spend_cents").eq("period_key", monthKey).maybeSingle();
  const { data: adobeRow } = await supabaseAdmin
    .from("usage_counters").select("value")
    .eq("bucket_key", "adobe_tx").eq("period_key", monthKey).maybeSingle();

  const { data: monthEvents } = await supabaseAdmin
    .from("usage_events").select("tool")
    .eq("outcome", "accepted").gte("created_at", `${monthKey}-01T00:00:00.000Z`);
  const toolCounts: Record<string, number> = {};
  for (const row of monthEvents || []) {
    if (!row.tool) continue;
    toolCounts[row.tool] = (toolCounts[row.tool] || 0) + 1;
  }
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const { data: todaysDenials } = await supabaseAdmin
    .from("usage_events").select("outcome").gte("created_at", dayStart)
    .in("outcome", ["denied_ip_hour", "denied_ip_day", "denied_global_spend", "denied_adobe_cap", "denied_user_quota"]);
  const denialCounts: Record<string, number> = {};
  for (const row of todaysDenials || []) {
    denialCounts[row.outcome] = (denialCounts[row.outcome] || 0) + 1;
  }

  const spendUsd = ((spendRow?.value || 0) / 100).toFixed(2);
  const capUsd = (GLOBAL_SPEND_CAP_CENTS / 100).toFixed(2);
  const adobeUsed = adobeRow?.value || 0;
  const topToolsStr = topTools.length ? topTools.map(([t, c]) => `${t}(${c})`).join(", ") : "none";
  const ipHourDenials = (denialCounts.denied_ip_hour || 0) + (denialCounts.denied_ip_day || 0);
  const capDenials = (denialCounts.denied_global_spend || 0) + (denialCounts.denied_adobe_cap || 0);
  const quotaDenials = denialCounts.denied_user_quota || 0;

  // A capped-out global spend or Adobe counter is informational here, never
  // a dependency failure -- see spec §5, "Voluntary caps never read as
  // outages." This digest is a separate, unconditional daily message, not
  // routed through the per-dependency sendAlert(service, status) failure
  // path above.
  return `spend $${spendUsd}/$${capUsd}, adobe ${adobeUsed}/${ADOBE_TX_CAP}, top tools: ${topToolsStr}, refusals today: ip=${ipHourDenials} cap=${capDenials} quota=${quotaDenials}`;
}
```

Finally, inside the `GET` handler, immediately after the existing failure-alert loop (`for (const [service, result] of Object.entries(checks)) { if (!result.ok) await sendAlert(service, result.detail); }`) and before `return NextResponse.json({ checks })`, add:

```ts
  const digest = await buildDailyDigest();
  await sendAlert("daily-digest", digest);

  // Housekeeping: fixed-window counter rows and event-log rows both grow
  // unbounded without pruning (spec §8).
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  await supabaseAdmin.from("usage_counters").delete().like("bucket_key", "ip_rate:%").lt("updated_at", twoDaysAgo);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  await supabaseAdmin.from("usage_events").delete().lt("created_at", ninetyDaysAgo);
```

- [ ] **Step 2: Manual verification**

Requires `CRON_SECRET` from `.env.local` (pulled in Task 0). With the dev server running:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/health-check"
```

Confirm the response still includes `checks` as before, and check the configured ntfy topic for a new `daily-digest` message.

Then force the global-spend counter over cap and re-run, confirming the digest reports it (via the ntfy message content) without the per-dependency failure loop treating it as a failure (`checks` should show `openai`/`remove.bg`/etc. unaffected — this proves spec verification #7, §10.7):

```bash
node -e "
require('./scripts/quota-tests/_env');
const { supabaseAdmin } = require('./lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('./lib/quota/period');
supabaseAdmin.from('usage_counters').upsert({ bucket_key: 'global_spend_cents', period_key: currentUtcMonthKey(), value: 999999 }).then(() => console.log('seeded'));
"
curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/health-check"
node -e "
require('./scripts/quota-tests/_env');
const { supabaseAdmin } = require('./lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('./lib/quota/period');
supabaseAdmin.from('usage_counters').delete().eq('bucket_key','global_spend_cents').eq('period_key', currentUtcMonthKey()).then(() => console.log('cleaned up'));
"
```

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/health-check/route.ts
git commit -m "feat(quota): add daily spend/Adobe/top-tools/refusals digest and counter housekeeping to health-check cron"
```

---

## Task 16: Privacy policy update

**Files:**
- Modify: `app/privacy/page.jsx`

- [ ] **Step 1: Add the usage-metrics bullet to Section 2 ("Information We Collect")**

Old (within the `<ul>` in Section 2):
```jsx
              <li><strong>Account Information:</strong> If you create an account, we collect your name and email address.</li>
```
New (add a new `<li>` immediately after it):
```jsx
              <li><strong>Account Information:</strong> If you create an account, we collect your name and email address.</li>
              <li><strong>Usage Metrics:</strong> To operate fairly within our provider budgets and prevent abuse, we record which tool was used, when, an estimated processing cost, and — for the small number of tools that require an account — your account identifier. We never record file contents or the text you submit. For abuse-rate-limiting on tools that don't require an account, we record a one-way cryptographic hash of your IP address, never the address itself.</li>
```

- [ ] **Step 2: Replace the vague retention line in Section 6 ("Data Retention")**

Old:
```jsx
            <p className="text-neutral-600 text-sm leading-relaxed">We retain your personal data only for as long as necessary to provide the service. Usage data is generally retained for a shorter period, except when used to strengthen security or improve functionality.</p>
```
New:
```jsx
            <p className="text-neutral-600 text-sm leading-relaxed">We retain your personal data only for as long as necessary to provide the service. Usage metrics (described in Section 2) are kept for 90 days. Hashed-IP rate-limit records are kept for 2 days.</p>
```

- [ ] **Step 3: Bump the "Last updated" date**

Old:
```jsx
        <p className="text-neutral-500 text-center mb-10">Last updated: August 6, 2026</p>
```
New (use the actual date this task is executed, in the same format):
```jsx
        <p className="text-neutral-500 text-center mb-10">Last updated: August 28, 2026</p>
```

- [ ] **Step 4: Manual verification**

`npm run dev`, open `/privacy`, confirm the new bullet reads correctly in Section 2, the retention text in Section 6 states 90 days / 2 days, and the date at the top matches today.

- [ ] **Step 5: Commit**

```bash
git add app/privacy/page.jsx
git commit -m "docs: disclose usage-metrics collection and retention in the privacy policy"
```

---

## Task 17: Full verification suite, env vars in Vercel, push, deploy, production check

**Files:** none new — this task runs everything already built and ships it.

- [ ] **Step 1: Run every quota-tests script in order**

```bash
node scripts/quota-tests/00-schema.js
node scripts/quota-tests/01-period.js
node scripts/quota-tests/02-counters.js
node scripts/quota-tests/03-config.js
node scripts/quota-tests/04-alerts.js
node scripts/quota-tests/05-global-spend.js
node scripts/quota-tests/06-ip-rate-limit.js
node scripts/quota-tests/07-user-quota.js
node scripts/quota-tests/08-guard.js
```
Expected: every script prints its own `PASS: ...` line. This covers spec verification #1 (global cap blocks — proven in `05-global-spend.js` and `08-guard.js`), #2 (atomicity — `06-ip-rate-limit.js` and `07-user-quota.js`), #4 (provider failure releases quota — `08-guard.js`), #5 (alerts exactly once per threshold — `04-alerts.js`).

- [ ] **Step 2: Re-verify #3 and #7 and #8 manually** (already exercised in Tasks 14 and 15 — repeat quickly here as a final gate): 3 stub pages show the login invitation logged-out and never elsewhere; the health-check digest treats a forced-over-cap spend counter as informational, not a failure; an oversized file/prompt is rejected client-side with zero network calls.

- [ ] **Step 3: No-regression pass on 3 of the 15 OpenAI-backed tools (verification #6)**

`npm run dev`, and with the site well under the configured rate limit (fresh IP bucket), exercise:
- `/tools/ai-tools/ai-chatbot` — send a short message, confirm a normal reply.
- `/tools/ai-tools/text-summarizer` — summarize a short paragraph, confirm a normal summary.
- `/tools/ai-tools/grammar-fixer` — fix a sentence with an obvious typo, confirm a normal correction.

For each, confirm the response is a normal 200 with real content (not a 429/503/403) and that the browser Network panel shows the request completed normally.

- [ ] **Step 4: Set the 6 new env vars in Vercel** (names only — do not commit values anywhere)

`GLOBAL_SPEND_CAP_USD`, `ADOBE_TX_CAP`, `USER_QUOTA_PDF_CONVERSIONS`, `USER_QUOTA_IMAGES`, `IP_RATE_LIMIT_PER_HOUR`, `IP_RATE_LIMIT_PER_DAY` — via the Vercel dashboard or `vercel env add <NAME> production` for each. Confirm with `vercel env ls` (names only).

- [ ] **Step 5: Push**

```bash
git push origin master
```

- [ ] **Step 6: Wait for the Vercel deployment to finish**, then verify in production on `www.onlineconvertools.com`:
  - Visit `/tools/pdf-tools/pdf-to-excel` logged out — confirm the login invitation, not a block.
  - Visit `/tools/ai-tools/ai-chatbot` logged out — confirm it works normally, no login prompt.
  - Visit `/privacy` — confirm the updated Section 2 bullet, Section 6 retention text, and today's date.
  - `curl -s -H "Authorization: Bearer $CRON_SECRET" "https://www.onlineconvertools.com/api/cron/health-check"` — confirm `checks` still returns normally and a `daily-digest` ntfy message arrives.

- [ ] **Step 7: Final report**

Summarize: which of the 8 verification checks passed (with evidence — the specific script or manual step), the final list of env vars set in Vercel, and confirm nothing in `/v1/repair`, `/v1/pdfa` (Railway `pdf-tools` service), or the Supabase Auth signup/signin/password flows was touched.

---
