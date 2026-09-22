// Number display and parsing that never shows a wrong value as if it were right.
// Measured 2026-09-22 (docs/audit/RAPPORT-outils-mis-en-avant.md):
//   - toFixed(4)/toFixed(2) displayed 1 mm = "0.0000" mile and 0.001 % of 5 = "0.00",
//     and 1 km = "39370.1000" inch (true value 39370.0787: false precision);
//   - parseInt() read "1012" in binary as 5 and "12abc" as 12 without a word, and
//     lost 2^64 - 1 (hexadecimal shown: 10000000000000000).

// Up to `digits` significant digits, no exponent, no trailing zeros: 6.2137119224e-7
// -> "0.00000062137119224", 212 -> "212", 1/3 -> "0.3333333333".
export function formatSignificant(value, digits = 10) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: digits, useGrouping: false }).format(value);
}

const DIGITS = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^[0-9]+$/, 16: /^[0-9a-f]+$/i };
const PREFIX = { 2: '0b', 8: '0o', 16: '0x' };

// Exact integer in the given base (arbitrary size), or null when the text is not
// a valid number in that base. Accepts an optional sign and the base's own 0b/0o/0x prefix.
export function parseInBase(text, base) {
  let s = String(text).trim().replace(/[_\s]/g, '');
  let negative = false;
  if (s.startsWith('-')) { negative = true; s = s.slice(1); }
  if (PREFIX[base] && s.toLowerCase().startsWith(PREFIX[base])) s = s.slice(2);
  if (!DIGITS[base] || !DIGITS[base].test(s)) return null;
  const n = BigInt((PREFIX[base] || '') + s);
  return negative ? -n : n;
}

// Roman numerals: only the canonical form is accepted, so "IM", "VX", "IIII" or
// "MMMM" are refused instead of being turned into 999, 5, 4 or 4000.
const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return '';
  let out = '';
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}
export function fromRoman(text) {
  const s = String(text).trim().toUpperCase();
  if (!/^[MDCLXVI]+$/.test(s)) return null;
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let n = 0;
  for (let i = 0; i < s.length; i++) n += map[s[i]] < (map[s[i + 1]] || 0) ? -map[s[i]] : map[s[i]];
  return toRoman(n) === s ? n : null;
}
