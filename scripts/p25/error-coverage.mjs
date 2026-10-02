// P25 (03/10): how every tool page reports its errors. node scripts/p25/error-coverage.mjs
// "direct": the page (or a component it renders, followed through local imports) uses useToolError, reportShownMessage
// or reportToolError. "watch only": no error message of its own (pure calculation); app/tools/ToolErrorWatch.jsx
// still reports any uncaught exception or unhandled rejection, and app/error.jsx any render crash.
import fs from 'node:fs';
import path from 'node:path';
const root = 'app/tools';
const REPORT = /\b(useToolError|reportShownMessage|reportToolError)\(/;
const seen = new Map();
function reports(file, depth = 0) {
  if (seen.has(file)) return seen.get(file);
  seen.set(file, false);
  let src = '';
  try { src = fs.readFileSync(file, 'utf8'); } catch { return false; }
  let ok = REPORT.test(src);
  if (!ok && depth < 3) {
    for (const m of src.matchAll(/from '(\.[^']+)'/g)) {
      const base = path.resolve(path.dirname(file), m[1]);
      for (const f of [base, `${base}.jsx`, `${base}.tsx`, `${base}.js`]) {
        if (fs.existsSync(f) && fs.statSync(f).isFile() && /components|LegacyPage|Tool/.test(f) && reports(f, depth + 1)) { ok = true; break; }
      }
      if (ok) break;
    }
  }
  seen.set(file, ok);
  return ok;
}
const pages = [];
for (const cat of fs.readdirSync(root)) {
  const d = path.join(root, cat);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const tool of fs.readdirSync(d)) {
    const td = path.join(d, tool);
    if (!fs.statSync(td).isDirectory()) continue;
    const page = ['page.jsx', 'page.tsx'].map((f) => path.join(td, f)).find((f) => fs.existsSync(f));
    if (page) pages.push({ tool: `${cat}/${tool}`, page });
  }
}
const direct = [], watch = [];
for (const p of pages) {
  const src = fs.readFileSync(p.page, 'utf8');
  const catches = (src.match(/\bcatch\b/g) || []).length;
  (reports(p.page) ? direct : watch).push({ ...p, catches });
}
console.log(`tool pages: ${pages.length} — direct reporting: ${direct.length}, ToolErrorWatch only: ${watch.length}`);
for (const w of watch) console.log(`  watch only: ${w.tool}${w.catches ? ` (catch ×${w.catches})` : ''}`);
const layout = fs.readFileSync('app/tools/layout.tsx', 'utf8');
if (!/<ToolErrorWatch \/>/.test(layout)) { console.log('FAIL: ToolErrorWatch is not mounted in app/tools/layout.tsx'); process.exit(1); }
console.log('ToolErrorWatch mounted in app/tools/layout.tsx: yes');
