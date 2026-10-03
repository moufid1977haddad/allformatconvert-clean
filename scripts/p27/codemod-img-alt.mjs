// P27 phase 5 (one-off codemod, kept for the record): every <img> of the tool pages and shared components without an
// alt attribute (axe image-alt, serious: found on the previews shown after a file is chosen) gets one -- "Preview of
// your image" for a preview drawn from the visitor's file (src from a state / object URL), "" for the rest (decorative:
// the page already says in words what it shows). Positions from @babel/parser. --write applies.
//   node scripts/p27/codemod-img-alt.mjs [--write]
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const write = process.argv.includes('--write');
const files = [];
const walk = (d) => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); if (fs.statSync(f).isDirectory()) walk(f); else if (/\.(jsx|tsx)$/.test(n)) files.push(f); } };
walk('app/tools');
walk('app/components');
let total = 0;
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  if (!raw.includes('<img')) continue;
  const ast = parse(raw, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const inserts = [];
  const visit = (x) => {
    if (!x || typeof x.type !== 'string') return;
    if (x.type === 'JSXOpeningElement' && x.name.type === 'JSXIdentifier' && x.name.name === 'img') {
      const has = x.attributes.some((a) => a.type === 'JSXSpreadAttribute' || a.name?.name === 'alt');
      if (!has) {
        const src = x.attributes.find((a) => a.name?.name === 'src');
        const dynamic = src && src.value && src.value.type === 'JSXExpressionContainer';
        inserts.push([x.name.end, dynamic ? ' alt="Preview of your image"' : ' alt=""']);
      }
    }
    for (const k of Object.keys(x)) { if (k === 'loc') continue; const v = x[k]; if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === 'string') visit(v); }
  };
  visit(ast.program);
  if (!inserts.length) continue;
  let s = raw;
  for (const [at, text] of inserts.sort((a, b) => b[0] - a[0])) s = s.slice(0, at) + text + s.slice(at);
  total += inserts.length;
  console.log(`${f}: ${inserts.length}`);
  if (write) fs.writeFileSync(f, s);
}
console.log(`${total} <img> given an alt${write ? ' (written)' : ' (dry run)'}`);
