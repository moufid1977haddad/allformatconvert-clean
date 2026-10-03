// P26: one REAL conversion per tool that uses Gotenberg, through the site's pages as a visitor does (light check:
// 7 conversions, nothing else). Each PDF is saved in <out-dir> for compare-pdfs.mjs (before / after a service change).
//   node scripts/p26/gotenberg-tools-www.mjs <origin> <out-dir> [--only=word,html,...]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { previewAuth } from './preview-auth.mjs';
import { realMediaService } from '../browser-tests/lib/real-media-service.mjs';

const [originArg, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');
const origin = new URL(originArg).origin;
fs.mkdirSync(outDir, { recursive: true });
const fx = (f) => path.resolve('scripts/audit/fixtures/files', f);
const cases = [
  // .odt, not .docx: in production .docx goes to ConvertAPI (paid, CONVERTAPI_ENABLED), every other Word format to Gotenberg.
  ['word', 'word-to-pdf', path.resolve('docs/audit/fixtures-p21-office/text.odt')],
  // P28: Word equations (Office Math) in an .rtf -- Gotenberg; lost by 8.36, restored by 8.37
  ['word-equations', 'word-to-pdf', path.resolve('scripts/p28/equations/corpus/word-omml.rtf')],
  // P28 lot 2: an .odt written by Word (flat MathML, math italic) -- rewritten by lib/odtWordMath.js before Gotenberg
  ['word-odt-equations', 'word-to-pdf', path.resolve('scripts/p28/equations/corpus/word-omml.odt')],
  ['excel', 'excel-to-pdf', fx('sample.xlsx')],
  ['powerpoint', 'ppt-to-pdf', fx('sample.pptx')],
  ['html', 'html-to-pdf', path.resolve('docs/audit/fidelite-marche/html-to-pdf-test.html'), 'Upload File'],
  ['epub', 'epub-to-pdf', fx('sample.epub')],
  ['mobi', 'mobi-to-pdf', fx('sample.mobi')],
  ['url', 'html-to-pdf', 'https://example.com/', 'From URL'],
  // --big-html=<file>: an HTML file above 4 MB, which goes through the media service (staged path)
  ...(process.argv.find((a) => a.startsWith('--big-html=')) ? [['html-big', 'html-to-pdf', process.argv.find((a) => a.startsWith('--big-html=')).split('=')[1], 'Upload File']] : []),
];
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
await previewAuth(ctx, origin);
await ctx.route(/vercel\.live/, (r) => r.abort());
const media = realMediaService({ origin, corsShim: process.argv.includes('--cors-shim') });
await media.routeTickets(ctx);
let fails = 0;
for (const [name, slug, input, mode] of cases.filter((c) => !only || only.includes(c[0]))) {
  const p = await ctx.newPage();
  const t0 = Date.now();
  await p.goto(`${origin}/tools/pdf-tools/${slug}`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  if (mode) await p.getByRole('button', { name: mode, exact: true }).click();
  if (mode === 'From URL') await p.getByLabel('Web page address').fill(input);
  else await p.locator('input[type=file]').first().setInputFiles(input);
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download]').first().waitFor({ timeout: 120000 }).then(() => 'ok'),
    p.locator('main p[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 120000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  if (r !== 'ok') {
    fails++;
    console.log(`FAIL ${name}: ${r === 'alert' ? await p.locator('main p[role=alert]').first().innerText() : 'no result in 120 s'}`);
    await p.close(); continue;
  }
  const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
    const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await fetch(a.href);
    const u = new Uint8Array(await res.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
  });
  const buf = Buffer.from(b64, 'base64');
  const ok = buf.subarray(0, 5).toString() === '%PDF-';
  if (!ok) fails++;
  fs.writeFileSync(path.join(outDir, `${name}.pdf`), buf);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${slug} ${buf.length} bytes ${Date.now() - t0} ms`);
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
