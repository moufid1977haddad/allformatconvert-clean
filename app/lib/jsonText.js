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

// indent: number of spaces, or 0 to minify.
export function reformatJson(text, indent = 2) {
  validateJson(text);
  const pad = (depth) => (indent ? '\n' + ' '.repeat(indent * depth) : '');
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
