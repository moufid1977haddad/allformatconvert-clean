// P35 (05/10) — the redacted page keeps the words outside the black boxes as selectable text (owner's decision D3).
// Runs the real page (Playwright) on a PDF + term, then compares, for each redacted page, the words Poppler reads
// (pdftotext -bbox) in the original and in the result:
//   (i)   every word of a line far from the match (vertical distance > 1.5 line heights) is selectable in the result,
//         and every word of the result is a word of the original page (nothing invented); the kept / dropped words
//         are listed;
//   (ii)  the term is not in the result's text (pdftotext of the page and of the whole file);
//   (iii) each kept word is where it was: its left and right edges within 2 pt of the original word's, its vertical
//         centre within 2 pt (Poppler's box of the invisible Helvetica word against the original font's).
// This replaces the checks of scripts/p33/redact-truth.mjs that asserted "no selectable text on the redacted page".
//   node scripts/p35/redact-text-layer.mjs <origin> [--browser=webkit|chromium] [--device=iphone|desktop]
//        [--pdf=…] [--terms="photo-2"]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'webkit');
const device = arg('device', 'iphone');
const PDF = arg('pdf') || path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const terms = arg('terms', 'photo-2').split('|');
const OUT = path.join(os.tmpdir(), 'p35-text-layer');
fs.mkdirSync(OUT, { recursive: true });
const tag = `${engine} [${device}] ${path.basename(PDF)}`;
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const norm = (s) => s.normalize('NFKD').replace(/[\p{M}¨´]/gu, '').toLowerCase().replace(/\s+/g, '').replace(/[-­‐-―−]/g, '');

// ---- run the page ----
const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 } } : {}) });
const p = await ctx.newPage();
await p.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(PDF);
await p.locator('#rd-terms').fill(terms.join('\n'));
await p.getByRole('button', { name: 'Redact PDF' }).click();
await p.waitForSelector('[data-summary], p[role=alert]', { timeout: 120000 });
const summary = await p.locator('[data-summary]').innerText().catch(() => '');
const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
check(`summary: "${summary.slice(0, 260)}"`, !!summary && !alert, alert);
if (!summary) { await b.close(); process.exit(1); }
check('the summary says the words outside the black boxes stay selectable', /invisible text layer holding the words outside the black boxes/.test(summary));
const out = path.join(OUT, `redacted-${engine}-${device}-${path.basename(PDF)}`);
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
await dl.saveAs(out);
await b.close();
const hitPages = (/\(([^)]*)\)/.exec(summary)?.[1] || '').split(', ').map((x) => Number(/page (\d+)/.exec(x)?.[1])).filter(Boolean);

// ---- Poppler's words with their boxes (Poppler's pdftotext: the xpdf one Git for Windows puts first has no -bbox) ----
const POPPLER = process.env.POPPLER_PDFTOTEXT || (() => {
  try { return execFileSync(process.platform === 'win32' ? 'where' : 'which', ['-a', 'pdftotext'].slice(process.platform === 'win32' ? 1 : 0)).toString().split(/\r?\n/).find((l) => /poppler/i.test(l)) || 'pdftotext'; } catch { return 'pdftotext'; }
})();
const bboxWords = (f, pg) => {
  const html = execFileSync(POPPLER,['-bbox', '-f', String(pg), '-l', String(pg), f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'");
  // Poppler gives the words of a page with a CropBox in the MediaBox's frame (x from the MediaBox's left, y from its
  // top); the redacted page is the visible (cropped) area only: the original's words are moved to the cropped frame
  const box = (k) => (new RegExp(`${k}:\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)`).exec(execFileSync('pdfinfo', ['-box', '-f', String(pg), '-l', String(pg), f]).toString()) || []).slice(1).map(Number);
  const [mx0, , , my1] = box('MediaBox'), [cx0, , , cy1] = box('CropBox');
  const ox = (cx0 ?? mx0) - mx0 || 0, oy = my1 - (cy1 ?? my1) || 0;
  return [...html.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)].map((m) => ({ x0: +m[1] - ox, y0: +m[2] - oy, x1: +m[3] - ox, y1: +m[4] - oy, str: dec(m[5]) }));
};
const wholeText = execFileSync(POPPLER,[out, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
for (const t of terms) check(`(ii) pdftotext of the whole file: "${t}" nowhere`, !norm(wholeText).includes(norm(t)));

for (const pg of hitPages) {
  const before = bboxWords(PDF, pg);
  const after = bboxWords(out, pg);
  // the original words a match touches (the page's words joined without spaces, as the tool searches)
  let hay = '';
  const at = [];
  before.forEach((w, k) => { for (const ch of norm(w.str)) { hay += ch; at.push(k); } });
  const matched = new Set();
  for (const t of terms) for (let j = hay.indexOf(norm(t)); j >= 0; j = hay.indexOf(norm(t), j + 1)) for (let q = j; q < j + norm(t).length; q++) matched.add(at[q]);
  const cy = (w) => (w.y0 + w.y1) / 2;
  const lh = Math.max(...[...matched].map((k) => before[k].y1 - before[k].y0), 1);
  const far = (w) => [...matched].every((k) => Math.abs(cy(w) - cy(before[k])) > 1.5 * lh);
  const others = before.filter((_, k) => !matched.has(k));
  const pageText = after.map((w) => w.str).join(' ');
  for (const t of terms) check(`(ii) page ${pg}: "${t}" not in its selectable text`, !norm(pageText).includes(norm(t)), pageText.slice(0, 200));

  // pair each word of the result with the nearest original word of the same text
  const used = new Set();
  const pairs = after.map((w) => {
    let best = null, bd = Infinity;
    before.forEach((o, k) => { if (used.has(k) || matched.has(k) || o.str !== w.str) return; const d = Math.hypot(o.x0 - w.x0, cy(o) - cy(w)); if (d < bd) { bd = d; best = k; } });
    if (best !== null) used.add(best);
    return { w, k: best };
  });
  // (Poppler cuts diagonal text into pieces that differ from one file to the other: a piece must be part of the
  // original page's text in content order, read without spaces)
  const origHay = norm(execFileSync(POPPLER, ['-raw', '-f', String(pg), '-l', String(pg), PDF, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  const invented = pairs.filter((x) => x.k === null && !origHay.includes(norm(x.w.str))).map((x) => x.w.str);
  check(`(i) page ${pg}: every selectable word is a word of the original page`, !invented.length, JSON.stringify(invented));
  const missingFar = others.filter((o) => far(o) && !used.has(before.indexOf(o))).map((o) => o.str);
  check(`(i) page ${pg}: every word of a line away from the match is selectable (${others.filter(far).length} words)`, !missingFar.length, JSON.stringify(missingFar));
  const keptList = others.filter((o) => used.has(before.indexOf(o))).map((o) => o.str);
  const droppedList = others.filter((o) => !used.has(before.indexOf(o))).map((o) => o.str);
  console.log(`  page ${pg}: ${keptList.length} of ${others.length} words outside the match kept: ${JSON.stringify(keptList)}`);
  console.log(`  page ${pg}: not kept (next to a black box): ${JSON.stringify(droppedList)}; matched: ${JSON.stringify([...matched].map((k) => before[k].str))}`);
  let dx = 0, dy = 0;
  const off = [];
  for (const { w, k } of pairs) {
    if (k === null) continue;
    const o = before[k];
    const ex = Math.max(Math.abs(o.x0 - w.x0), Math.abs(o.x1 - w.x1)), ey = Math.abs(cy(o) - cy(w));
    dx = Math.max(dx, ex); dy = Math.max(dy, ey);
    if (ex > 2 || ey > 2) off.push(`${w.str} (x ${ex.toFixed(2)}, y ${ey.toFixed(2)})`);
  }
  check(`(iii) page ${pg}: kept words where they were (largest gap: edges ${dx.toFixed(2)} pt, vertical centre ${dy.toFixed(2)} pt; tolerance 2 pt)`, keptList.length > 0 && !off.length, off.join('; '));
}
console.log(`\n${tag}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
