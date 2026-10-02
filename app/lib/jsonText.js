// Lossless JSON formatting: re-indents the ORIGINAL text instead of
// JSON.stringify(JSON.parse(text)).
//
// Measured 2026-09-22 (docs/audit/RAPPORT-outils-mis-en-avant.md): the JSON
// Formatter turned "id": 12345678901234567890 into 12345678901234567000 (beyond
// 2^53 a JS number cannot hold it), 1.10 into 1.1 and 1e21 into 1e+21 -- silently,
// in a tool whose whole job is to change nothing but whitespace. A 64-bit id is
// ordinary in real JSON (database keys, tweet ids, payment ids).
//
// JSON.parse is still the validator (same errors as before, never a guess);
// only the output is produced from the source text, so every number, escape and
// key order stays exactly as the visitor wrote it.

// Throws the parser's own error (its message names the position) when invalid.
export function validateJson(text) {
  JSON.parse(text);
}

// indent: number of spaces, '\t' for tabs (P24), or 0 to minify.
export function reformatJson(text, indent = 2) {
  validateJson(text);
  const unit = typeof indent === 'string' ? indent : ' '.repeat(indent);
  const pad = (depth) => (indent ? '\n' + unit.repeat(depth) : '');
  let out = '';
  let depth = 0;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      // Copy the whole string literal verbatim, escapes included.
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === '{' || c === '[') {
      // Keep empty containers on one line: {} and [].
      let j = i + 1;
      while (j < n && ' \t\n\r'.includes(text[j])) j++;
      const close = c === '{' ? '}' : ']';
      if (text[j] === close) { out += c + close; i = j + 1; continue; }
      depth++;
      out += c + pad(depth);
      i++;
      continue;
    }
    if (c === '}' || c === ']') { depth--; out += pad(depth) + c; i++; continue; }
    if (c === ',') { out += ',' + pad(depth); i++; continue; }
    if (c === ':') { out += indent ? ': ' : ':'; i++; continue; }
    // Numbers, true, false, null: copied character for character.
    out += c;
    i++;
  }
  return out;
}

// ---- P24 (03/10), against jsonformatter.org: where the first error is (Safari's JSON.parse names no position at all),
// and keys sorted without touching a number.

/** { line, column, offset } of the first syntax error in text, or null when it parses. A small strict JSON scanner. */
export function jsonErrorPosition(text) {
  let i = 0;
  const n = text.length;
  const ws = () => { while (i < n && ' \t\n\r'.includes(text[i])) i++; };
  const fail = () => { throw i; };
  const value = () => {
    ws();
    const c = text[i];
    if (c === '{') { i++; ws(); if (text[i] === '}') { i++; return; } for (;;) { ws(); if (text[i] !== '"') fail(); str(); ws(); if (text[i] !== ':') fail(); i++; value(); ws(); if (text[i] === ',') { i++; continue; } if (text[i] === '}') { i++; return; } fail(); } }
    if (c === '[') { i++; ws(); if (text[i] === ']') { i++; return; } for (;;) { value(); ws(); if (text[i] === ',') { i++; continue; } if (text[i] === ']') { i++; return; } fail(); } }
    if (c === '"') return str();
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|^true|^false|^null/.exec(text.slice(i, i + 400));
    if (!m) fail();
    i += m[0].length;
  };
  const str = () => {
    i++;
    while (i < n && text[i] !== '"') {
      if (text.charCodeAt(i) < 0x20) fail();
      if (text[i] === '\\') { const e = text[i + 1]; if (e === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail(); i += 6; continue; } if (!'"\\/bfnrt'.includes(e)) fail(); i += 2; continue; }
      i++;
    }
    if (i >= n) fail();
    i++;
  };
  try { value(); ws(); if (i < n) fail(); return null; } catch (at) {
    if (typeof at !== 'number') throw at;
    const before = text.slice(0, at), line = before.split('\n').length, column = at - before.lastIndexOf('\n');
    return { line, column, offset: at };
  }
}

/** The JSON with every object's keys sorted (A-Z, recursively); numbers written exactly as in the source. */
export async function sortJsonKeys(text) {
  const { parseJsonLossless, isLosslessNumber } = await import('./jsonLossless.js');
  const write = (v) => {
    if (isLosslessNumber(v)) return v.source;
    if (Array.isArray(v)) return '[' + v.map(write).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).map((k) => JSON.stringify(k) + ':' + write(v[k])).join(',') + '}';
    return JSON.stringify(v);
  };
  return write(parseJsonLossless(text));
}
