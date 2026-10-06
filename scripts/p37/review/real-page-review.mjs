// P37 review n° 2 — the review fixtures on the REAL page (local production build). Red text: a pixel of the match's
// ink that is not black in the downloaded result is "not covered". Fixtures: RED=1 scripts/p37/review/fit-adversarial.mjs
// (%TEMP%\p37-review-redact\fit-red) and RED=1 ocr-scan.mjs + ocr-variants.mjs (ocr-red).
//   node scripts/p37/review/real-page-review.mjs <origin> [--browser=chromium|webkit] [--device=desktop|iphone] [--only=a,b]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'chromium'), device = arg('device', 'desktop');
const R = path.join(os.tmpdir(), 'p37-review-redact');
const OUT = path.join(R, `real-${engine}-${device}`);
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const FIT = ['stroke-tr2-w2-24', 'stroke-tr1-w3-36', 'stroke-tr2-w1-12', 'negative-font-size', 'flipped-ctm-generator', 'shear-synthetic-italic', 'shadow-offset-2pt', 'fake-bold-double-0.4', 'tz-300-tc-neg', 'rise-inside-match', 'type0-narrow-widths', 'type0-accents-stacked', 'ligature-calibri', 'italic-ttf-overhang', 'type3-overhang', 'type3-bbox-too-small', 'type3-bbox-zero'];
const TERM = { 'type0-accents-stacked': 'ỄỂỆphô', 'ligature-calibri': 'fice', 'italic-ttf-overhang': 'fjfjf' };
const jobs = [
  ...FIT.map((id) => ({ id, full: path.join(R, 'fit-red', `${id}-full.pdf`), match: path.join(R, 'fit-red', `${id}-match.pdf`), term: TERM[id] || 'photo-2' })),
  { id: 'ocr-times12', full: path.join(R, 'ocr-red', 'times12-ocr.pdf'), match: path.join(R, 'ocr-red', 'times12-match.pdf'), term: 'photography' },
  { id: 'ocr-times12-sub', full: path.join(R, 'ocr-red', 'times12-sub-ocr.pdf'), match: path.join(R, 'ocr-red', 'times12-sub-match.pdf'), term: 'graph' },
  { id: 'ocr-under-image', full: path.join(R, 'ocr-red', 'times12-ocr-under-image.pdf'), match: path.join(R, 'ocr-red', 'times12-match.pdf'), term: 'photography' },
  { id: 'ocr-alpha-0', full: path.join(R, 'ocr-red', 'times12-ocr-alpha-0.pdf'), match: path.join(R, 'ocr-red', 'times12-match.pdf'), term: 'photography' },
].filter((j) => !arg('only') || arg('only').split(',').includes(j.id));

function picture(file, color) {
  const base = path.join(OUT, `${path.basename(file, '.pdf')}-${color ? 'rgb' : 'grey'}`);
  execFileSync('pdftoppm', ['-r', '288', ...(color ? [] : ['-gray']), '-singlefile', file, base], { stdio: 'ignore' });
  const f = `${base}.${color ? 'ppm' : 'pgm'}`, buf = fs.readFileSync(f);
  let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(buf[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(buf[pos]))) s += String.fromCharCode(buf[pos++]); tok.push(s); }
  pos++; fs.rmSync(f);
  return { w: +tok[1], h: +tok[2], px: buf.subarray(pos) };
}

const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 } } : {}) });
let fails = 0;
for (const j of jobs) {
  const p = await ctx.newPage();
  const out = path.join(OUT, `${j.id}-redacted.pdf`);
  let err = '';
  try {
    await p.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    await p.locator('input[type=file]').first().setInputFiles(j.full);
    await p.locator('#rd-terms').fill(j.term);
    await p.getByRole('button', { name: 'Redact PDF' }).click();
    await p.waitForSelector('[data-summary], p[role=alert]', { timeout: 180000 });
    err = await p.locator('p[role=alert]').innerText().catch(() => '');
    if (!err) { const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]); await dl.saveAs(out); }
  } catch (e) { err = e.message; } finally { await p.close(); }
  if (err) { fails++; console.log(`FAIL ${engine} ${j.id}: ${err.slice(0, 160)}`); continue; }
  const res = picture(out, true), m = picture(j.match, false);
  if (res.w !== m.w || res.h !== m.h) { fails++; console.log(`FAIL ${j.id}: sizes ${res.w}x${res.h} vs ${m.w}x${m.h}`); continue; }
  let ink = 0, unc = 0, at = null;
  for (let i = 0; i < m.w * m.h; i++) if (m.px[i] < 128) { ink++; const black = res.px[3 * i] < 90 && res.px[3 * i + 1] < 90 && res.px[3 * i + 2] < 90; if (!black) { unc++; if (!at) at = [(i % m.w) / 4, ((i / m.w) | 0) / 4]; } }
  const ok = ink > 0 && unc === 0;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${engine}/${device} ${j.id}: match ink ${ink} px, not black ${unc}${at ? ` (first at ${at.map((v) => v.toFixed(1))} pt from top left)` : ''}`);
}
await b.close();
console.log(`${engine}/${device}: ${fails ? `${fails} FAIL` : 'all PASS'} of ${jobs.length}`);
