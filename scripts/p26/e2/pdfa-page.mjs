// P26 E2: the PDF to PDF/A page used as a visitor does; each downloaded file re-validated by a local veraPDF.
//   node scripts/p26/e2/pdfa-page.mjs <origin> <fixtures-dir> <verapdf.bat> [--cors-shim]
// fixtures-dir: chrome-tagged.pdf, chrome-untagged.pdf, lo-fidelite-01_docx-tagged.pdf (no Unicode for some glyphs),
// big.pdf (> 4 MB: staged through the media service).
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { previewAuth } from '../preview-auth.mjs';
import { realMediaService } from '../../browser-tests/lib/real-media-service.mjs';

const [originArg, fx, vera] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(originArg).origin;
const out = path.join(fx, 'page-out'); fs.mkdirSync(out, { recursive: true });
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const veraOk = (file, level) => {
  let s = ''; try { s = execFileSync('cmd', ['/c', vera, '-f', level, '--format', 'json', file], { encoding: 'utf8', maxBuffer: 64 << 20 }); } catch (e) { s = e.stdout || ''; }
  try { const j = JSON.parse(s).report.jobs[0]; const v = Array.isArray(j.validationResult) ? j.validationResult[0] : j.validationResult; return v.compliant === true; } catch { return false; }
};

const engine = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
const b = await { chromium, firefox, webkit }[engine].launch();
console.log('engine', engine);
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
await previewAuth(ctx, origin);
await ctx.route(/vercel\.live/, (r) => r.abort());
const media = realMediaService({ origin, corsShim: process.argv.includes('--cors-shim') });
await media.routeTickets(ctx);

async function run(name, file, level, { downgrade = null } = {}) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-to-pdfa`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(path.join(fx, file));
  await p.waitForTimeout(1500); // the page reads the file's tags
  const select = p.getByLabel('PDF/A conformance');
  const disabledA = await select.locator('option[value="2a"]').isDisabled();
  if (level) await select.selectOption(level);
  const note = await p.locator('[data-testid=pdfa-tag-note]').innerText().catch(() => '');
  if (downgrade !== null) {
    const box = p.getByRole('checkbox');
    if ((await box.isChecked()) !== downgrade) await box.click();
  }
  await p.getByRole('button', { name: /^Convert to PDF\/A-/ }).click();
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download]').first().waitFor({ timeout: 240000 }).then(() => 'ok'),
    p.locator('p[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 240000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  const res = { disabledA, note, state: r };
  if (r === 'ok') {
    const a = p.locator('[data-file-download] [data-download]').first();
    res.name = await a.getAttribute('download');
    const b64 = await a.evaluate(async (el) => {
      const staged = /\/zipdl\/f\//.test(el.getAttribute('href') || '');
      const resp = staged ? await (await caches.open('ocv-downloads-v1')).match(el.href) : await fetch(el.href);
      const u = new Uint8Array(await resp.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
    });
    res.file = path.join(out, `${name}.pdf`);
    fs.writeFileSync(res.file, Buffer.from(b64, 'base64'));
    res.verdict = await p.locator('text=/Verified compliant with PDF\\/A-/').first().innerText().catch(() => '');
    res.downgraded = await p.locator('[data-testid=pdfa-downgraded]').innerText().catch(() => '');
  } else if (r === 'alert') res.alert = await p.locator('p[role=alert]').first().innerText();
  await p.close();
  return res;
}

let r = await run('untagged-2u', 'chrome-untagged.pdf', '2u');
check('untagged PDF: 2a/3a switched off, said before sending', r.disabledA && /not tagged/.test(r.note), r.note.slice(0, 60));
check('untagged PDF -> 2u, verified', r.state === 'ok' && /-pdfa-2u\.pdf$/.test(r.name) && /PDF\/A-2u/.test(r.verdict) && veraOk(r.file, '2u'), `${r.name} ${r.verdict}`);

r = await run('tagged-2a', 'chrome-tagged.pdf', '2a');
check('tagged PDF: 2a offered, "is tagged" said', !r.disabledA && /is tagged/.test(r.note), r.note.slice(0, 60));
check('tagged PDF -> 2a, verified by veraPDF', r.state === 'ok' && /-pdfa-2a\.pdf$/.test(r.name) && veraOk(r.file, '2a'), `${r.name} ${r.verdict}`);

r = await run('nounicode-2a-down', 'lo-fidelite-01_docx-tagged.pdf', '2a', { downgrade: true });
check('no-Unicode PDF, 2a with lower level allowed -> 2b, said', r.state === 'ok' && /-pdfa-2b\.pdf$/.test(r.name) && /asked for PDF\/A-2a/.test(r.downgraded) && /Unicode/.test(r.downgraded) && veraOk(r.file, '2b'), r.downgraded.slice(0, 120));

r = await run('nounicode-2a-strict', 'lo-fidelite-01_docx-tagged.pdf', '2a', { downgrade: false });
check('no-Unicode PDF, 2a only -> refused with the reason, no file', r.state === 'alert' && /Unicode/.test(r.alert || ''), (r.alert || r.state).slice(0, 120));

r = await run('default-2b', 'chrome-untagged.pdf', null);
check('default level unchanged: 2b', r.state === 'ok' && /-pdfa-2b\.pdf$/.test(r.name) && veraOk(r.file, '2b'), r.name);

if (fs.existsSync(path.join(fx, 'big.pdf'))) {
  r = await run('big-3u', 'big.pdf', '3u');
  check('large PDF (media service) -> 3u, verified', r.state === 'ok' && /-pdfa-3u\.pdf$/.test(r.name) && veraOk(r.file, '3u'), `${r.name} ${r.alert || ''} jobs ${media.jobs.length}`);
}
await b.close();
console.log(`pdfa-page: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
