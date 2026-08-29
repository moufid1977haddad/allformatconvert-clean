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
