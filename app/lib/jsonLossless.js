// Lossless JSON parsing for the converters (JSON to CSV / YAML / XML / PHP…).
//
// JSON.parse turns every number into a JS double: 12345678901234567890 becomes
// 12345678901234567000, 1.10 becomes 1.1, 1e400 becomes Infinity. Measured on
// 29/09 in JSON to CSV, JSON to YAML, JSON to XML and JSON Minifier -- each
// wrote the altered number without a word (the same defect json-formatter had
// on 22/09, see app/lib/jsonText.js). A 64-bit id is ordinary in real JSON.
//
// parseJsonLossless() keeps a number as a plain JS number only when printing it
// back gives exactly the text that was written; otherwise it returns a
// LosslessNumber that carries the original text. JSON.parse still runs first as
// the validator, so invalid JSON gets the browser's own error, never a guess.

export class LosslessNumber {
  constructor(source) {
    this.source = source;
  }
  toString() {
    return this.source;
  }
  get isInteger() {
    return /^-?\d+$/.test(this.source);
  }
}

export function isLosslessNumber(v) {
  return v instanceof LosslessNumber;
}

function numberFrom(src) {
  const n = Number(src);
  return String(n) === src ? n : new LosslessNumber(src);
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

// { keyOrder: true } (P37, 06/10): each object is returned as a Map, in the order its keys are written. A plain object
// lists keys that are whole numbers ("2", "10") first, in numeric order, whatever the source order; JSON to CSV and
// JSON to YAML put them first that way. A repeated key keeps its first position and its last value, as JSON.parse.
export function parseJsonLossless(input, { keyOrder = false } = {}) {
  const text = stripBom(input);
  JSON.parse(text); // validator: throws the browser's own message on bad JSON
  let i = 0;
  const ws = () => {
    while (i < text.length && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r')) i++;
  };
  const str = () => {
    let j = i + 1;
    while (text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
    const lit = text.slice(i, j + 1);
    i = j + 1;
    return JSON.parse(lit);
  };
  const value = () => {
    ws();
    const c = text[i];
    if (c === '{') {
      i++;
      const obj = keyOrder ? new Map() : {};
      ws();
      if (text[i] === '}') { i++; return obj; }
      for (;;) {
        ws();
        const k = str();
        ws();
        i++; // ':'
        const v = value();
        // defineProperty so a "__proto__" key stays an ordinary key
        if (keyOrder) obj.set(k, v);
        else Object.defineProperty(obj, k, { value: v, enumerable: true, writable: true, configurable: true });
        ws();
        if (text[i] === ',') { i++; continue; }
        i++; // '}'
        return obj;
      }
    }
    if (c === '[') {
      i++;
      const arr = [];
      ws();
      if (text[i] === ']') { i++; return arr; }
      for (;;) {
        arr.push(value());
        ws();
        if (text[i] === ',') { i++; continue; }
        i++; // ']'
        return arr;
      }
    }
    if (c === '"') return str();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    NUMBER.lastIndex = i;
    const m = NUMBER.exec(text);
    i += m[0].length;
    return numberFrom(m[0]);
  };
  return value();
}

// A UTF-8 BOM (U+FEFF) at the start of pasted or loaded text makes JSON.parse
// fail with an unhelpful "Unexpected token". Every converter strips it first.
export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// Replace every LosslessNumber by its source text (for formats where all
// values are text anyway: XML, CSV).
export function losslessToText(v) {
  if (v instanceof LosslessNumber) return v.source;
  if (Array.isArray(v)) return v.map(losslessToText);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) {
      Object.defineProperty(out, k, { value: losslessToText(v[k]), enumerable: true, writable: true, configurable: true });
    }
    return out;
  }
  return v;
}
