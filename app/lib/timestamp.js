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
  if (!m) throw new Error('Enter a whole number of seconds (or milliseconds, microseconds, nanoseconds) — digits only, optionally negative.');
  const [, sign, intPart, fracPart] = m;
  const digits = intPart.replace(/^0+(?=\d)/, '').length;
  const unit = UNITS.find((u) => digits <= u.max);
  if (!unit) throw new Error('This number has more than 20 digits; it is not a Unix timestamp in any common unit.');
  let n = BigInt(intPart);
  let ms = unit.toMs(n);
  // Fractional seconds (e.g. 1700000000.5 from Python's time.time()).
  if (fracPart && unit.name === 'seconds') ms += BigInt((fracPart + '000').slice(0, 3));
  if (sign) ms = -ms;
  if (ms > MAX_MS || ms < -MAX_MS) throw new Error('This timestamp is outside the range a calendar date can represent (year ±275 760).');
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
