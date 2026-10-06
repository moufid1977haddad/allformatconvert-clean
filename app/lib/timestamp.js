// Unix timestamp parsing (29/09). Measured before: a 13-digit millisecond
// timestamp (Date.now(), JavaScript, Java, most APIs) was read as seconds and
// shown as a date in the year 55 000+ without a word; "12abc" was read as 12;
// the date field received a toLocaleString() text it cannot display, so it
// went blank; and only the local time zone was shown.
//
// As epochconverter.com does: the unit is inferred from the number of digits
// (up to 11 = seconds, 12-14 = milliseconds, 15-17 = microseconds, 18-20 =
// nanoseconds) and always shown, and the date is given in UTC and local time.

const UNITS = [
  { max: 11, name: 'seconds', toMs: (n) => n * 1000n, frac: 0 },
  { max: 14, name: 'milliseconds', toMs: (n) => n, frac: 0 },
  { max: 17, name: 'microseconds', toMs: (n) => n / 1000n, frac: 3 },
  { max: 20, name: 'nanoseconds', toMs: (n) => n / 1000000n, frac: 6 },
];
const MAX_MS = 8640000000000000n; // ECMAScript Date range: ±100 000 000 days

export function parseTimestamp(input) {
  const s = input.trim();
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) throw new Error('Enter a number of seconds (decimals allowed), milliseconds, microseconds or nanoseconds — digits only, optionally negative.');
  const [, sign, intPart, fracPart] = m;
  const digits = intPart.replace(/^0+(?=\d)/, '').length;
  const unit = UNITS.find((u) => digits <= u.max);
  if (!unit) throw new Error('This number has more than 20 digits; it is not a Unix timestamp in any common unit.');
  let n = BigInt(intPart);
  let ms = unit.toMs(n);
  // Fractional seconds (e.g. 1700000000.5 from Python's time.time()).
  if (fracPart && unit.name === 'seconds') ms += BigInt((fracPart + '000').slice(0, 3));
  if (sign) ms = -ms;
  if (ms > MAX_MS || ms < -MAX_MS) throw new Error('This timestamp is outside the range a calendar date can represent (from year -271821 to year 275760).');
  return { ms: Number(ms), unit: unit.name };
}

const pad = (x, n = 2) => String(x).padStart(n, '0');

// Value for <input type="datetime-local"> in the visitor's time zone.
export function toDatetimeLocalValue(ms) {
  const d = new Date(ms);
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function describe(ms) {
  const d = new Date(ms);
  return {
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' }),
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
  };
}

// "2024-01-01T10:00" (datetime-local, visitor's zone) -> ms, or throw.
export function parseDatetimeLocal(value) {
  const m = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) throw new Error('Pick a date and time first.');
  const d = new Date(2000, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0));
  d.setFullYear(Number(m[1])); // new Date(y, …) maps years 0-99 to 1900-1999
  return d.getTime();
}

// P24 (03/10): any IANA time zone, both ways, and the relative time — what epochconverter.com offers besides UTC and
// local. A wall-clock time that does not exist in the zone (the hour skipped when clocks go forward) is refused, where
// new Date(y, m, d, h) moved it an hour on without a word; one that happens twice (clocks go back) is read as the
// first and said.
const partsIn = (ms, timeZone) => {
  const f = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', era: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const y = Number(p.year);
  return { year: p.era === 'BC' || p.era === 'B' ? 1 - y : y, month: Number(p.month), day: Number(p.day), hour: Number(p.hour) % 24, minute: Number(p.minute), second: Number(p.second) };
};
const utcOf = (q) => { const d = new Date(Date.UTC(2000, q.month - 1, q.day, q.hour, q.minute, q.second)); d.setUTCFullYear(q.year); return d.getTime(); };
export const offsetMs = (ms, timeZone) => { const whole = ms - (((ms % 1000) + 1000) % 1000); return utcOf(partsIn(whole, timeZone)) - whole; };

export function toZoneValue(ms, timeZone) {
  const q = partsIn(ms, timeZone);
  return `${q.year < 0 ? '-' + pad(-q.year, 4) : pad(q.year, 4)}-${pad(q.month)}-${pad(q.day)}T${pad(q.hour)}:${pad(q.minute)}:${pad(q.second)}`;
}

export function parseInZone(value, timeZone) {
  const m = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) throw new Error('Pick a date and time first.');
  const want = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]), hour: Number(m[4]), minute: Number(m[5]), second: Number(m[6] || 0) };
  const wall = utcOf(want);
  let target;
  try { target = toZoneValue(wall, 'UTC'); } catch { throw new Error('This date is outside the range a calendar date can represent (from year -271821 to year 275760).'); }
  // the instants this wall time could be: wall minus each offset the zone has around it
  // probes a day either side (within the Date range: 275760-09-13 would overflow it); review 03/10
  const probe = (t) => { try { return offsetMs(t, timeZone); } catch { return null; } };
  const candidates = [...new Set([probe(wall - 86400000), probe(wall), probe(wall + 86400000)].filter((o) => o !== null))]
    .map((off) => wall - off).filter((t) => { try { return toZoneValue(t, timeZone) === target; } catch { return false; } }).sort((a, b) => a - b);
  if (!candidates.length) throw new Error(`${value.replace('T', ' ')} does not exist in ${timeZone}: the clocks skip that time there (daylight saving time starting, or a change of time zone).`);
  // how much later the second occurrence is (one hour in most zones, 30 minutes at Lord Howe)
  return { ms: candidates[0], ambiguous: candidates.length > 1, gapMinutes: candidates.length > 1 ? Math.round((candidates[candidates.length - 1] - candidates[0]) / 60000) : 0 };
}

export function describeZone(ms, timeZone) {
  // whole seconds: historical local mean times have them (Paris 1900: +00:09:21); review 03/10
  const off = Math.round(offsetMs(ms, timeZone) / 1000), a = Math.abs(off);
  const hms = `${pad(Math.floor(a / 3600))}:${pad(Math.floor(a / 60) % 60)}${a % 60 ? ':' + pad(a % 60) : ''}`;
  const bc = partsIn(ms, timeZone).year <= 0; // the era is written out, else 4 BC read as AD 4
  const text = new Date(ms).toLocaleString('en-GB', bc ? { timeZone, era: 'short', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' } : { timeZone, dateStyle: 'full', timeStyle: 'medium' });
  return `${text} (UTC${off < 0 ? '−' : '+'}${hms})`;
}

export function relativeTime(ms, now = Date.now()) {
  const s = Math.round((ms - now) / 1000), a = Math.abs(s);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of [['year', 31556952], ['month', 2629746], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (a >= size) return rtf.format(Math.trunc(s / size), unit);
  }
  return rtf.format(s, 'second');
}
