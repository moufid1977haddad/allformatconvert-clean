// Inventory of how each tool hands its result over (P18 step 3): download links, helpers, object URLs, clipboard.
// Usage: node scripts/compat/download-inventory.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';

const rows = [];
for (const cat of fs.readdirSync('app/tools', { withFileTypes: true })) {
  if (!cat.isDirectory()) continue;
  for (const t of fs.readdirSync(path.join('app/tools', cat.name), { withFileTypes: true })) {
    if (!t.isDirectory()) continue;
    const dir = path.join('app/tools', cat.name, t.name);
    let src = '';
    for (const f of fs.readdirSync(dir)) if (/\.(jsx?|tsx?)$/.test(f) && !/layout\./.test(f)) src += fs.readFileSync(path.join(dir, f), 'utf8');
    // shared tool components the page delegates to
    const comps = [...src.matchAll(/from '(?:\.\.\/)+components\/(\w+)'/g)].map((m) => m[1]).filter((c) => !/SeoContent|ToolJsonLd|ProgressBar|MediaInfo|PlayablePreview|IosOriginalNote|IosVideoFirstFrame|CsvReadOptions/.test(c));
    let compSrc = '';
    for (const c of comps) for (const ext of ['.jsx', '.tsx', '.js']) { const p = path.join('app/components', c + ext); if (fs.existsSync(p)) compSrc += fs.readFileSync(p, 'utf8'); }
    const all = src + compSrc;
    const count = (re) => (all.match(re) || []).length;
    rows.push({
      tool: `${cat.name}/${t.name}`,
      downloadAttr: count(/\bdownload=\{|\bdownload="|\.download\s*=/g),
      helper: count(/\bsaveBlob\(|<DownloadReady|useDownloadable\(|<FileDownloads/g),
      objectUrl: count(/createObjectURL\(/g),
      clipboard: count(/clipboard\.write/g),
      comingSoon: /Coming Soon/i.test(src) && src.length < 6000,
      comps: comps.join(','),
    });
  }
}
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 1));
else {
  for (const r of rows) console.log(`${r.tool.padEnd(52)} dl=${r.downloadAttr} helper=${r.helper} url=${r.objectUrl} clip=${r.clipboard}${r.comingSoon ? ' COMING-SOON' : ''} ${r.comps}`);
  console.log(`${rows.length} tools; no download at all: ${rows.filter((r) => !r.downloadAttr && !r.helper).length}`);
}
