// P27 phase 2: the two real paid conversions P26 could not make (owner's budget: 0.05 $ at ConvertAPI), through the
// PDF to Word page on www, as a visitor: a text PDF -> .doc, and a PDF above 4 MB -> .rtf (media service path).
// Each file is checked by its signature here, then reopened in Word and LibreOffice by the caller.
//   node scripts/p27/word-www.mjs <origin> <small.pdf> <big.pdf> <out-dir> [--one=docx]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { realMediaService } from '../browser-tests/lib/real-media-service.mjs';

const [originArg, small, big, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(originArg).origin;
fs.mkdirSync(out, { recursive: true });
const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const media = realMediaService({ origin });
await media.routeTickets(ctx);

async function run(name, file, format) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-to-word`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.locator(`input[name=pw-format][value=${format}]`).check();
  const t0 = Date.now();
  await p.getByRole('button', { name: `Convert to .${format}` }).click();
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download], a[download]').first().waitFor({ timeout: 280000 }).then(() => 'ok'),
    p.locator('p[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 280000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  const res = { state: r, ms: Date.now() - t0 };
  if (r === 'ok') {
    const a = p.locator('[data-file-download] [data-download], a[download]').first();
    res.name = await a.getAttribute('download');
    const b64 = await a.evaluate(async (el) => {
      const staged = /\/zipdl\/f\//.test(el.getAttribute('href') || '');
      const resp = staged ? await (await caches.open('ocv-downloads-v1')).match(el.href) : await (async () => { for (let i = 0; i < 100 && !el.getAttribute('href'); i++) await new Promise((r) => setTimeout(r, 100)); return fetch(el.href); })();
      const u = new Uint8Array(await resp.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
    });
    res.buf = Buffer.from(b64, 'base64');
    res.file = path.join(out, `${name}.${format}`);
    fs.writeFileSync(res.file, res.buf);
    res.note = await p.locator('[data-doc-textboxes]').innerText().catch(() => '');
  } else if (r === 'alert') res.alert = await p.locator('p[role=alert]').first().innerText();
  await p.close();
  return res;
}

// --one=<format>: a single conversion of <small.pdf> (diagnosis, one paid call)
const one = process.argv.find((a) => a.startsWith('--one='))?.split('=')[1];
if (one) {
  const r1 = await run(`www-one-${path.basename(small, '.pdf')}`, small, one);
  check(`${path.basename(small)} -> .${one} on www`, r1.state === 'ok', `${r1.name} ${r1.buf?.length} B ${r1.ms} ms ${r1.alert || ''}`);
  await b.close();
  process.exit(fail ? 1 : 0);
}
let j = media.jobs.length;
let r = await run('www-doc', small, 'doc');
check('text PDF -> .doc (Word 97 container) on www', r.state === 'ok' && /\.doc$/.test(r.name) && r.buf.subarray(0, 8).equals(OLE), `${r.name} ${r.buf?.length} B ${r.ms} ms ${r.alert || ''}`);
j = media.jobs.length;
r = await run('www-big-rtf', big, 'rtf');
check(`PDF of ${(fs.statSync(big).size / 1e6).toFixed(1)} MB -> .rtf on www through the media service`, r.state === 'ok' && /\.rtf$/.test(r.name) && r.buf.subarray(0, 5).toString() === '{\\rtf' && media.jobs.length > j, `${r.name} ${r.buf?.length} B ${r.ms} ms jobs +${media.jobs.length - j} ${r.alert || ''}`);
await b.close();
console.log(`word-www: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
