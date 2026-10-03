// P27 phase 7 (one-off codemod, kept for the record): every CONTROLLED <textarea value={…}> of the tool pages and shared
// tool components becomes <TextArea> (app/components/TextArea.jsx: same props, no freeze above 1 M characters).
// Uncontrolled fields (defaultValue / no value) stay native. Positions come from the JSX parser (@babel/parser), so
// attributes with arrows ("e => …") cannot confuse it. Prints every change; --write applies them.
//   node scripts/p27/codemod-textarea.mjs [--write]
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const write = process.argv.includes('--write');
const files = [];
const walk = (d) => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); if (fs.statSync(f).isDirectory()) walk(f); else if (/\.(jsx|tsx)$/.test(n)) files.push(f); } };
walk('app/tools');
walk('app/components');
const IMPORT = "import TextArea from '@/app/components/TextArea';";

let total = 0, fileCount = 0;
for (const f of files) {
  if (/TextArea\.jsx$/.test(f)) continue;
  const raw = fs.readFileSync(f, 'utf8');
  if (!raw.includes('<textarea')) continue;
  let ast;
  try { ast = parse(raw, { sourceType: 'module', plugins: ['jsx', 'typescript'] }); } catch (e) { console.log(`PARSE ${f} ${e.message}`); continue; }
  const edits = [];
  const visit = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'JSXElement' && node.openingElement.name.type === 'JSXIdentifier' && node.openingElement.name.name === 'textarea') {
      const attrs = node.openingElement.attributes.filter((a) => a.type === 'JSXAttribute').map((a) => a.name.name);
      if (attrs.includes('value') && !node.openingElement.attributes.some((a) => a.type === 'JSXSpreadAttribute')) {
        edits.push([node.openingElement.name.start, node.openingElement.name.end]);
        if (node.closingElement) edits.push([node.closingElement.name.start, node.closingElement.name.end]);
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (k === 'loc' || k === 'start' || k === 'end') continue;
      if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === 'string') visit(v);
    }
  };
  visit(ast.program);
  if (!edits.length) continue;
  let s = raw;
  for (const [a, b] of edits.sort((x, y) => y[0] - x[0])) s = s.slice(0, a) + 'TextArea' + s.slice(b);
  if (!s.includes(IMPORT)) {
    const nl = s.includes('\r\n') ? '\r\n' : '\n';
    const lines = s.split(nl);
    let last = -1;
    lines.forEach((l, i) => { if (/^import .* from ['"].*['"];?\s*$/.test(l)) last = i; });
    if (last < 0) { console.log(`NO IMPORT LINE ${f}`); continue; }
    lines.splice(last + 1, 0, IMPORT);
    s = lines.join(nl);
  }
  total += edits.length; fileCount++;
  console.log(`${f}: ${edits.length}`);
  if (write) fs.writeFileSync(f, s);
}
console.log(`${fileCount} files, ${total} names replaced${write ? ' (written)' : ' (dry run)'}`);
