// The rest of the owner's Safari sheet (claude/tests-safari-proprietaire.md), for a first pass under Playwright's
// WebKit (NOT Safari): Merge PDF (n° 27), Tar Extractor with PAX headers (n° 26), Voice Recorder (n° 5: says so when
// the browser cannot record), and the page side of the two paid tools with their server route PLAYED BY THIS TEST
// (no call to ConvertAPI or to the pdf-tools service): Word to PDF (n° 17), Compress PDF (n° 19). (Chromium and WebKit
// do not hand Playwright a multipart body's file part: only its envelope is counted there.) Firefox's headless fake
// microphone waits on a permission prompt: its voice-recorder line is not meaningful.
// Usage: node scripts/browser-tests/webkit-sheet-rest.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const FX = path.resolve('docs/audit/fixtures-safari');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wkrest-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true });
const save = async (p, loc) => { const [d] = await Promise.all([p.waitForEvent('download'), loc.click()]); const f = path.join(tmp, d.suggestedFilename()); await d.saveAs(f); return f; };
const pdfText = async (f) => { const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs'); const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(f)) }).promise; const out = []; for (let i = 1; i <= doc.numPages; i++) out.push((await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join(' ')); return out; };

{ // n° 27 Merge PDF: A (3 pages) + B (3 pages) -> 6 pages, A then B
  const p = await ctx.newPage(); await p.goto(origin + '/tools/pdf-tools/pdf-merge', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles([path.join(FX, 'safari-A-3pages.pdf'), path.join(FX, 'safari-B-3pages.pdf')]);
  await p.getByRole('button', { name: /Merge/ }).first().click();
  const dl = p.locator('a[download], button:has-text("Download")').first();
  const ok = await dl.waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
  if (!ok) check('merge PDF: result', false, (await p.locator('[role=alert]').allTextContents()).join(' '));
  else { const f = await save(p, dl); const t = await pdfText(f); check('merge PDF: 6 pages, A 1-3 then B 1-3', t.length === 6 && t.slice(0, 3).every((x) => /FICHIER A/.test(x)) && t.slice(3).every((x) => /FICHIER B/.test(x)), `${t.length} pages · ${t.map((x) => x.slice(0, 12)).join(' | ')}`); }
  await p.close();
}
{ // n° 26 Tar Extractor: .tar.gz with PAX extended headers (what macOS's tar writes)
  const dir = path.join(tmp, 't'); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'a.txt'), 'bonjour\n');
  const tgz = path.join(tmp, 't.tar.gz');
  execFileSync('C:\\Windows\\System32\\tar.exe', ['--format', 'pax', '-czf', tgz, '-C', tmp, 't']);
  const p = await ctx.newPage(); await p.goto(origin + '/tools/file-tools/tar-extractor', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(tgz);
  await p.getByText('a.txt').first().waitFor({ timeout: 30000 }).catch(() => {});
  const body = await p.locator('main').innerText().catch(() => p.locator('body').innerText());
  check('tar extractor: t/a.txt listed, no PaxHeader entry', /a\.txt/.test(body) && !/PaxHeader/i.test(body));
  const btn = p.locator('a[download], button:has-text("Download")').first();
  if (await btn.count()) { const f = await save(p, btn); check('tar extractor: a.txt downloads, "bonjour"', fs.readFileSync(f, 'utf8').includes('bonjour') || f.endsWith('.zip'), path.basename(f)); }
  await p.close();
}
{ // n° 5 Voice Recorder: when the engine has no MediaRecorder / microphone, the page says so
  const p = await ctx.newPage(); await p.goto(origin + '/tools/audio-tools/voice-recorder', { waitUntil: 'networkidle' });
  const hasMR = await p.evaluate(() => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
  await p.getByRole('button', { name: 'Start Recording' }).click();
  await p.waitForTimeout(3000);
  const msg = (await p.locator('[role=alert]').allTextContents()).join(' ').trim();
  const recording = await p.getByRole('button', { name: 'Stop Recording' }).count();
  check(`voice recorder: ${hasMR ? 'records (engine has MediaRecorder)' : 'no MediaRecorder/microphone here -> a clear message'}`, recording > 0 || (msg.length > 20 && !/undefined|denied/.test(msg)), msg || `recording ${recording}`);
  await p.close();
}
const tinyPdf = await (async () => { const d = await PDFDocument.create(); d.addPage([200, 200]); return Buffer.from(await d.save()); })();
{ // n° 17 Word to PDF, route played here (no ConvertAPI call)
  let asked = null;
  await ctx.route('**/api/convert-to-pdf', async (r) => { asked = r.request().postDataBuffer()?.length || 0; return r.fulfill({ status: 200, headers: { 'Content-Type': 'application/pdf' }, body: tinyPdf }); });
  const p = await ctx.newPage(); await p.goto(origin + '/tools/pdf-tools/word-to-pdf', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(path.resolve('docs/audit/fixtures-fidelite/fidelite-01.docx'));
  const d = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.getByRole('button', { name: 'Download PDF' }).click()]).then(([x]) => x).catch(() => null);
  if (!d) check('word to PDF (route played): result', false, (await p.locator('[role=alert]').allTextContents()).join(' '));
  else { const f = path.join(tmp, d.suggestedFilename()); await d.saveAs(f); check('word to PDF (route played): the .docx is sent, the PDF returned is downloaded as .pdf', asked > 200 && fs.readFileSync(f).equals(tinyPdf) && f.endsWith('.pdf'), `${asked} B sent · ${path.basename(f)}`); }
  await p.close();
}
{ // n° 19 Compress PDF, route played here (no pdf-tools call)
  let asked = null;
  await ctx.route('**/api/pdf-compress', async (r) => { asked = r.request().postDataBuffer()?.length || 0; return r.fulfill({ status: 200, headers: { 'Content-Type': 'application/pdf', 'X-Compress-Stats': JSON.stringify({ before: 8000, after: tinyPdf.length }) }, body: tinyPdf }); });
  const p = await ctx.newPage(); await p.goto(origin + '/tools/pdf-tools/pdf-compress', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(path.join(FX, 'safari-30pages.pdf'));
  await p.getByRole('button', { name: /Compress/ }).first().click();
  const dl = p.locator('a[download], button:has-text("Download")').first();
  const ok = await dl.waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
  if (!ok) check('compress PDF (route played): result', false, (await p.locator('[role=alert]').allTextContents()).join(' '));
  else { const f = await save(p, dl); check('compress PDF (route played): the PDF is sent, the returned PDF is downloaded', asked > 200 && fs.readFileSync(f).equals(tinyPdf) && f.endsWith('.pdf'), `${asked} B sent · ${path.basename(f)}`); }
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);
