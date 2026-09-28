// JSON <-> YAML without silently altering a value (29/09).
//
// Measured before this file existed:
//   - JSON to YAML: 12345678901234567890 came out as 12345678901234567000 and
//     1.10 as 1.1 (JSON.parse doubles);
//   - YAML to JSON: the default js-yaml schema turned 2024-01-01 into
//     "2024-01-01T00:00:00.000Z", a 20-digit integer lost its last digits, .inf
//     and .nan became null (JSON.stringify), and a file with several
//     "---" documents was refused.
import yaml from 'js-yaml';
import { parseJsonLossless, LosslessNumber } from './jsonLossless.js';

// Placeholders for numbers that must be written verbatim: js-yaml and
// JSON.stringify would otherwise print a JS double. The nonce makes a
// collision with the visitor's own text impossible in practice, and the
// replacement is checked (count) rather than assumed.
function placeholderSet(text) {
  let nonce;
  do nonce = Math.random().toString(36).slice(2, 10); while (text.includes(nonce));
  const values = [];
  return {
    put(source) { values.push(source); return `__N${nonce}_${values.length - 1}__`; },
    restore(out, quoted) {
      let count = 0;
      const re = quoted ? new RegExp(`"__N${nonce}_(\\d+)__"`, 'g') : new RegExp(`__N${nonce}_(\\d+)__`, 'g');
      const res = out.replace(re, (_, idx) => { count++; return values[Number(idx)]; });
      if (count !== values.length) throw new Error('Internal error while writing numbers exactly — nothing was converted.');
      return res;
    },
  };
}

function mapNumbers(v, fn) {
  if (v instanceof LosslessNumber) return fn(v);
  if (Array.isArray(v)) return v.map((x) => mapNumbers(x, fn));
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out = {};
    for (const k of Object.keys(v)) {
      Object.defineProperty(out, k, { value: mapNumbers(v[k], fn), enumerable: true, writable: true, configurable: true });
    }
    return out;
  }
  return v;
}

export function jsonToYaml(text) {
  const value = parseJsonLossless(text);
  const ph = placeholderSet(text);
  const withPh = mapNumbers(value, (n) => ph.put(n.source));
  return ph.restore(yaml.dump(withPh, { lineWidth: -1, noRefs: true }), false);
}

// YAML 1.2 core integers, kept exact beyond 2^53 (0x, 0o, 0b and _ included).
const exactInt = new yaml.Type('tag:yaml.org,2002:int', {
  ...yaml.types.int.options,
  construct(data) {
    const n = yaml.types.int.construct(data);
    if (Number.isSafeInteger(n)) return n;
    let s = data.replace(/_/g, '');
    let neg = false;
    if (s[0] === '-' || s[0] === '+') { neg = s[0] === '-'; s = s.slice(1); }
    return new LosslessNumber((neg ? '-' : '') + BigInt(s).toString());
  },
});

// Core schema (no timestamp/binary/set conversions), with exact integers.
const SCHEMA = yaml.FAILSAFE_SCHEMA.extend({
  implicit: [yaml.types.null, yaml.types.bool, exactInt, yaml.types.float],
  explicit: [],
});

function checkFinite(v, path) {
  if (typeof v === 'number' && !Number.isFinite(v)) {
    throw new Error(`${path || 'The document'} is ${Number.isNaN(v) ? '.nan' : v > 0 ? '.inf' : '-.inf'}, which JSON cannot represent. Replace it with a number, a string or null.`);
  }
  if (Array.isArray(v)) v.forEach((x, i) => checkFinite(x, `${path}[${i}]`));
  else if (v && typeof v === 'object' && !(v instanceof LosslessNumber)) {
    for (const k of Object.keys(v)) checkFinite(v[k], path ? `${path}.${k}` : k);
  }
}

export function yamlToJson(text, indent = 2) {
  const docs = yaml.loadAll(text.replace(/^﻿/, ''), null, { schema: SCHEMA });
  // Several "---" documents become one JSON array, one element per document.
  const value = docs.length === 0 ? null : docs.length === 1 ? docs[0] : docs;
  checkFinite(value, '');
  const ph = placeholderSet(text);
  const withPh = mapNumbers(value === undefined ? null : value, (n) => ph.put(n.source));
  return ph.restore(JSON.stringify(withPh, null, indent), true);
}
