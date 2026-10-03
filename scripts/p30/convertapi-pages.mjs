// P30 (04/10): the four ConvertAPI tools through their real pages (Chromium), small file (direct request) and, when
// the deployment has the media service, a file above 4 MB (staged path).
//   node scripts/p30/convertapi-pages.mjs <origin> --expect=fallback   (local or preview: ConvertAPI is refused there)
//     Word to PDF (.docx): a PDF made by LibreOffice + the "backup converter" notice; .odt: PDF, no notice;
//     PDF to Word / Excel / PowerPoint: the "temporarily unavailable ... try again later" message, no file.
//   node scripts/p30/convertapi-pages.mjs <origin> --expect=normal --only=word-to-pdf,pdf-to-word,... --budget=0.05
//     www: real conversions, each one recorded in the paid ledger BEFORE it is sent (scripts/p30/paid-ledger.mjs);
//     a PDF/DOCX/XLSX/PPTX made by ConvertAPI and NO backup notice.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { reservePaid, refundPaid } from './paid-ledger.mjs';

const origin = new URL(process.argv[2]).origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const expect = arg('expect');
if (!['fallback', 'normal'].includes(expect)) { console.error('--expect=fallback|normal'); process.exit(2); }
const only = arg('only')?.split(',');
const budget = Number(arg('budget') || 0);
const big = process.argv.includes('--big');

const DOCX = 'docs/audit/fixtures-fidelite/fidelite-02.docx';
const ODT = 'scripts/p28/equations/corpus/word-omml.odt';
const PDF = 'scripts/p27/pdfa-corpus/lo-fidelite-02_docx-untagged.pdf';
// > 4 MB so the page takes the staged path: the same document with a 4.5 MB incompressible payload appended in a
// custom XML part (Word and LibreOffice ignore it), built in memory.
async function bigDocx() {
  const { default: JSZip } = await import('jszip');
  const z = await JSZip.loadAsync(fs.readFileSync(DOCX));
  const crypto = await import('node:crypto');
  z.file('customXml/p30-padding.bin', crypto.randomBytes(4.5 * 1024 * 1024));
  return z.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
}

const cases = [
  { id: 'word-to-pdf', path: '/tools/pdf-tools/word-to-pdf', file: DOCX, name: 'p30-fidelite-02.docx', paid: true, out: '%PDF-' },
  { id: 'word-to-pdf-odt', path: '/tools/pdf-tools/word-to-pdf', file: ODT, name: 'p30-word-omml.odt', paid: false, out: '%PDF-' },
  { id: 'pdf-to-word', path: '/tools/pdf-tools/pdf-to-word', file: PDF, name: 'p30-letter.pdf', paid: true, out: 'PK', label: 'Word' },
  { id: 'pdf-to-excel', path: '/tools/pdf-tools/pdf-to-excel', file: 'scripts/p27/pdfa-corpus/lo-fidelite-01_docx-untagged.pdf', name: 'p30-letter.pdf', paid: true, out: 'PK', label: 'Excel' },
  { id: 'pdf-to-ppt', path: '/tools/pdf-tools/pdf-to-ppt', file: PDF, name: 'p30-letter.pdf', paid: true, out: 'PK', label: 'PowerPoint' },
].filter((c) => !only || only.includes(c.id));
if (big) cases.push({ id: 'word-to-pdf-staged', path: '/tools/pdf-tools/word-to-pdf', buffer: await bigDocx(), name: 'p30-big.docx', paid: true, out: '%PDF-' });

const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

for (const c of cases) {
  const realPaid = expect === 'normal' && c.paid;
  if (realPaid) reservePaid({ chantier: 'P30', budgetUsd: budget, provider: 'convertapi', usd: 0.01, what: `${c.id} ${c.name} on ${origin}` });
  const p = await ctx.newPage();
  await p.goto(`${origin}${c.path}`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles({ name: c.name, mimeType: 'application/octet-stream', buffer: c.buffer || fs.readFileSync(c.file) });
  await p.getByRole('button', { name: /^Convert/ }).first().click();
  const state = await Promise.race([
    p.locator('[data-file-download] [data-download], a[download]').first().waitFor({ timeout: 240000 }).then(() => 'file'),
    p.locator('p[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 240000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  let head = '', producer = '', alert = '';
  if (state === 'file') {
    const a = p.locator('[data-file-download] [data-download], a[download]').first();
    [head, producer] = await a.evaluate(async (el) => {
      const t = new Uint8Array(await (await fetch(el.href)).arrayBuffer());
      const s = new TextDecoder('latin1').decode(t);
      // The producer may be a literal string, a UTF-16 hex string or only in the XMP packet: the engine's name is enough.
      const m = /\/Producer\s*\(([^)]*)\)/.exec(s);
      const named = /LibreOffice/.test(s) ? 'LibreOffice' : /ConvertAPI|convertapi|Aspose|Microsoft/i.exec(s)?.[0] || '';
      return [String.fromCharCode(...t.slice(0, 5)) + ` ${t.length}`, m ? m[1] : named];
    });
  } else if (state === 'alert') alert = await p.locator('p[role=alert]').filter({ hasText: /./ }).first().innerText();
  await p.waitForTimeout(500);
  const notice = await p.locator('[data-engine-fallback]').count() ? await p.locator('[data-engine-fallback]').innerText() : '';
  const isWordToPdfDocx = c.id === 'word-to-pdf' || c.id === 'word-to-pdf-staged';
  if (expect === 'fallback') {
    if (c.id === 'word-to-pdf-odt') check(c.id, state === 'file' && head.startsWith(c.out) && !notice, `${state} ${head} notice=${notice ? 'yes' : 'no'}`);
    else if (isWordToPdfDocx) check(c.id, state === 'file' && head.startsWith('%PDF-') && /LibreOffice/i.test(producer) && /backup converter/.test(notice), `${state} ${head} producer=${producer} notice=${notice.slice(0, 50)}`);
    else check(c.id, state === 'alert' && new RegExp(`PDF to ${c.label} is temporarily unavailable.*try again later`, 'i').test(alert), `${state} ${alert.slice(0, 120)}`);
  } else {
    const ok = state === 'file' && head.startsWith(c.out) && !notice && (!isWordToPdfDocx || !/LibreOffice/i.test(producer));
    if (realPaid && state !== 'file') refundPaid({ chantier: 'P30', provider: 'convertapi', usd: 0.01, what: `${c.id} ${c.name}` });
    check(c.id, ok, `${state} ${head} producer=${producer || '-'} ${alert.slice(0, 120)}`);
  }
  await p.close();
}
await b.close();
console.log(`convertapi-pages ${origin} expect=${expect}: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
