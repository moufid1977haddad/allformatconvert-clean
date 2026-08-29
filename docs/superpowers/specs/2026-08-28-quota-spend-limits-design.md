# Quota and spend-cap infrastructure — design spec

Status: approved for implementation planning
Date: 2026-08-28

## 1. Purpose and scope

Build the server-side barrier that protects every paid provider call (OpenAI, remove.bg,
and — pre-provisioned, not yet wired up — Adobe PDF Services) before the Product Hunt
launch. This chantier creates **no new tool**. `pdf-to-excel`, `pdf-to-ppt`, and
`image-generator` stay "Coming Soon" stubs; only the barrier that will sit in front of
them gets built now.

Three independent layers:

- **Couche A** — global monthly spend cap ($20/mo default, configurable), applicable to
  every paid-provider call. Separate Adobe transaction counter (450/500).
- **Couche B** — mandatory account + per-user monthly quota, scoped to the 3 future paid
  tools only.
- **Couche C** — per-IP rate limit (10/hour, 30/day, shared across all 16 existing
  no-login AI tools + Background Remover). An abuse deterrent, not the budget
  protection — Couche A is.

No new API keys. No changes to signup/signin/password flows.

## 2. Data model

Two new Supabase tables. Both get `enable row level security` with **no policies** —
service-role only, matching the existing `contact_messages` pattern. RPC functions below
additionally get `revoke execute ... from public, anon, authenticated` — table RLS alone
does not stop a client holding the anon key from calling an RPC function directly via
`supabase.rpc(...)`, so function-level grants must be locked down separately.

```sql
-- supabase/usage_counters.sql
-- The single atomic-capped-counter primitive behind all three layers: global spend,
-- the Adobe transaction counter, per-user quotas, per-IP rate limits, and the
-- exactly-once-per-threshold alert flags all reuse this one table and function pair.
create table if not exists usage_counters (
  bucket_key  text not null,
  period_key  text not null,
  value       bigint not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (bucket_key, period_key)
);
alter table usage_counters enable row level security;

create or replace function increment_usage_counter(
  p_bucket_key text, p_period_key text, p_amount bigint, p_cap bigint
) returns table(new_value bigint, allowed boolean)
language sql as $$
  with upsert as (
    insert into usage_counters (bucket_key, period_key, value)
    values (p_bucket_key, p_period_key, p_amount)
    on conflict (bucket_key, period_key) do update
      set value = usage_counters.value + p_amount, updated_at = now()
      where usage_counters.value + p_amount <= p_cap
    returning value
  )
  select
    coalesce((select value from upsert), (select value from usage_counters where bucket_key = p_bucket_key and period_key = p_period_key)),
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

-- Post-hoc correction after a real cost is known (reconciliation, see §4). Unconditional
-- by design: a reconciliation must never fail even if it pushes the counter over cap —
-- it is recording what already happened, not gating a new request. p_delta may be
-- negative (actual cost below the worst-case reservation) or positive (rare: actual
-- above worst-case reservation, e.g. a pricing-table drift).
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

```sql
-- supabase/usage_events.sql
-- Append-only observability log. Never used for enforcement (usage_counters is the
-- sole source of truth for caps) -- this is what the daily digest reads for "top 3
-- tools" and refusal counts. Every attempt is logged, accepted or denied, so the
-- digest can show refusals per layer.
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

No content, no file bytes, no prompt/response text is ever written to either table —
only the metrics named above. `account_id` is null for every Couche-C tool (anonymous by
design) and set only for the 3 future Couche-B tools.

### Bucket key / period key scheme

| Layer | bucket_key | period_key |
|---|---|---|
| Global spend | `global_spend_cents` | `2026-08` (UTC month) |
| Adobe transactions | `adobe_tx` | `2026-08` (UTC month) |
| Per-user quota | `user_quota:pdf_conversions:<uid>` / `user_quota:images:<uid>` | `2026-08` (UTC month) |
| IP hourly | `ip_rate:hour:<sha256(ip)>` | `2026-08-28T14` (UTC hour) |
| IP daily | `ip_rate:day:<sha256(ip)>` | `2026-08-28` (UTC day) |
| Alert-sent flag | `alert_sent:<counter>:<threshold>` e.g. `alert_sent:global_spend:80` | same period as the counter it tracks |

IPs are hashed (sha256 hex) before ever reaching the database — they're only a bucketing
key, never need to be human-readable, and there's no reason to keep raw IPs around
longer than necessary.

## 3. Atomicity mechanism

A single `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE ... RETURNING` statement, not a
read followed by a write. Postgres serializes concurrent `INSERT ... ON CONFLICT` writes
targeting the same row, so two simultaneous callers can never both observe "under cap"
and both commit — the second one's `WHERE` clause re-evaluates against the row the first
one just wrote. This is what makes "10 concurrent requests against a quota of 5 → exactly
5 succeed" hold, and it's the mechanism requested (a conditional `UPDATE ... RETURNING`,
not a check-then-write).

**Reserve-before-call, release-on-failure — applied uniformly to all three layers**,
including Couche A. The spend cap must be checked *before* the provider call (otherwise
nothing actually stops a burst of concurrent requests from all sailing over the cap
before any of them get counted); on provider failure the reservation is released, so the
net effect matches "only successful calls stay counted" while still blocking in real
time. Same shape for Couche C: reserve the hour bucket; if denied, stop (no day-bucket
attempt, no event beyond the denial). If the hour bucket succeeds, reserve the day
bucket; if *that* is denied, release the hour reservation (a blocked attempt must never
inflate the hourly count) and log the denial.

## 4. Couche A — global spend, real-cost reconciliation, Adobe counter, alerts

### 4.1 The reservation-only-estimates problem

A flat per-route cost estimate is wrong the moment input size varies — 2 hours of audio
on `/api/ai-transcribe` costs roughly 60× the estimate for a typical short clip, and a
cap built on flat estimates stops capping anything. The fix has three parts:

1. **Reserve the worst case the input bound allows, before the call.** Every route gets
   an upstream input bound (below), and the reservation is sized to what that bound
   could cost in the worst case — never an "average" case.
2. **Reconcile to the real cost after a successful call.** OpenAI's chat completions
   responses already include a `usage` object (`prompt_tokens`, `completion_tokens`) —
   read it, compute the real cost from the per-token price table, and call
   `adjust_usage_counter` with the delta (reserved − actual). For Whisper, the route
   adds `response_format: verbose_json` to the OpenAI request (the client-facing
   response shape is unchanged — `text` is still present, `duration` is just additional
   data the route reads server-side and never forwards) and reconciles from the real
   audio duration. remove.bg's cost is deterministic per call (fixed credit, `size:
   "auto"` already fixed in the existing route) so reservation already equals actual —
   no reconciliation needed there.
3. **When a provider genuinely offers no way to learn the real cost**, the reservation
   stays at the worst case permanently for that call — never fall back to an average.
   (Does not currently apply to any of the 4 routes; stated for when Adobe is wired up
   next chantier, since Adobe's per-transaction pricing is flat regardless of input.)

### 4.2 Input bounds (new)

Config constants in `lib/quota/config.js` (not new env vars — see §7 rationale):

| Bound | Applies to | Purpose | Default |
|---|---|---|---|
| `MAX_PROMPT_CHARS` | `/api/ai`, `/api/ai-vision` | Bounds worst-case input-token cost | 8,000 chars (~2,000 tokens) |
| `MAX_VISION_IMAGE_BYTES` | `/api/ai-vision` | Bounds worst-case image-token cost | 5 MB |
| `MAX_AUDIO_UPLOAD_BYTES` | `/api/ai-transcribe` | Bounds worst-case transcription duration | 25 MB (OpenAI's own hard limit — this bound is enforcing a ceiling that already exists, giving a real worst-case duration "for free") |
| `MAX_REMOVEBG_IMAGE_BYTES` | `/api/remove-bg` | Bounds upload size (cost itself is flat) | 12 MB |

Requests exceeding a bound are rejected before any provider call (400, honest message
naming the limit) — they never reach the reservation step. `/api/ai-transcribe`'s
worst-case duration is derived from `MAX_AUDIO_UPLOAD_BYTES` via a conservative
low-bitrate floor (documented as a code comment next to the constant, since it's a
physics-derived worst case, not a tunable price): a smaller worst-case bound produces a
smaller worst-case duration and therefore a smaller reservation.

### 4.3 Cost table (route-keyed, tool-labeled)

Cost lives in `lib/quota/config.js`, keyed by the 5 routes (`ai`, `ai-vision`,
`ai-transcribe`, `remove-bg`, `adobe-pdf` — the last unused until next chantier). Every
`usage_events` row also carries a client-supplied `tool` slug purely for the "top 3
tools" digest metric — analytics only, never used for pricing or authorization. This
requires a small, mechanical addition: each of the 16 existing tool pages adds a `tool:
'<slug>'` field to its existing fetch call, and each of the 4 shared routes accepts and
forwards it into the event log.

Placeholder per-token / per-minute prices (public list pricing — **flagged for the
user to confirm against their actual billing tier before launch**, since the whole cap
is only as honest as these numbers):

| route | pricing basis |
|---|---|
| `ai` (gpt-4o-mini) | $0.15 / 1M input tokens, $0.60 / 1M output tokens |
| `ai-vision` (gpt-4o-mini + image) | same token prices + image-token estimate for a high-detail image |
| `ai-transcribe` (whisper-1) | $0.006 / minute |
| `remove-bg` | $0.20 / image (flat, conservative) |

### 4.4 Adobe counter

Same primitive, `bucket_key = 'adobe_tx'`, `period_key` = UTC month, cap = `ADOBE_TX_CAP`
(default 450). Not called from anywhere yet — `reserveAdobeTransaction()` /
`releaseAdobeTransaction()` are exported from `lib/quota/` ready for the next chantier's
Adobe-backed tools.

### 4.5 Alerts — three thresholds, exactly once each

`ALERT_THRESHOLDS = [50, 80, 100]` (percent), applied to **both** the global spend
counter and the Adobe counter. Each threshold-crossing check is itself an
`increment_usage_counter` call capped at 1 (`bucket_key =
'alert_sent:<counter>:<threshold>'`): if the increment succeeds (flag was 0, now 1),
send the ntfy alert; if it fails (already sent this month), skip silently. This reuses
the exact same primitive — no separate "already alerted" bookkeeping — and is
inherently exactly-once per threshold per month.

The check runs at three points, not just one, because reconciliation (not only a live
reservation) can be what pushes the counter across a threshold: after every successful
reservation, after every reconciliation (`adjust_usage_counter`), and on every
reservation **denial** (so the 100% alert — "the tools just went dark" — fires
immediately even in the case where the cap was crossed by a post-hoc reconciliation
between two requests, before the next request even gets denied).

## 5. Couche C — IP rate limit

`guardPaidRoute({ ip, route, tool })` wraps all 4 shared routes. IP comes from
`x-forwarded-for` (first entry); if that header is ever absent, the request falls into
one shared `unknown-ip` bucket rather than skipping the check entirely. One shared bucket
per IP across all 16 tools + Background Remover (not per-tool) — 10/hour
(`IP_RATE_LIMIT_PER_HOUR`), 30/day (`IP_RATE_LIMIT_PER_DAY`), both configurable, both
denials logged to `usage_events` with the specific outcome (`denied_ip_hour` /
`denied_ip_day`) so the digest can report which one is actually triggering.

On denial: 429 ("too many requests" is the accurate status for a per-IP rate limit),
with an honest message stating the limit and when it resets — never phrased as a
security measure, since Couche A is what actually protects the budget.

Status-code convention used consistently across every layer: **429** for the IP
hour/day buckets (Couche C — a rate, not a capacity, problem); **503** for global
spend, the Adobe counter, and per-user quota exhaustion (Couche A/B — the service is
genuinely out of budget/allowance, matching the existing `503` "temporarily at
capacity" convention already used for OpenAI's own 429s in the current 4 routes).

## 6. Couche B — account + per-user quota (barrier only, no tools yet)

Server-side primitives mirror Couche A: `reserveUserQuota(userId, bucket)` /
`releaseUserQuota(userId, bucket)` / `getUserQuotaRemaining(userId, bucket)`, scoped to
`user_quota:pdf_conversions:<uid>` (shared by the future pdf-to-excel + pdf-to-ppt) and
`user_quota:images:<uid>` (image-generator), both capped via
`USER_QUOTA_PDF_CONVERSIONS` / `USER_QUOTA_IMAGES` (default 5/month each).

The 3 target pages are today static "Coming Soon" stubs with no logic. This chantier
adds, without building the actual conversion:

- `lib/hooks/useSupabaseUser.js` — extracted from the exact `getSession()` /
  `onAuthStateChange` pattern already used in `Navbar.jsx` (no new auth mechanism).
- A "log in to use this tool" banner on the 3 pages for logged-out visitors — an
  invitation, never a hard block, and scoped to exactly these 3 pages (the other 222
  tools are untouched).
- A "X / 5 remaining this month" balance for logged-in visitors, from a new
  `GET /api/quota/me?bucket=pdf_conversions|images` route. That route verifies the caller
  server-side via `supabase.auth.getUser(bearerToken)` against the token the client
  attaches from its own session — a client-supplied user id is never trusted.

Since no real conversion endpoint exists yet, the concurrency proof (verification #2)
calls `increment_usage_counter` directly from a Node script (10 parallel calls against a
quota-of-5 row) — the same function the real tools will call next chantier, at the level
where the atomicity claim actually lives.

## 7. Configuration and environment variables

Per your decision: a code module (`lib/quota/config.js`), not a Supabase settings table —
consistent with `services/pdf-tools/src/config.js` already in this repo. The *caps* read
from env vars (so they're adjustable without a code change); the cost table and input
bounds are constants in the same module (not one env var per knob — flagged here in case
you'd rather they be tunable without a redeploy too, easy to change before implementation
starts).

New env vars (names only):

- `GLOBAL_SPEND_CAP_USD`
- `ADOBE_TX_CAP`
- `USER_QUOTA_PDF_CONVERSIONS`
- `USER_QUOTA_IMAGES`
- `IP_RATE_LIMIT_PER_HOUR`
- `IP_RATE_LIMIT_PER_DAY`

All default to the values in this spec if unset, so nothing breaks on a deploy that
hasn't had them set yet — though they should still be set explicitly in Vercel per your
"never hard-coded" instruction; the defaults are a fail-safe, not a substitute.

## 8. `/api/cron/health-check` extension

Today `sendAlert` fires only on a dependency failure. Adds:

- One unconditional daily ntfy message (separate from failure alerts, since the digest
  should arrive even on a fully healthy day): month-to-date estimated spend, Adobe
  transactions used this month, top 3 tools by call count, and **today's refusal counts
  broken down by layer** (`denied_ip_hour` + `denied_ip_day`, `denied_global_spend` +
  `denied_adobe_cap`, `denied_user_quota`) — all read from `usage_events`/
  `usage_counters` via the existing service-role client, in the same route.
- Housekeeping: deletes `usage_events` rows older than 90 days and `usage_counters` rows
  whose `bucket_key` starts with `ip_rate:` and are older than 2 days (fixed-window
  buckets are worthless once their window has passed; without pruning these grow
  unbounded).

## 9. Privacy policy update (same commit)

Audited `app/privacy/page.jsx` against what this chantier adds. Two sections need
concrete, accurate additions — not a rewrite, the rest of the page stays as-is:

- **Section 2 ("Information We Collect")**: a new bullet disclosing usage-metrics
  collection — tool used, timestamp, estimated cost, and account identifier when the
  visitor is logged in and using a quota-metered tool — and that IP addresses used for
  abuse-rate-limiting are hashed, never stored raw.
- **Section 6 ("Data Retention")**: replace the vague "generally retained for a shorter
  period" with the concrete figures this chantier introduces — usage-metrics events kept
  90 days, IP rate-limit buckets kept 2 days.
- **"Last updated" date** bumped to the date this ships, per this site's existing
  convention of accurate legal dates.

This keeps the policy's promises true rather than merely keeping the counters honest —
the exact contradiction the user has already spent effort eliminating elsewhere on the
site.

## 10. Verification plan (maps to the 6 required checks)

1. **Global cap actually blocks**: seed `usage_counters` with a row close to
   `GLOBAL_SPEND_CAP_USD` for the current month, call a guarded route, assert 503 with
   the honest reset-date message and no provider call made (mock or intercept).
2. **Atomicity holds**: 10 concurrent `supabase.rpc('increment_usage_counter', ...)`
   calls against a fresh quota-of-5 row; assert exactly 5 `allowed: true`.
3. **Logged-out gating scoped correctly**: automated check that the 3 target pages show
   the login invitation when logged out, and that a sample of other tool pages (outside
   the 3) render and function with no auth prompt at all.
4. **Provider failure doesn't consume quota**: mock a provider failure after a
   successful reservation, assert the counter is back to its pre-reservation value.
5. **Alerts fire once per threshold**: force a counter through 50/80/100 sequentially in
   a test, assert exactly one ntfy call per threshold, and that a second pass through an
   already-crossed threshold sends nothing.
6. **No regression**: exercise at least 3 of the 15 OpenAI-backed tool pages end to end,
   under the rate limit, confirm normal responses.

## 11. Out of scope (confirmed)

- Building `pdf-to-excel`, `pdf-to-ppt`, `image-generator` themselves, or any Adobe PDF
  Services integration — next chantier, behind this barrier.
- Any change to Supabase Auth signup/signin/password flows.
- Any change to the Railway `pdf-tools` microservice (`/v1/repair`, `/v1/pdfa`) — out of
  scope for this barrier, which covers `app/api/*` on Vercel only.
