// JSON to PHP (29/09). The dominant search is "json to php array"; the tool
// only produced a class, and a shallow one (nested objects typed `mixed`, a
// top-level array gave properties named $0, $1, a key like "first-name" gave
// `public string $first-name;`, which is a PHP syntax error).
//
// Two outputs now:
//   - jsonToPhpArray: the PHP array literal json_decode($json, true) returns,
//     short [] syntax, exact values (see the note on big integers);
//   - jsonToPhpClass: PHP 8 classes, one per nested object, with typed
//     promoted properties, nullable types for null/missing fields, array
//     element classes, and a fromArray() factory that maps the JSON keys.
import { parseJsonLossless, LosslessNumber } from './jsonLossless.js';

const PHP_INT_MAX = 9223372036854775807n;

function phpString(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function phpNumber(n, notes) {
  if (!(n instanceof LosslessNumber)) return String(n).replace('e+', 'E+');
  const src = n.source;
  if (n.isInteger) {
    const big = BigInt(src);
    if (big > PHP_INT_MAX || big < -PHP_INT_MAX - 1n) {
      // A PHP int cannot hold it; a float literal would silently round it.
      // Same choice as json_decode(..., JSON_BIGINT_AS_STRING).
      notes.add('Integers beyond PHP_INT_MAX are written as strings, as json_decode() does with JSON_BIGINT_AS_STRING; as a float they would lose digits.');
      return phpString(src);
    }
    return src;
  }
  if (!Number.isFinite(Number(src))) {
    notes.add(`${src} is beyond the range of a PHP float; it is written as a string.`);
    return phpString(src);
  }
  return src; // 1.10 stays 1.10 (PHP reads the same float)
}

function arrayLiteral(v, depth, notes) {
  const pad = '    '.repeat(depth + 1);
  const end = '    '.repeat(depth);
  if (v instanceof LosslessNumber || typeof v === 'number') return phpNumber(v, notes);
  if (v === null) return 'null';
  if (v === true) return 'true';
  if (v === false) return 'false';
  if (typeof v === 'string') return phpString(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return '[\n' + v.map((x) => pad + arrayLiteral(x, depth + 1, notes) + ',\n').join('') + end + ']';
  }
  const keys = Object.keys(v);
  if (keys.length === 0) return '[]';
  return '[\n' + keys.map((k) => pad + phpString(k) + ' => ' + arrayLiteral(v[k], depth + 1, notes) + ',\n').join('') + end + ']';
}

export function jsonToPhpArray(text, varName = 'data') {
  const value = parseJsonLossless(text);
  const notes = new Set();
  const body = arrayLiteral(value, 0, notes);
  const head = ['<?php', ''];
  for (const n of notes) head.push('// ' + n);
  if (notes.size) head.push('');
  return head.join('\n') + '$' + varName + ' = ' + body + ';\n';
}

// ---------- classes ----------

const RESERVED = new Set(('abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield self parent int float bool string mixed object iterable void never null true false').split(' '));

function words(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean);
}
function pascal(key) {
  const w = words(key).map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join('');
  const name = w || 'Item';
  return /^[0-9]/.test(name) ? 'N' + name : name;
}
function camel(key) {
  const w = words(key);
  if (w.length === 0) return 'field';
  let name = w[0].toLowerCase() + w.slice(1).map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join('');
  if (/^[0-9]/.test(name)) name = 'n' + name;
  return name;
}
function singular(name) {
  if (/ies$/.test(name)) return name.slice(0, -3) + 'y';
  if (/(ss|us)$/.test(name)) return name;
  if (/s$/.test(name) && name.length > 1) return name.slice(0, -1);
  return name + 'Item';
}

// Merged shape of every sample seen at one position.
function newShape() {
  return { null: false, bool: false, int: false, float: false, string: false, array: null, object: null, count: 0 };
}
function addSample(shape, v) {
  shape.count++;
  if (v === null) shape.null = true;
  else if (typeof v === 'boolean') shape.bool = true;
  else if (v instanceof LosslessNumber) {
    if (v.isInteger && BigInt(v.source) <= PHP_INT_MAX && BigInt(v.source) >= -PHP_INT_MAX - 1n) shape.int = true;
    else if (v.isInteger) shape.string = true; // kept as string (see jsonToPhpArray)
    else shape.float = true;
  } else if (typeof v === 'number') {
    if (Number.isInteger(v) && !/[.eE]/.test(String(v))) shape.int = true;
    else shape.float = true;
  } else if (typeof v === 'string') shape.string = true;
  else if (Array.isArray(v)) {
    shape.array = shape.array || newShape();
    for (const x of v) addSample(shape.array, x);
  } else {
    shape.object = shape.object || { fields: new Map(), samples: 0 };
    shape.object.samples++;
    for (const k of Object.keys(v)) {
      if (!shape.object.fields.has(k)) shape.object.fields.set(k, newShape());
      addSample(shape.object.fields.get(k), v[k]);
    }
  }
}

function kinds(shape) {
  return ['bool', 'int', 'float', 'string'].filter((k) => shape[k]).concat(shape.array ? ['array'] : [], shape.object ? ['object'] : []);
}

export function jsonToPhpClass(text, rootName = 'Root') {
  const value = parseJsonLossless(text);
  const root = newShape();
  const top = Array.isArray(value) ? value : [value];
  for (const v of top) addSample(root, v);
  if (!root.object || kinds(root).length !== 1) {
    throw new Error('A PHP class needs a JSON object (or an array of objects). For other JSON, use the "PHP array" output.');
  }
  const classes = [];
  const used = new Set();
  const uniq = (name) => { let n = name; let i = 2; while (used.has(n) || RESERVED.has(n.toLowerCase())) n = name + i++; used.add(n); return n; };

  function typeOf(shape, hintName) {
    const ks = kinds(shape);
    const nullable = shape.null;
    if (ks.length === 0) return { php: 'mixed', nullable: false, map: (e) => e };
    if (ks.length === 1 && ks[0] === 'object' && shape.object.fields.size === 0) return { php: 'array', nullable, map: (e) => e };
    if (ks.length === 1 && ks[0] === 'object') {
      const cls = emitClass(shape.object, hintName);
      return { php: cls, nullable, map: (e) => `${cls}::fromArray(${e})` };
    }
    if (ks.length === 1 && ks[0] === 'array') {
      const el = shape.array;
      const elKinds = kinds(el);
      if (elKinds.length === 1 && elKinds[0] === 'object' && !el.null) {
        const cls = emitClass(el.object, singular(hintName));
        return { php: 'array', doc: `${cls}[]`, nullable, map: (e) => `array_map(fn (array $item) => ${cls}::fromArray($item), ${e})` };
      }
      const inner = elKinds.length === 1 && elKinds[0] !== 'array' && elKinds[0] !== 'object' ? { bool: 'bool', int: 'int', float: 'float', string: 'string' }[elKinds[0]] : null;
      return { php: 'array', doc: inner ? `${el.null ? '?' : ''}${inner}[]` : null, nullable, map: (e) => e };
    }
    if (ks.length === 1) return { php: ks[0], nullable, map: (e) => e };
    if (ks.every((k) => k === 'int' || k === 'float')) return { php: 'float', nullable, map: (e) => e };
    return { php: 'mixed', nullable: false, map: (e) => e };
  }

  function emitClass(obj, hintName) {
    const name = uniq(pascal(hintName));
    const props = [];
    const propNames = new Set();
    for (const [key, shape] of obj.fields) {
      let prop = camel(key);
      let i = 2;
      while (propNames.has(prop)) prop = camel(key) + i++;
      propNames.add(prop);
      const t = typeOf(shape, key);
      const optional = shape.count < obj.samples; // missing in some objects
      const nullable = t.php !== 'mixed' && (t.nullable || optional);
      const access = `$data[${phpString(key)}]`;
      let arg;
      if (optional || t.nullable) {
        const mapped = t.map('$data[' + phpString(key) + ']');
        arg = mapped === access ? `${access} ?? null` : `isset(${access}) ? ${mapped} : null`;
      } else arg = t.map(access);
      props.push({ prop, key, type: (nullable ? '?' : '') + t.php, doc: t.doc, arg });
    }
    const lines = [];
    lines.push(`final class ${name}`, '{', '    public function __construct(');
    for (const p of props) {
      if (p.doc) lines.push(`        /** @var ${p.doc}${p.type.startsWith('?') ? '|null' : ''} */`);
      lines.push(`        public ${p.type} $${p.prop},`);
    }
    lines.push('    ) {', '    }', '', '    public static function fromArray(array $data): self', '    {', '        return new self(');
    for (const p of props) lines.push(`            ${p.prop}: ${p.arg},`);
    lines.push('        );', '    }', '}');
    classes.push(lines.join('\n'));
    return name;
  }

  emitClass(root.object, rootName);
  // Nested classes are emitted before their parent; show the root first.
  const ordered = [classes[classes.length - 1], ...classes.slice(0, -1)];
  const usage = Array.isArray(value)
    ? `// Usage: $items = array_map(fn (array $a) => ${used.values().next().value}::fromArray($a), json_decode($json, true));`
    : `// Usage: $root = ${used.values().next().value}::fromArray(json_decode($json, true));`;
  return ['<?php', '', '// Requires PHP 8.0+ (constructor promotion, named arguments).', usage, '', ordered.join('\n\n'), ''].join('\n');
}
