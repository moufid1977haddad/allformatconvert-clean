-- Migration 29/09 -- atomic multi-counter reservation for the quota layer.
-- NOT executed by the agent. To be run by the owner in the Supabase SQL editor,
-- BEFORE the code that calls increment_usage_counters_all_or_none is deployed
-- (schema change before code: the new code calls this RPC on every rate-limited
-- request -- deployed first, every rate-limited route would fail closed: contact,
-- report-error and media tickets answer 503, the AI routes an error before any provider
-- call or spend -- independent review, 29/09).
--
-- Additive only: creates one new function, touches no existing function, table or row.
-- The previous code keeps working after this migration (it does not call the new function).
-- Source of truth: supabase/usage_counters.sql (the block below is copied from it verbatim).

-- ==== BEFORE ====
-- Expected: the three existing functions, and NOT increment_usage_counters_all_or_none.
select p.proname, pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname like '%usage_counter%'
 order by 1;

-- ==== MIGRATION ====
-- One transaction: anon/authenticated can never call the function in the window
-- between CREATE and REVOKE (independent review, 29/09).
begin;

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

commit;

-- PostgREST caches the schema: without this the new RPC can answer PGRST202
-- ("function not found") until the cache reloads.
notify pgrst, 'reload schema';

-- ==== AFTER ====
-- 1. The function exists; anon/authenticated cannot execute it, service_role can
--    (expected: false, false, true -- the server code calls it as service_role).
select p.proname, pg_get_function_identity_arguments(p.oid) as args,
       has_function_privilege('service_role', p.oid, 'execute') as service_role_can_execute,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'increment_usage_counters_all_or_none';

-- 2. Harmless test calls on 'test:' buckets in period '2000-01' (never a real period).
-- Expected (a): allowed = true on both rows, new_value 1 and 2.
select * from increment_usage_counters_all_or_none(
  array['test:atomic:a', 'test:atomic:b'], array['2000-01', '2000-01'], array[1, 2]::bigint[], array[1, 5]::bigint[]);
-- Expected (b): allowed = false on both rows; row 1 over_cap = true; new_value still 1 and 2 (nothing changed).
select * from increment_usage_counters_all_or_none(
  array['test:atomic:a', 'test:atomic:b'], array['2000-01', '2000-01'], array[1, 1]::bigint[], array[1, 5]::bigint[]);
-- Expected (c): exactly two rows, values 1 and 2.
select bucket_key, period_key, value from usage_counters where bucket_key like 'test:atomic:%' and period_key = '2000-01' order by 1;

-- 3. Cleanup (only the test rows written above). Expected: DELETE 2.
delete from usage_counters where bucket_key like 'test:atomic:%' and period_key = '2000-01';
