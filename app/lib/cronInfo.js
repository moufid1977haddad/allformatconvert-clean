// Cron expression check, description and next runs (29/09).
// Measured before: both cron pages announced "Build and validate cron
// expressions" but validated nothing -- "99 * * * *" or "0 0 31 2 *" (a day
// that never comes) were shown and copied as if valid. As crontab.guru does:
// a plain-English description (cronstrue) and the next run times computed by
// a cron parser (cron-parser), which also rejects out-of-range fields.
import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export function cronInfo(expr, { count = 5, from = new Date() } = {}) {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return { ok: false, error: `A standard cron expression has 5 fields (minute hour day month weekday); this one has ${fields.length}.` };
  let next;
  try {
    const it = CronExpressionParser.parse(expr.trim(), { currentDate: from });
    next = Array.from({ length: count }, () => it.next().toDate());
  } catch (e) {
    return { ok: false, error: `Invalid cron expression: ${e.message}` };
  }
  let description;
  try {
    description = cronstrue.toString(expr.trim(), { use24HourTimeFormat: true, throwExceptionOnParseError: true, verbose: true });
  } catch (e) {
    return { ok: false, error: `Invalid cron expression: ${String(e.message || e)}` };
  }
  return { ok: true, description, next };
}
