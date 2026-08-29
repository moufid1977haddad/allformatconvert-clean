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
  estimated_cost_micros integer not null default 0,
  account_id uuid
);
alter table usage_events enable row level security;
create index if not exists usage_events_created_at_idx on usage_events (created_at);
create index if not exists usage_events_tool_idx on usage_events (tool, created_at);
