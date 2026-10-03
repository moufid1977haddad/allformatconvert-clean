// P27 phase 6 (one-off codemod, kept for the record): the upload areas' fixed words "Click or drop X here" /
// "Click to upload X" become <UploadPrompt what="X" /> (app/components/UploadPrompt.jsx), which says "Click or drop X
// here" with a mouse and "Choose X" on a touch screen. Only where the words are a JSX CHILD -- a text node, or the
// last branch of a `{cond ? … : 'words'}` child expression; never inside an attribute, a template string or an
// instructions text. Prints every change; --write applies them.
//   node scripts/p27/codemod-upload-prompt.mjs [--write]
import fs from 'node:fs';
import path from 'node:path';

const write = process.argv.includes('--write');
const files = [];
const walk = (d) => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); if (fs.statSync(f).isDirectory()) walk(f); else if (/\.jsx$/.test(n)) files.push(f); } };
walk('app/tools');
walk('app/components');

const PHRASE = /^(?:Click or drop (.+?) here|Click to upload (.+?))$/;
const IMPORT = "import UploadPrompt from '@/app/components/UploadPrompt';";
let changed = 0, skipped = 0;
for (const f of files) {
  if (f.endsWith('UploadPrompt.jsx')) continue;
  const raw = fs.readFileSync(f, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = raw.replace(/\r\n/g, '\n');
  let n = 0;
  // 1. text child: >Click or drop an image here<
  s = s.replace(/>(\s*)(Click or drop [^<>{}\n]+? here|Click to upload [^<>{}\n(]+?)(\s*)</g, (m, a, phrase, b) => {
    const what = phrase.match(PHRASE);
    if (!what) return m;
    n++;
    return `>${a}<UploadPrompt what="${(what[1] || what[2]).trim()}" />${b}<`;
  });
  // 2. last branch of a child ternary: : 'Click or drop a PDF here'}
  s = s.replace(/:\s*(['"])(Click or drop [^'"\n]+? here|Click to upload [^'"\n(]+?)\1(\s*)\}/g, (m, q, phrase, sp, offset) => {
    // the `{` that opens this expression must be a child position (after `>` or a line start), not `attr={`
    let depth = 0, i = offset;
    for (; i >= 0; i--) { const c = s[i]; if (c === '}') depth++; else if (c === '{') { if (depth === 0) break; depth--; } }
    const before = s.slice(Math.max(0, i - 40), i).replace(/\s+$/, '');
    if (i < 0 || /=$/.test(before) || (s.slice(i, offset).match(/`/g) || []).length % 2) { skipped++; console.log(`SKIP ${f}: ${phrase}`); return m; }
    const what = phrase.match(PHRASE);
    n++;
    return `: <UploadPrompt what="${(what[1] || what[2]).trim()}" />${sp}}`;
  });
  if (!n) continue;
  if (!s.includes(IMPORT)) {
    const lines = s.split('\n');
    let last = -1;
    lines.forEach((l, i) => { if (/^import .* from ['"].*['"];?\s*$/.test(l)) last = i; });
    if (last < 0) { console.log(`NO IMPORT LINE ${f}`); continue; }
    lines.splice(last + 1, 0, IMPORT);
    s = lines.join('\n');
  }
  changed++;
  console.log(`${f}: ${n}`);
  if (write) fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s);
}
console.log(`${changed} files, ${skipped} skipped${write ? ' (written)' : ' (dry run)'}`);
