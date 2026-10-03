// P26 E1: the PDF to Word page used as a visitor does, for .doc and for .rtf/.doc above 4 MB (media service).
// LOCAL ONLY, against `next start` with scripts/p26/e1/fake-providers.mjs preloaded (no ConvertAPI spend, nothing
// written to Supabase); our real pdf-tools (.doc) and media (staging) services are used.
//   node scripts/p26/e1/word-page.mjs <origin> <pdf-dir> <out-dir>
// pdf-dir: small.pdf (< 4 MB), big.pdf (> 4 MB), textbox.pdf (any PDF; the fake answers a DOCX with text boxes).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { realMediaService } from '../../browser-tests/lib/real-media-service.mjs';

const [originArg, pdfDir, out] = process.argv.slice(2);
const origin = new URL(originArg).origin;
fs.mkdirSync(out, { recursive: true });
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const media = realMediaService({ origin, corsShim: true });
await media.routeTickets(ctx);

async function run(name, file, format) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-to-word`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(path.join(pdfDir, file));
  await p.locator(`input[name=pw-format][value=${format}]`).check();
  const docNote = await p.locator('[data-doc-note]').isVisible().catch(() => false);
  await p.getByRole('button', { name: `Convert to .${format}` }).click();
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download], a[download]').first().waitFor({ timeout: 240000 }).then(() => 'ok'),
    p.locator('p[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 240000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  const res = { state: r, docNote };
  if (r === 'ok') {
    const a = p.locator('[data-file-download] [data-download], a[download]').first();
    res.name = await a.getAttribute('download');
    const b64 = await a.evaluate(async (el) => {
      const staged = /\/zipdl\/f\//.test(el.getAttribute('href') || '');
      const resp = staged ? await (await caches.open('ocv-downloads-v1')).match(el.href) : await fetch(el.href);
      const u = new Uint8Array(await resp.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
    });
    res.buf = Buffer.from(b64, 'base64');
    res.file = path.join(out, `${name}.${format}`);
    fs.writeFileSync(res.file, res.buf);
    res.boxes = await p.locator('[data-doc-textboxes]').innerText().catch(() => '');
  } else if (r === 'alert') res.alert = await p.locator('p[role=alert]').first().innerText();
  await p.close();
  return res;
}
const isRtf = (buf) => buf?.subarray(0, 5).toString() === '{\\rtf';
const isDoc = (buf) => buf?.subarray(0, 8).equals(OLE);
const isDocx = (buf) => buf?.[0] === 0x50 && buf?.[1] === 0x4b;
const jobs0 = () => media.jobs.length;

let r = await run('small-doc', 'small.pdf', 'doc');
check('small PDF -> .doc (Word 97 container), note shown before', r.state === 'ok' && /\.doc$/.test(r.name) && isDoc(r.buf) && r.docNote, `${r.name} ${r.buf?.length} ${r.alert || ''}`);
r = await run('small-docx', 'small.pdf', 'docx');
check('small PDF -> .docx unchanged', r.state === 'ok' && /\.docx$/.test(r.name) && isDocx(r.buf), `${r.name} ${r.alert || ''}`);
r = await run('small-rtf', 'small.pdf', 'rtf');
check('small PDF -> .rtf unchanged', r.state === 'ok' && /\.rtf$/.test(r.name) && isRtf(r.buf), `${r.name} ${r.alert || ''}`);
let j = jobs0();
r = await run('big-rtf', 'big.pdf', 'rtf');
check('PDF > 4 MB -> .rtf through the media service (was refused before P26)', r.state === 'ok' && /\.rtf$/.test(r.name) && isRtf(r.buf) && media.jobs.length > j, `${r.name} ${r.alert || ''} jobs +${media.jobs.length - j}`);
j = jobs0();
r = await run('big-doc', 'big.pdf', 'doc');
check('PDF > 4 MB -> .doc through the media service', r.state === 'ok' && /\.doc$/.test(r.name) && isDoc(r.buf) && media.jobs.length > j, `${r.name} ${r.alert || ''} jobs +${media.jobs.length - j}`);
r = await run('big-docx', 'big.pdf', 'docx');
check('PDF > 4 MB -> .docx unchanged', r.state === 'ok' && /\.docx$/.test(r.name) && isDocx(r.buf), `${r.name} ${r.alert || ''}`);
r = await run('textbox-doc', 'textbox.pdf', 'doc');
check('document with text boxes -> .doc + the page says so', r.state === 'ok' && isDoc(r.buf) && /text box/.test(r.boxes || ''), (r.boxes || r.alert || r.state).slice(0, 90));
await b.close();
console.log(`word-page: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
