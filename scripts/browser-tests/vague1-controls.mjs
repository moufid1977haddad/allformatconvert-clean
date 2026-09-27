// The "wave 1" controls of blocker 11 (claude/plan-de-travail.md, § 11), automated as a visitor on the live site,
// without any paid call: every file is made here and every result reopened here.
//  1. image-converter: TIFF now accepted (decoder since 990b99a3) and the page does not say otherwise; a real .tif
//     through tiff-to-jpg gives a real JPEG of the same size.
//  2. audio-trimmer: a cut .wav is named .wav and is a WAV; a cut .mp3 is named .mp3 and is an MP3.
//  3. audio-transcriber: the ceiling is written before the file is chosen, and a file above it is refused without
//     anything being sent (no request to our routes or our service).
//  4. word-to-pdf: .doc accepted by the picker; the page no longer claims "the same LibreOffice engine" for .docx.
//     (The conversion itself is not run: .docx goes to ConvertAPI, paid.)
//  5. tar-extractor: a real .tar.gz (made by Windows' tar) extracts, bytes identical.
//  6. xml-to-json: the page loads without error; <item id="5"> gives the key "@_id".
//  7. excel-to-json: the sheet names show as soon as the workbook is read; a 2-sheet workbook gives JSON keyed by
//     sheet name.
// Usage: node scripts/browser-tests/vague1-controls.mjs <origin> <ffmpeg> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import XLSX from 'xlsx';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vague1-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const ffprobe = FF.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const probeFmt = (f) => execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=format_name', '-of', 'csv=p=0', f]).toString().trim();

const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true });
const pageErrors = [];
const open = async (p) => { const pg = await ctx.newPage(); pg.on('pageerror', (e) => pageErrors.push(`${p}: ${e.message}`)); await pg.goto(origin + p, { waitUntil: 'networkidle' }); return pg; };
const dl = async (pg, loc) => { const [d] = await Promise.all([pg.waitForEvent('download'), loc.click()]); const f = path.join(tmp, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(f); return { f, name: d.suggestedFilename() }; };

{ // 1. TIFF
  const tif = path.join(tmp, 'photo.tif');
  await sharp({ create: { width: 640, height: 480, channels: 3, background: { r: 200, g: 60, b: 30 } } }).tiff().toFile(tif);
  let p = await open('/tools/image-tools/image-converter');
  const txt = await p.locator('body').innerText();
  check('1a image-converter lists TIFF as an input and never says it is not supported', /TIFF/.test(txt) && !/TIFF[^.]{0,60}not supported|not supported[^.]{0,60}TIFF/i.test(txt));
  await p.close();
  p = await open('/tools/image-tools/tiff-to-jpg');
  await p.locator('input[type=file]').setInputFiles(tif);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const a = p.locator('a[download]').first();
  if (await a.waitFor({ timeout: 60000 }).then(() => true).catch(() => false)) { const { f } = await dl(p, a); const m = await sharp(f).metadata(); check('1b a real .tif -> tiff-to-jpg -> JPEG 640x480', m.format === 'jpeg' && m.width === 640 && m.height === 480, `${m.format} ${m.width}x${m.height}`); }
  else check('1b tiff-to-jpg result', false, (await p.locator('[role=alert]').allTextContents()).join(' '));
  await p.close();
}
{ // 2. audio-trimmer names
  for (const [ext, codec] of [['wav', ['-c:a', 'pcm_s16le']], ['mp3', ['-c:a', 'libmp3lame']]]) {
    const src = path.join(tmp, `tone.${ext}`); execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=d=5', ...codec, src]);
    const p = await open('/tools/audio-tools/audio-trimmer');
    await p.locator('input[type=file]').setInputFiles(src);
    await p.locator('#at-end').waitFor({ timeout: 60000 });
    await p.locator('#at-start').fill('1'); await p.locator('#at-end').fill('3');
    await p.getByRole('button', { name: 'Trim Audio' }).click();
    const a = p.locator('a[download]').first(); await a.waitFor({ timeout: 120000 });
    const { f, name } = await dl(p, a);
    check(`2 audio-trimmer .${ext} -> ${name} (${probeFmt(f)})`, name.endsWith('.' + ext) && probeFmt(f).includes(ext));
    await p.close();
  }
}
{ // 3. audio-transcriber ceiling
  const p = await open('/tools/ai-tools/audio-transcriber');
  const before = await p.locator('body').innerText();
  const m = before.match(/Max (\d+) MB per file/);
  check('3a ceiling written before any file is chosen', !!m, m ? m[0] : 'not found');
  const sent = []; p.on('request', (r) => { const u = r.url(); if (/\/api\/|railway|media/.test(u) && r.method() !== 'GET') sent.push(u); });
  const big = path.join(tmp, 'big.mp3'); fs.writeFileSync(big, Buffer.alloc(((m ? Number(m[1]) : 25) + 1) * 1048576, 1));
  await p.locator('input[type=file]').setInputFiles(big);
  await p.waitForTimeout(2000);
  const btn = p.getByRole('button', { name: /Transcribe/ }).first();
  const disabled = (await btn.count()) ? await btn.isDisabled() : true;
  if (!disabled) await btn.click().catch(() => {});
  await p.waitForTimeout(2000);
  const said = (await p.locator('[role=alert], .text-red-500, .text-red-600, .text-red-400').allTextContents()).join(' ');
  check('3b a file 1 MB over the ceiling is refused, nothing sent', sent.length === 0 && /MB/.test(said), `${said.slice(0, 140)} · requests ${sent.length}`);
  await p.close();
}
{ // 4. word-to-pdf .doc and wording
  const p = await open('/tools/pdf-tools/word-to-pdf');
  const accept = await p.locator('input[type=file]').getAttribute('accept');
  const txt = await p.locator('body').innerText();
  check('4 .doc accepted by the picker; no "same LibreOffice engine" claim for .docx', /\.doc\b/.test(accept) && !/same (LibreOffice )?engine/i.test(txt), `accept="${accept}"`);
  await p.close();
}
{ // 5. tar.gz
  const dir = path.join(tmp, 'tree'); fs.mkdirSync(path.join(dir, 'sub'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.txt'), 'alpha\n'); fs.writeFileSync(path.join(dir, 'sub', 'b.bin'), Buffer.from([0, 1, 2, 250, 255]));
  const tgz = path.join(tmp, 'tree.tar.gz'); execFileSync('C:\\Windows\\System32\\tar.exe', ['-czf', tgz, '-C', tmp, 'tree']);
  const p = await open('/tools/file-tools/tar-extractor');
  await p.locator('input[type=file]').setInputFiles(tgz);
  await p.getByText('b.bin').first().waitFor({ timeout: 30000 }).catch(() => {});
  const body = await p.locator('body').innerText();
  check('5a .tar.gz listed: a.txt and sub/b.bin, no PaxHeader', /a\.txt/.test(body) && /b\.bin/.test(body) && !/PaxHeader/.test(body));
  const links = p.locator('a[download], button:has-text("Download")');
  let got = null; for (const l of await links.all()) { const t = (await l.textContent()) || ''; if (/b\.bin|Download/.test(t)) { const r = await dl(p, l); if (r.name.includes('b.bin')) { got = r; break; } } }
  if (got) check('5b sub/b.bin bytes identical', fs.readFileSync(got.f).equals(Buffer.from([0, 1, 2, 250, 255])));
  await p.close();
}
{ // 6. xml-to-json
  const p = await open('/tools/developer-tools/xml-to-json');
  await p.locator('textarea').first().fill('<root><item id="5">x</item></root>');
  await p.getByRole('button', { name: /Convert/ }).first().click();
  await p.waitForFunction(() => document.querySelectorAll('textarea')[1]?.value.length > 0, null, { timeout: 10000 }).catch(() => {});
  const out = await p.locator('textarea').nth(1).inputValue();
  check('6 xml-to-json: page loads without error, id="5" -> "@_id"', /"@_id"\s*:\s*"?5"?/.test(out) && !pageErrors.some((e) => e.startsWith('/tools/developer-tools/xml-to-json')), out.replace(/\s+/g, ' ').slice(0, 120));
  await p.close();
}
{ // 7. excel-to-json
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['name', 'n'], ['a', 1], ['b', 2]]), 'Clients');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['sku', 'qty'], ['X1', 7]]), 'Stock');
  const xlsx = path.join(tmp, 'two-sheets.xlsx'); XLSX.writeFile(wb, xlsx);
  const p = await open('/tools/developer-tools/excel-to-json');
  // Conversion and download start by themselves once the file is chosen (no button).
  const dP = p.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await p.locator('input[type=file]').setInputFiles(xlsx);
  await p.getByText('Stock').first().waitFor({ timeout: 20000 }).catch(() => {});
  const shown = await p.locator('body').innerText();
  check('7a sheet names shown once the workbook is read', /Clients/.test(shown) && /Stock/.test(shown));
  const d = await dP;
  if (d) { const f = path.join(tmp, d.suggestedFilename()); await d.saveAs(f); const j = JSON.parse(fs.readFileSync(f, 'utf8')); check('7b JSON keyed by sheet name', j.Clients?.length === 2 && j.Stock?.[0]?.sku === 'X1', JSON.stringify(j).slice(0, 120)); }
  else check('7b JSON downloaded', false);
  await p.close();
}
await b.close();
if (pageErrors.length) console.log('page errors:', pageErrors.slice(0, 5));
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);
