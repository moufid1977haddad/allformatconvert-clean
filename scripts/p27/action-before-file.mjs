// P27 phase 6: on every tool page that takes a file, which ACTION buttons are visible and enabled before any file is
// chosen (the market -- iLovePDF, Smallpdf, CloudConvert, FreeConvert -- shows no action until a file is there).
// Excluded: the header, the footer, the explanations below the tool (FAQ, how-to), the upload area itself, and
// controls that do not act on a file (options, tabs, samples, paste).
//   node scripts/p27/action-before-file.mjs <origin> [--only=/tools/a/b,...] > out.txt
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const origin = new URL(args.find((a) => !a.startsWith('--'))).origin;
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const root = path.resolve('app/tools');
const urls = [];
for (const cat of fs.readdirSync(root).sort()) {
  const cdir = path.join(root, cat); if (!fs.statSync(cdir).isDirectory()) continue;
  for (const t of fs.readdirSync(cdir).sort()) { const tdir = path.join(cdir, t); if (fs.statSync(tdir).isDirectory() && fs.readdirSync(tdir).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) urls.push(`/tools/${cat}/${t}`); }
}
const ACTION = /^(convert|compress|merge|split|rotate|crop|resize|extract|remove|create|generate|make|process|start|run|apply|download|encrypt|decrypt|protect|unlock|sign|repair|translate|summari[sz]e|transcribe|trim|cut|join|combine|optimi[sz]e|upscale|enhance|blur|sharpen|flip|invert|compare|detect|scan|ocr|redact|watermark|add|stamp|number|organi[sz]e|reorder|delete|save|export|encode|decode|change|boost|normali[sz]e|reverse|mute|speed|loop|caption|subtitle|burn|record|mix|edit)\b/i;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
let flagged = 0;
for (const u of urls.filter((x) => !only || only.includes(x))) {
  const p = await ctx.newPage();
  try {
    await p.goto(origin + u, { waitUntil: 'load', timeout: 45000 });
    await p.waitForTimeout(500);
    const r = await p.evaluate((src) => {
      const ACTION = new RegExp(src, 'i');
      const main = document.getElementById('main-content') || document.body;
      const hasFile = !!main.querySelector('input[type="file"]');
      const vis = (el) => { const rc = el.getBoundingClientRect(); const s = getComputedStyle(el); return rc.width > 0 && rc.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const out = [];
      for (const el of main.querySelectorAll('button, a[role="button"], input[type="submit"]')) {
        if (!vis(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
        if (el.closest('details, [data-seo-content], footer, header, [data-a11y-zone]')) continue;
        const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
        if (ACTION.test(text)) out.push(text.slice(0, 50));
      }
      return { hasFile, out };
    }, ACTION.source);
    if (r.hasFile && r.out.length) { flagged++; console.log(`ENABLED ${u} :: ${r.out.join(' | ')}`); }
  } catch (e) { console.log(`ERROR ${u} ${String(e.message).slice(0, 100)}`); }
  await p.close();
}
await b.close();
console.log(`action-before-file: ${flagged} file pages show an enabled action before a file is chosen`);
