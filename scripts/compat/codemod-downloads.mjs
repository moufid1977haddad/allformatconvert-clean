// P18 step 3 codemod: every JSX result link `<a href={X} download={N} ...>label</a>` of the tools becomes the site's
// one download component `<FileDownload href={X} name={N} />` (app/components/FileDownload.jsx), which shows the
// name, format, size, a "Download" button and, on iPhone/iPad, "Save / Share".
// Dry run by default (lists what it would change and what it leaves for a hand edit); --write applies.
// Usage: node scripts/compat/codemod-downloads.mjs [--write] [paths…]
import fs from 'node:fs';
import path from 'node:path';

const write = process.argv.includes('--write');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.jsx$/.test(e.name)) yield p;
  }
}

// Reads a JSX attribute value starting at s[i] ('{' or '"'), returns [valueSource, endIndex].
function readValue(s, i) {
  if (s[i] === '"' || s[i] === "'") { const q = s[i]; const j = s.indexOf(q, i + 1); return [s.slice(i, j + 1), j + 1]; }
  if (s[i] !== '{') return null;
  // stack of contexts: 'c' = code inside braces, '`' = template literal (whose ${ } open a new code context)
  const stack = ['c'];
  for (let j = i + 1; j < s.length; j++) {
    const c = s[j], top = stack[stack.length - 1];
    if (top === '`') {
      if (c === '\\') j++;
      else if (c === '`') stack.pop();
      else if (c === '$' && s[j + 1] === '{') { stack.push('c'); j++; }
      continue;
    }
    if (c === '"' || c === "'") { const q = c; j++; while (j < s.length && s[j] !== q) { if (s[j] === '\\') j++; j++; } continue; }
    if (c === '`') stack.push('`');
    else if (c === '{') stack.push('c');
    else if (c === '}') { stack.pop(); if (!stack.length) return [s.slice(i, j + 1), j + 1]; }
  }
  return null;
}

function parseTag(s, start) {
  // s[start] === '<', tag name 'a'
  let i = start + 2;
  const attrs = [];
  for (;;) {
    while (/\s/.test(s[i])) i++;
    if (s[i] === '>') return { attrs, end: i + 1 };
    if (s.startsWith('/>', i)) return { attrs, end: i + 2, selfClose: true };
    const m = /^[A-Za-z_:][-\w:.]*/.exec(s.slice(i));
    if (!m) return null;
    const name = m[0];
    i += name.length;
    if (s[i] === '=') {
      const v = readValue(s, i + 1);
      if (!v) return null;
      attrs.push({ name, value: v[0] });
      i = v[1];
    } else attrs.push({ name, value: null });
  }
}

const changed = [], left = [];
for (const file of (only.length ? only : [...walk('app/tools')])) {
  let s = fs.readFileSync(file, 'utf8');
  let out = '', pos = 0, n = 0;
  const re = /<a\s/g;
  let m;
  while ((m = re.exec(s))) {
    const tag = parseTag(s, m.index);
    if (!tag) continue;
    const at = Object.fromEntries(tag.attrs.map((a) => [a.name, a.value]));
    if (!('download' in at)) continue;
    const close = s.indexOf('</a>', tag.end);
    const label = s.slice(tag.end, close).trim();
    const extra = tag.attrs.map((a) => a.name).filter((k) => !['href', 'download', 'className', 'key'].includes(k));
    const line = s.slice(0, m.index).split('\n').length;
    if (!at.href || !at.download || at.download === null || extra.length || close < 0 || /<a\s/.test(s.slice(tag.end, close))) {
      left.push(`${file}:${line} extra=[${extra}] ${s.slice(m.index, Math.min(close + 4, m.index + 200)).replace(/\s+/g, ' ')}`);
      continue;
    }
    const keyAttr = at.key ? ` key=${at.key}` : '';
    const repl = `<FileDownload${keyAttr} href=${at.href} name=${at.download} />`;
    out += s.slice(pos, m.index) + repl;
    pos = close + 4;
    re.lastIndex = pos;
    n++;
    changed.push(`${file}:${line} ${label.slice(0, 60)} -> ${repl.slice(0, 140)}`);
  }
  if (!n) continue;
  out += s.slice(pos);
  if (!/import \{[^}]*\bFileDownload\b[^}]*\} from '[./]+\/components\/FileDownload'/.test(out)) {
    const rel = path.relative(path.dirname(file), 'app/components/FileDownload').replace(/\\/g, '/');
    const lines = out.split('\n');
    let last = -1;
    for (let i = 0; i < Math.min(lines.length, 60); i++) if (/^import .* from ['"].*['"];?\s*$/.test(lines[i])) last = i;
    lines.splice(last + 1, 0, `import { FileDownload } from '${rel.startsWith('.') ? rel : './' + rel}';`);
    out = lines.join('\n');
  }
  if (write) fs.writeFileSync(file, out);
}
console.log(`WOULD CHANGE / CHANGED (${changed.length}):\n` + changed.join('\n'));
console.log(`\nLEFT FOR A HAND EDIT (${left.length}):\n` + left.join('\n'));
