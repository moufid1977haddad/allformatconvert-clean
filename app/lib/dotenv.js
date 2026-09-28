// .env <-> JSON (29/09).
//
// Measured before: "export KEY=1" produced the key "export KEY"; a quoted
// multi-line value (dotenv supports KEY="line1<newline>line2") was cut at the
// first line and the next line became a bogus key; "\n" inside double quotes
// stayed two characters; an inline comment (KEY=value # note) was kept inside
// the value; 'it''s' quoting and backticks were ignored; and JSON to .env wrote
// a nested object as "[object Object]" and a value with spaces, # or a newline
// unquoted, which dotenv then reads back differently.
//
// Parsing follows the rules of motdotla/dotenv (the reference parser used by
// Node, Next.js, Vite…): optional "export ", KEY=VAL or KEY: VAL, single quotes
// literal, double quotes expand \n and \r, backticks, multi-line quoted values,
// "#" starts a comment only outside quotes. The line pattern below is the one
// dotenv's lib/main.js uses (MIT licence).
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

// Returns { entries: [[key, value], ...], ignored: [lineNumber, ...] }.
export function parseDotenv(src) {
  const text = src.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const entries = [];
  const covered = new Set();
  let match;
  LINE.lastIndex = 0;
  while ((match = LINE.exec(text)) != null) {
    if (match[0] === '') { LINE.lastIndex++; continue; }
    const key = match[1];
    let value = (match[2] || '').trim();
    const quote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');
    if (quote === '"') value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    entries.push([key, value, quote === "'" ? 'single' : quote === '"' ? 'double' : quote === '`' ? 'backtick' : 'none']);
    // remember which lines this match consumed, to report the others
    const startLine = text.slice(0, match.index).split('\n').length;
    const nLines = match[0].split('\n').length;
    for (let l = startLine; l < startLine + nLines; l++) covered.add(l);
  }
  const ignored = [];
  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t && !t.startsWith('#') && !covered.has(i + 1)) ignored.push(i + 1);
  });
  return { entries, ignored };
}

// "007" stays a string (a leading zero is meaningful: codes, phone numbers),
// as does any number JSON would not print back identically.
function typed(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(v) && String(Number(v)) === v) return Number(v);
  return v;
}

// ${VAR}, ${VAR:-default} and $VAR, as dotenv-expand resolves them: from
// variables defined earlier in the file (dotenv-expand expands quoted values too);
// \$ is a literal dollar sign.
function expand(value, known) {
  return value.replace(/(\\)?\$(?:\{([\w.-]+)(?::-([^}]*))?\}|([A-Za-z_]\w*))/g, (m, esc, braced, def, bare) => {
    if (esc) return m.slice(1);
    const name = braced || bare;
    if (Object.prototype.hasOwnProperty.call(known, name) && known[name] !== '') return known[name];
    return def !== undefined ? def : '';
  });
}

export function dotenvToJson(src, { types = false, expandVars = false, indent = 2 } = {}) {
  const { entries, ignored } = parseDotenv(src);
  const obj = {};
  const known = {};
  for (const [k, raw] of entries) {
    const v = expandVars ? expand(raw, known) : raw;
    known[k] = v;
    // Later assignments win, as in dotenv with override. defineProperty keeps
    // a key such as __proto__ an ordinary key.
    Object.defineProperty(obj, k, { value: types ? typed(v) : v, enumerable: true, writable: true, configurable: true });
  }
  return { json: JSON.stringify(obj, null, indent), ignored, count: entries.length };
}

function envValue(v) {
  if (v === null) return '';
  if (typeof v === 'object') v = JSON.stringify(v);
  const s = String(v);
  if (s === '') return '';
  // Unquoted is only safe for text dotenv reads back unchanged.
  if (/^[^\s'"`#\\]+$/.test(s) && s === s.trim()) return s;
  if (!s.includes("'") && !s.includes('\n') && !s.includes('\r')) return "'" + s + "'";
  if (!s.includes('"') && !s.includes('\\')) return '"' + s.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
  if (!s.includes('`')) return '`' + s + '`';
  throw new Error('A value contains single quotes, double quotes, backslashes and backticks together; no .env quoting can represent it exactly.');
}

export function jsonToDotenv(text) {
  const obj = JSON.parse(text.replace(/^﻿/, ''));
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('The JSON must be an object of KEY: value pairs.');
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (!/^[\w.-]+$/.test(k)) throw new Error(`"${k}" is not a valid .env variable name (letters, digits, _ . - only).`);
    lines.push(`${k}=${envValue(v)}`);
  }
  return lines.join('\n');
}
