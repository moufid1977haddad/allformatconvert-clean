-- Migration: convert global-spend accounting from integer cents to integer
-- micro-dollars (1 USD = 1,000,000 micros). Math.ceil-at-the-cent was
-- distorting small real costs by up to ~100x (a real $0.00008925 call was
-- recorded as a full cent, 112x its real cost), which would close a $20
-- global cap after ~2,000 calls instead of after $20 of real spend.
-- Replayable: both statements are no-ops if run again after already applied.

-- 1. Rescale and rename the global spend counter bucket (1 cent = 10,000 micros).
update usage_counters
   set bucket_key = 'global_spend_microusd',
       value = value * 10000
 where bucket_key = 'global_spend_cents';

-- 2. Rename and rescale the per-event cost column. int32 (`estimated_cost_cents`'s
--    existing type) comfortably holds micro-dollar amounts at this system's scale
--    (worst case per event is a few hundred thousand micros; overflow would need
--    a single event costing >$2,000) -- no type change, guarded so a second run
--    is a safe no-op rather than an error on the already-renamed column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'usage_events' and column_name = 'estimated_cost_cents'
  ) then
    alter table usage_events rename column estimated_cost_cents to estimated_cost_micros;
    update usage_events set estimated_cost_micros = estimated_cost_micros * 10000;
  end if;
end $$;
