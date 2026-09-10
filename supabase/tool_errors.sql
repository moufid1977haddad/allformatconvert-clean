-- Sanitized, coarse-grained tool-failure log. Never contains the visitor's
-- file, its content, its real filename, or the raw IP -- see
-- docs/audit/RAPPORT-remontee-erreurs.md for the exact field contract.
-- Written by the public /api/report-error route (browser failures) and
-- directly by server routes that process visitor files (server failures).
-- Read by app/api/cron/health-check's daily aggregation (systemic vs
-- isolated detection) and, ad hoc, straight from the Supabase table editor.
create table if not exists tool_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tool text not null,
  source text not null check (source in ('browser', 'server')),
  ext text,
  size_bucket text,
  error_type text,
  error_message text,
  browser text
);
alter table tool_errors enable row level security;
-- No policies added: only the service role (lib/quota/supabaseAdmin.js) can
-- read/write this table, same pattern as usage_counters and usage_events.
create index if not exists tool_errors_tool_created_at_idx on tool_errors (tool, created_at);
create index if not exists tool_errors_created_at_idx on tool_errors (created_at);
