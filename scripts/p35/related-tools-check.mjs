// P35 lot 3 S2: checks app/lib/relatedTools.js against the tool pages on disk.
// No network. Usage: node scripts/p35/related-tools-check.mjs  (exit 1 on any failure)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TOOLS_DIR = path.join(ROOT, 'app', 'tools');
const { RELATED_TOOLS, TOOL_NAMES } = await import(pathToFileURL(path.join(ROOT, 'app', 'lib', 'relatedTools.js')).href);

const failures = [];
const fail = (m) => failures.push(m);

// 1. Every tool on disk: app/tools/<category>/<tool>/page.(jsx|tsx|js)
const onDisk = new Map(); // href -> dir
for (const cat of fs.readdirSync(TOOLS_DIR)) {
  const cd = path.join(TOOLS_DIR, cat);
  if (!fs.statSync(cd).isDirectory()) continue;
  for (const tool of fs.readdirSync(cd)) {
    const td = path.join(cd, tool);
    if (!fs.statSync(td).isDirectory()) continue;
    if (fs.readdirSync(td).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) onDisk.set(`/tools/${cat}/${tool}`, td);
  }
}

// 2. Noindex pages: a layout or page in the tool dir that sets noindex / robots index false
const NOINDEX_RE = /noindex|robots\s*:\s*\{[^}]*index\s*:\s*false/s;
const noindex = new Set();
for (const [href, dir] of onDisk) {
  for (const f of fs.readdirSync(dir)) {
    if (!/^(page|layout)\.(jsx|tsx|js|ts)$/.test(f)) continue;
    if (NOINDEX_RE.test(fs.readFileSync(path.join(dir, f), 'utf8'))) noindex.add(href);
  }
}

// 3. Assertions
for (const href of onDisk.keys()) if (!RELATED_TOOLS[href]) fail(`missing entry: ${href}`);
for (const key of Object.keys(RELATED_TOOLS)) if (!onDisk.has(key)) fail(`entry for a tool not on disk: ${key}`);

let links = 0, min = Infinity, max = 0, crossCat = 0;
const edge = new Set();
for (const [key, list] of Object.entries(RELATED_TOOLS)) {
  if (!Array.isArray(list)) { fail(`${key}: not an array`); continue; }
  if (list.length < 4 || list.length > 6) fail(`${key}: ${list.length} links (need 4-6)`);
  if (new Set(list).size !== list.length) fail(`${key}: duplicate link`);
  if (!TOOL_NAMES[key]) fail(`${key}: no TOOL_NAMES entry`);
  for (const t of list) {
    if (t === key) fail(`${key}: links to itself`);
    if (!onDisk.has(t)) fail(`${key}: target not on disk: ${t}`);
    if (noindex.has(t)) fail(`${key}: target is noindex: ${t}`);
    if (!TOOL_NAMES[t]) fail(`${key}: target ${t} has no TOOL_NAMES entry`);
    if (TOOL_NAMES[t] && TOOL_NAMES[t] === TOOL_NAMES[key]) fail(`${key}: target ${t} has the same visible name`);
    if (t.split('/')[2] !== key.split('/')[2]) crossCat++;
    edge.add(`${key}>${t}`);
  }
  links += list.length;
  min = Math.min(min, list.length);
  max = Math.max(max, list.length);
}
for (const href of onDisk.keys()) if (!TOOL_NAMES[href]) fail(`no TOOL_NAMES entry: ${href}`);

// 4. Pages that pass their own `related` to SeoContent: their choices must head our list, in order
let ownRelated = 0;
for (const [href, dir] of onDisk) {
  const page = fs.readdirSync(dir).find((f) => /^page\.(jsx|tsx|js)$/.test(f));
  if (!/related=/.test(fs.readFileSync(path.join(dir, page), 'utf8'))) continue;
  ownRelated++;
  const seo = fs.readdirSync(dir).find((f) => /^seo\.(js|jsx|ts|tsx)$/.test(f));
  if (!seo) { fail(`${href}: passes related= but no seo file found`); continue; }
  const src = fs.readFileSync(path.join(dir, seo), 'utf8');
  const block = src.slice(src.indexOf('related'));
  const own = [...block.matchAll(/href:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const ours = RELATED_TOOLS[href] || [];
  own.forEach((h, i) => { if (ours[i] !== h) fail(`${href}: own related #${i + 1} ${h} not kept at the head (have ${ours[i]})`); });
}

let reciprocal = 0;
for (const e of edge) { const [a, b] = e.split('>'); if (a < b && edge.has(`${b}>${a}`)) reciprocal++; }

const n = Object.keys(RELATED_TOOLS).length;
console.log(`tools on disk:            ${onDisk.size}`);
console.log(`entries in RELATED_TOOLS: ${n}`);
console.log(`TOOL_NAMES entries:       ${Object.keys(TOOL_NAMES).length}`);
console.log(`noindex tool pages:       ${noindex.size}${noindex.size ? ' (' + [...noindex].join(', ') + ')' : ''}`);
console.log(`pages with own related:   ${ownRelated} (kept at head of list)`);
console.log(`links total:              ${links}`);
console.log(`per tool min/avg/max:     ${min} / ${(links / n).toFixed(2)} / ${max}`);
console.log(`reciprocal pairs:         ${reciprocal}`);
console.log(`cross-category links:     ${crossCat}`);
if (failures.length) {
  console.log(`\nFAIL (${failures.length})`);
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
console.log('\nPASS');
