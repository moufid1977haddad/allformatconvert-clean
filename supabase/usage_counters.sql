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
  -- one, a fresh bucket's opening request bypassed the cap entirely.
  -- Safe to add: since decrement/adjust both clamp at 0, stored value is
  -- always >= 0, so `p_amount <= p_cap` failing implies
  -- `existing.value + p_amount <= p_cap` also fails -- this can only
  -- narrow, never change, the conflict path's own outcome.
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

-- All-or-none reservation across several counters (added 29/09, see
-- docs/audit/migration-quota-atomique-29-09.sql). Replaces the old
-- "increment A, increment B, and if B is denied decrement A in a separate
-- call" sequence (hour+day rate limits, image generator IP+budget): a
-- network error between those calls left A inflated. Here every counter
-- is incremented or none is, inside the single transaction of one RPC.
--
--   * Each counter keeps exactly increment_usage_counter's cap rule (the
--     `where p_amount <= p_cap` gate on a new row, the `where value +
--     amount <= cap` gate on an existing one).
--   * Rows are touched in a fixed order (bucket_key, period_key), so two
--     concurrent calls on overlapping counters always lock them in the same
--     order: they queue, they never deadlock.
--   * The first counter that would exceed its cap raises QC001 inside a
--     BEGIN/EXCEPTION block; PL/pgSQL rolls back to the block's implicit
--     savepoint, undoing the increments already applied to the others.
--
-- Returns one row per input, in input order (idx is 1-based):
--   new_value : the counter after the call (unchanged value if denied)
--   over_cap  : denied because of this counter (lets the caller name the
--               layer, e.g. hour vs day); always false when allowed
--   allowed   : the single all-or-none verdict, identical on every row
create or replace function increment_usage_counters_all_or_none(
  p_buckets text[], p_periods text[], p_amounts bigint[], p_caps bigint[]
) returns table(idx integer, new_value bigint, over_cap boolean, allowed boolean)
language plpgsql
set search_path = public
as $$
declare
  n bigint := coalesce(cardinality(p_buckets), 0);
  r record;
  v bigint;
  failed_idx bigint := null;
  ok boolean := true;
begin
  if n = 0
     or coalesce(cardinality(p_periods), -1) <> n
     or coalesce(cardinality(p_amounts), -1) <> n
     or coalesce(cardinality(p_caps), -1) <> n then
    raise exception 'increment_usage_counters_all_or_none: the four arrays must be non-empty and of equal length';
  end if;
  if array_position(p_buckets, null) is not null or array_position(p_periods, null) is not null
     or array_position(p_amounts, null) is not null or array_position(p_caps, null) is not null then
    raise exception 'increment_usage_counters_all_or_none: null element';
  end if;
  if exists (select 1 from unnest(p_amounts) a where a < 0) then
    raise exception 'increment_usage_counters_all_or_none: amounts must be >= 0';
  end if;

  begin
    for r in
      select t.b, t.p, t.a, t.c, t.i
        from unnest(p_buckets, p_periods, p_amounts, p_caps) with ordinality as t(b, p, a, c, i)
       order by t.b, t.p, t.i
    loop
      insert into usage_counters as uc (bucket_key, period_key, value)
      select r.b, r.p, r.a
       where r.a <= r.c
      on conflict (bucket_key, period_key) do update
        set value = uc.value + excluded.value, updated_at = now()
        where uc.value + excluded.value <= r.c
      returning uc.value into v;
      if not found then
        failed_idx := r.i;
        raise exception using errcode = 'QC001', message = 'usage cap exceeded';
      end if;
    end loop;
  exception when sqlstate 'QC001' then
    ok := false;
  end;

  return query
    select t.i::integer,
           coalesce(uc.value, 0)::bigint,
           case when ok then false
                else coalesce(t.i = failed_idx, false) or coalesce(uc.value, 0) + t.a > t.c end,
           ok
      from unnest(p_buckets, p_periods, p_amounts, p_caps) with ordinality as t(b, p, a, c, i)
      left join usage_counters uc on uc.bucket_key = t.b and uc.period_key = t.p
     order by t.i;
end;
$$;

revoke execute on function increment_usage_counters_all_or_none(text[], text[], bigint[], bigint[])
  from public, anon, authenticated;
grant execute on function increment_usage_counters_all_or_none(text[], text[], bigint[], bigint[])
  to service_role;
