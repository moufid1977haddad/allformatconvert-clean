// P24 (03/10), additions from the second survey: compress to a target size, read every code in a picture, record with
// pause and export an MP3. Usage: node scripts/p24/adds-lot.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { ok ? passes++ : fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-adds-'));
const launchOpts = name === 'chromium' ? { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } : name === 'firefox' ? { firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true } } : {};
const b = await { chromium, firefox, webkit }[name].launch(launchOpts);
const ctx = await b.newContext({ acceptDownloads: true, permissions: name === 'chromium' ? ['microphone'] : [] });
const open = async (slug) => { const p = await ctx.newPage(); await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' }); await p.waitForTimeout(800); return p; };
const bytesOf = (p, a) => a.evaluate(async (el) => { const u = new Uint8Array(await (await fetch(el.href)).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); }).then((s) => Buffer.from(s, 'base64'));

if (name === 'webkit') console.log('SKIP webkit image-compressor: Playwright WebKit for Windows has no OffscreenCanvas in workers (the page says so)');
else { // Image Compressor: to a target size
  const raw = Buffer.alloc(1200 * 900 * 3); for (let i = 0; i < raw.length; i++) raw[i] = (i * 2654435761 >>> 24) ^ (i % 1200); // detailed, hard to compress
  const photo = path.join(dir, 'photo.jpg'); await sharp(raw, { raw: { width: 1200, height: 900, channels: 3 } }).jpeg({ quality: 95 }).toFile(photo);
  const p = await open('image-tools/image-compressor');
  await p.locator('input[type=file]').first().setInputFiles(photo);
  await p.locator('#ic-target-mode').check(); await p.locator('#ic-target-kb').fill('40');
  await p.getByRole('button', { name: /Compress/ }).first().click();
  const a = p.locator('[data-file-download] [data-download]').first();
  const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  const out = ok ? await bytesOf(p, a) : Buffer.alloc(0);
  const text = await p.locator('main').innerText();
  const m = ok ? await sharp(out).metadata() : {};
  check('image-compressor: to 40 KB — the JPG fits (≤ 40 KB), keeps 1200×900, and says the quality chosen', ok && out.length <= 40 * 1024 && m.width === 1200 && /highest that fits in 40 KB/.test(text), `${out.length} B ${m.width}×${m.height}`);
  await p.close();
}
{ // QR Scanner: every code in one picture, barcodes included
  const ean = await bwipjs.toBuffer({ bcid: 'ean13', text: '4006381333931', scale: 3, height: 15, includetext: false, paddingwidth: 10, paddingheight: 10, backgroundcolor: 'FFFFFF' });
  const qr = await QRCode.toBuffer('https://example.com/p24', { width: 300, margin: 4 });
  const pic = path.join(dir, 'codes.png');
  const em = await sharp(ean).metadata();
  await sharp({ create: { width: 900, height: 420, channels: 3, background: '#ffffff' } }).composite([{ input: qr, left: 20, top: 60 }, { input: ean, left: 400, top: 120 }]).png().toFile(pic);
  const p = await open('qr-barcodes-tools/qr-scanner');
  await p.locator('input[type=file]').first().setInputFiles(pic);
  const listed = await p.locator('[data-codes]').innerText({ timeout: 30000 }).catch(() => '');
  check('qr-scanner: a QR code and an EAN-13 in one picture both read, with their formats', /4006381333931/.test(listed) && /example\.com\/p24/.test(listed) && /EAN/i.test(listed), listed.replace(/\n/g, ' | ').slice(0, 160) + ` (ean ${em.width}px)`);
  await p.close();
}
if (name !== 'webkit') { // Voice Recorder: pause / resume and an MP3 (the browsers' fake microphone)
  const p = await open('audio-tools/voice-recorder');
  await p.getByRole('button', { name: 'Start Recording' }).click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'Pause' }).click();
  const pausedText = await p.locator('main').innerText();
  await p.waitForTimeout(600);
  await p.getByRole('button', { name: 'Resume' }).click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'Stop Recording' }).click();
  await p.getByRole('button', { name: 'Export as MP3' }).click({ timeout: 15000 });
  const a = p.locator('a[download$=".mp3"], [data-file-download][data-name$=".mp3"] a').first();
  const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  const mp3 = ok ? await bytesOf(p, a) : Buffer.alloc(0);
  const isMp3 = mp3.length > 1000 && ((mp3[0] === 0x49 && mp3[1] === 0x44 && mp3[2] === 0x33) || (mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0));
  check('voice-recorder: Pause says paused, Resume continues, Export as MP3 gives a real MP3', /Paused/.test(pausedText) && isMp3, `${mp3.length} B`);
  await p.close();
} else console.log('SKIP webkit voice-recorder: this test browser has no fake microphone');
if (name === 'chromium') { // Excel to PDF: each sheet on one page (Gotenberg singlePageSheets) — one engine: the work is on the server
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));
  const head = Array.from({ length: 40 }, (_, i) => `Column number ${i + 1}`);
  const ws = XLSX.utils.aoa_to_sheet([head, ...Array.from({ length: 30 }, (_, r) => head.map((_, c) => `value ${r}-${c}`))]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Wide');
  const xlsx = path.join(dir, 'wide.xlsx'); fs.writeFileSync(xlsx, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  const { PDFDocument } = await import('pdf-lib');
  const pages = async (onePage) => {
    const p = await open('pdf-tools/excel-to-pdf');
    await p.locator('input[type=file]').first().setInputFiles(xlsx);
    if (onePage) await p.locator('#xl-one-page').check();
    await p.getByRole('button', { name: /Convert/ }).first().click();
    const a = p.locator('a[download]').first();
    const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
    const n = ok ? (await PDFDocument.load(await bytesOf(p, a))).getPageCount() : -1;
    await p.close(); return n;
  };
  const normal = await pages(false), one = await pages(true);
  check('excel-to-pdf: a 40-column sheet is cut over several pages, and on ONE page with "Fit each sheet on one page"', normal > 1 && one === 1, `${normal} pages → ${one}`);
}
{ // JPG to PDF: A4, automatic orientation, 20 mm margin
  const wide = path.join(dir, 'wide.png'); await sharp({ create: { width: 800, height: 400, channels: 3, background: '#3366cc' } }).png().toFile(wide);
  const tall = path.join(dir, 'tall.png'); await sharp({ create: { width: 300, height: 600, channels: 3, background: '#cc3333' } }).png().toFile(tall);
  const p = await open('pdf-tools/jpg-to-pdf');
  await p.locator('input[type=file]').first().setInputFiles([wide, tall]);
  await p.locator('#pl-size').selectOption('a4'); await p.locator('#pl-margin').selectOption('20');
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const a = p.locator('a[download]').first(); await a.waitFor({ timeout: 60000 });
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.load(await bytesOf(p, a));
  const sz = pdf.getPages().map((pg) => `${Math.round(pg.getWidth())}×${Math.round(pg.getHeight())}`).join(',');
  check('jpg-to-pdf: A4 pages, landscape for the wide picture, portrait for the tall one', sz === '842×595,595×842', sz);
  await p.close();
}
{ // Image Resizer: save as WebP; Image Flip both ways; Pixelator in % of the picture
  const src = path.join(dir, 'grad.png');
  const g = Buffer.alloc(400 * 200 * 3); for (let y = 0; y < 200; y++) for (let x = 0; x < 400; x++) { const i = (y * 400 + x) * 3; g[i] = x * 255 / 400; g[i + 1] = y * 255 / 200; g[i + 2] = 60; }
  await sharp(g, { raw: { width: 400, height: 200, channels: 3 } }).png().toFile(src);
  if (name !== 'webkit' || true) {
    const p = await open('image-tools/image-resizer');
    await p.locator('input[type=file]').first().setInputFiles(src);
    await p.waitForTimeout(500);
    await p.getByRole('button', { name: /50%/ }).first().click().catch(() => {});
    await p.locator('#rs-format').selectOption('image/webp');
    await p.getByRole('button', { name: /^Resize/ }).first().click();
    const a = p.locator('[data-file-download] a[data-download], a[download]').first();
    const ok = await a.waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
    const out = ok ? await bytesOf(p, a) : Buffer.alloc(0);
    const m = ok ? await sharp(out).metadata() : {};
    check('image-resizer: saved as WebP when asked (a PNG source)', m.format === 'webp', `${m.format} ${m.width}×${m.height}`);
    await p.close();
  }
  const f = await open('image-tools/image-flip');
  await f.locator('input[type=file]').first().setInputFiles(src);
  await f.getByRole('button', { name: 'Flip Both Ways' }).click();
  const fa = f.locator('[data-file-download] a[data-download], a[download]').first(); await fa.waitFor({ timeout: 60000 });
  const fb = await bytesOf(f, fa);
  const px = async (buf, x, y) => [...await sharp(buf).removeAlpha().extract({ left: x, top: y, width: 1, height: 1 }).raw().toBuffer()];
  const [tl, srcBr] = [await px(fb, 0, 0), await px(await fs.promises.readFile(src), 399, 199)];
  check('image-flip: both ways = the bottom-right pixel comes to the top-left', Math.abs(tl[0] - srcBr[0]) < 4 && Math.abs(tl[1] - srcBr[1]) < 4, `${tl} vs ${srcBr}`);
  await f.close();
}
{ // Find & Replace: whole words, ignore case; Diff Viewer: changed words marked
  const p = await open('text-tools/find-replace');
  await p.locator('textarea').first().fill('Cat cat catalog café');
  const inputs = p.locator('main input[type=text]'); // not the site's search box in the header
  await inputs.nth(0).fill('cat'); await inputs.nth(1).fill('dog');
  await p.locator('#fr-case').check(); await p.locator('#fr-word').check();
  await p.getByRole('button', { name: /Replace/ }).first().click();
  const out = await p.getByLabel('Result').inputValue();
  check('find-replace: whole words, ignoring case — "catalog" left alone', /dog dog catalog café/.test(out), out);
  await p.close();
  const d = await open('developer-tools/diff-viewer');
  await d.locator('textarea').nth(0).fill('the quick brown fox'); await d.locator('textarea').nth(1).fill('the slow brown fox');
  await d.getByRole('button', { name: /Compare/ }).first().click();
  await d.locator('span.rounded').first().waitFor({ timeout: 15000 }).catch(() => {}); // the diff library loads on demand
  const marked = await d.locator('span.rounded').allInnerTexts();
  check('diff-viewer: only "quick" and "slow" are marked inside the changed line', marked.join('|') === 'quick|slow', marked.join('|'));
  await d.close();
}
{ // Video / Audio Metadata: remove the metadata without re-encoding (local ffmpeg makes the files, ffprobe checks them)
  const FF = path.join(os.tmpdir(), 'ffmpeg-btbn/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe'), FP = FF.replace(/ffmpeg\.exe$/, 'ffprobe.exe');
  if (!fs.existsSync(FF)) console.log('SKIP metadata stripper: no local ffmpeg to make and check the files');
  else {
    const vid = path.join(dir, 'tagged.mp4'), aud = path.join(dir, 'tagged.mp3');
    execFileSync(FF, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25', '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', '2', '-c:v', 'libx264', '-c:a', 'aac', '-metadata', 'title=Secret holiday', '-metadata', 'location=+48.8584+002.2945/', '-metadata', 'creation_time=2024-07-14T10:00:00Z', '-movflags', '+use_metadata_tags', vid]);
    execFileSync(FF, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', '2', '-c:a', 'libmp3lame', '-metadata', 'title=Private memo', '-metadata', 'artist=Ann Smith', aud]);
    const probe = (f) => JSON.parse(execFileSync(FP, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', f]).toString());
    const strip = async (slug, file) => {
      const p = await open(slug);
      await p.locator('input[type=file]').first().setInputFiles(file);
      await p.getByRole('button', { name: /Remove the metadata/ }).click();
      const a = p.locator('[data-metadata-stripper] a[data-download], [data-metadata-stripper] a[download]').first();
      const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
      const out = path.join(dir, 'clean-' + path.basename(file));
      if (ok) fs.writeFileSync(out, await bytesOf(p, a));
      const err = ok ? '' : (await p.locator('[data-metadata-stripper]').innerText()).slice(0, 160);
      await p.close(); return ok ? out : err;
    };
    const v = await strip('video-tools/video-metadata', vid);
    if (!v.endsWith('.mp4')) check('video-metadata: metadata removed', false, v); else {
      const before = probe(vid), after = probe(v);
      const tags = JSON.stringify(after.format.tags || {}) + JSON.stringify(after.streams.map((s) => s.tags || {}));
      const sameStreams = after.streams.map((s) => s.codec_name).join() === before.streams.map((s) => s.codec_name).join() && Math.abs(Number(after.format.duration) - Number(before.format.duration)) < 0.1;
      check('video-metadata: title, location and date removed; H.264 + AAC copied, same duration', !/Secret|48\.8584|2024-07-14/.test(tags) && /Secret/.test(JSON.stringify(before.format.tags)) && sameStreams, tags.slice(0, 120));
    }
    const au = await strip('audio-tools/audio-metadata', aud);
    if (!au.endsWith('.mp3')) check('audio-metadata: tags removed', false, au); else {
      const after = probe(au);
      check('audio-metadata: title and artist removed, MP3 sound copied', !/Private memo|Ann Smith/.test(JSON.stringify(after.format.tags || {})) && after.streams[0].codec_name === 'mp3', JSON.stringify(after.format.tags || {}));
    }
  }
}
if (name !== 'webkit') { // Video to GIF: refusals (local) and plays once / 3 times (gifsicle after the service); Playwright WebKit decodes no video
  const FF = path.join(os.tmpdir(), 'ffmpeg-btbn/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe');
  if (!fs.existsSync(FF)) console.log('SKIP video-to-gif loops: no local ffmpeg to make the clip'); else {
    const clip = path.join(dir, 'clip.mp4');
    execFileSync(FF, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25', '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', clip]);
    const loopOf = (g) => { const i = g.indexOf('NETSCAPE2.0'); return i < 0 ? 'none' : g.readUInt16LE(i + 13); };
    const make = async (loop) => {
      const p = await open('gif-tools/mp4-to-gif');
      await p.locator('input[type=file]').first().setInputFiles(clip);
      await p.locator('#gif-loop').selectOption(loop);
      await p.getByRole('button', { name: 'Make GIF' }).click();
      const a = p.locator('a[download$=".gif"], [data-file-download] a[data-download]').first();
      const ok = await a.waitFor({ timeout: 180000 }).then(() => true).catch(() => false);
      const g = ok ? await bytesOf(p, a) : Buffer.alloc(0);
      const mt = ok ? '' : await p.locator('main').innerText();
      const err = /video service is not available/i.test(mt) ? 'video service is not available' : mt.slice(0, 120);
      await p.close(); return ok ? loopOf(g) : 'ERR ' + err;
    };
    // the refusals are decided before anything is sent: testable without the service
    const refuse = async (start, length) => {
      const p = await open('gif-tools/mp4-to-gif');
      await p.locator('input[type=file]').first().setInputFiles(clip);
      await p.waitForTimeout(1500); // the clip's duration is read locally
      const nums = p.locator('main input[type=number]');
      await nums.nth(0).fill(String(start)); await nums.nth(1).fill(String(length));
      await p.getByRole('button', { name: 'Make GIF' }).click();
      await p.waitForTimeout(1500);
      const t = await p.locator('main').innerText(); await p.close(); return t;
    };
    const late = await refuse(10, 2), long = await refuse(0, 90);
    check('video-to-gif: a start after the end of a 2-s clip is refused, and 90 s is refused (it became 60 s silently)', /lasts 2\.0 s: the start \(10 s\) is after its end/.test(late) && /at most 60 seconds/.test(long), '');
    const once = await make('1');
    if (/video service is not available/i.test(String(once))) console.log('SKIP video-to-gif loops: the video service is not configured on this machine (checked on the preview)');
    else { const three = await make('3');
    check('video-to-gif: "Once" has no loop extension, "3 times" repeats twice', once === 'none' && three === 2, `${once} / ${three}`); }
  }
}
{ // Excel to CSV: semicolon + BOM; CSV to JSON: JSON Lines; URL Encoder: whole URL; Image to Base64: <img> tag
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));
  const ws = XLSX.utils.aoa_to_sheet([['name', 'city'], ['Zoë', 'Zürich']]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'S');
  const xl = path.join(dir, 'people.xlsx'); fs.writeFileSync(xl, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  const e = await open('developer-tools/excel-to-csv');
  await e.locator('#x2c-delimiter').selectOption(';'); await e.locator('#x2c-bom').check();
  await e.locator('input[type=file]').first().setInputFiles(xl);
  const ea = e.locator('a[download]').first(); await ea.waitFor({ timeout: 30000 });
  const csv = await bytesOf(e, ea);
  check('excel-to-csv: semicolon separator and UTF-8 BOM when asked', csv[0] === 0xef && csv[1] === 0xbb && csv[2] === 0xbf && csv.toString('utf8').includes('Zoë;Zürich'), JSON.stringify(csv.toString('utf8').slice(0, 40)));
  await e.close();
  const j = await open('developer-tools/csv-to-json');
  await j.locator('textarea').first().fill('a,b\n1,x\n2,y\n');
  await j.locator('#c2j-shape').selectOption('jsonl');
  await j.getByRole('button', { name: 'Convert', exact: true }).click();
  await j.waitForFunction(() => document.querySelector('textarea[aria-label="JSON Output"]')?.value, null, { timeout: 15000 }).catch(() => {});
  const jl = await j.getByLabel('JSON Output').inputValue();
  check('csv-to-json: JSON Lines — one object per line', jl === '{"a":1,"b":"x"}\n{"a":2,"b":"y"}', JSON.stringify(jl));
  await j.close();
  const u = await open('developer-tools/url-encoder');
  await u.locator('textarea').first().fill('https://x.com/a b?q=café');
  await u.locator('#url-mode').selectOption('url');
  await u.getByRole('button', { name: /^Encode/ }).first().click();
  const uo = await u.locator('textarea').nth(1).inputValue();
  check('url-encoder: "a whole URL" keeps : / ? = and encodes the space and é', uo === 'https://x.com/a%20b?q=caf%C3%A9', uo);
  await u.close();
  const g = await open('image-tools/image-to-base64');
  const tiny = path.join(dir, 'tiny.png'); await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ff0000' } }).png().toFile(tiny);
  await g.locator('input[type=file]').first().setInputFiles(tiny);
  await g.locator('#b64-format').selectOption('img', { timeout: 15000 });
  const tag = await g.getByLabel('Result').inputValue();
  check('image-to-base64: <img> tag output', /^<img src="data:image\/png;base64,[A-Za-z0-9+/=]+" alt="">$/.test(tag), tag.slice(0, 50));
  await g.close();
}
{ // GIF Maker: one frame with its own duration
  const f1 = path.join(dir, 'f1.png'), f2 = path.join(dir, 'f2.png');
  await sharp({ create: { width: 40, height: 40, channels: 3, background: '#ff0000' } }).png().toFile(f1);
  await sharp({ create: { width: 40, height: 40, channels: 3, background: '#0000ff' } }).png().toFile(f2);
  const p = await open('gif-tools/gif-maker');
  await p.locator('input[type=file]').first().setInputFiles([f1, f2]);
  await p.getByLabel('Duration of frame 2 (ms)').fill('1000');
  await p.getByRole('button', { name: /Create GIF/ }).click();
  const a = p.locator('a[download$=".gif"], [data-file-download] a[data-download]').first(); await a.waitFor({ timeout: 60000 });
  const m = await sharp(await bytesOf(p, a), { animated: true }).metadata();
  check('gif-maker: frame 2 keeps its own 1000 ms, frame 1 the common delay (200 ms)', m.pages === 2 && m.delay?.[0] === 200 && m.delay?.[1] === 1000, JSON.stringify(m.delay));
  await p.close();
}
{ // lot 8: round corners in a colour keep a JPG; colour noise; saturation 0 = grey; waveform PNG at the chosen size; Extract Text pages
  const photo = path.join(dir, 'p8.jpg');
  await sharp({ create: { width: 300, height: 200, channels: 3, background: '#cc4422' } }).jpeg({ quality: 92 }).toFile(photo);
  const rc = await open('image-tools/round-corners');
  await rc.locator('input[type=file]').first().setInputFiles(photo);
  await rc.locator('#rc-fill-colour').check();
  await rc.getByRole('button', { name: /Apply|Round/ }).first().click();
  const ra = rc.locator('[data-file-download] a[data-download], a[download]').first(); await ra.waitFor({ timeout: 60000 });
  const rb = await bytesOf(rc, ra); const rm = await sharp(rb).metadata(); const corner = [...await sharp(rb).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer()];
  check('round-corners: corners in a colour — the JPG stays a JPG, corner white', rm.format === 'jpeg' && corner[0] > 240 && corner[1] > 240, `${rm.format} ${corner}`);
  await rc.close();
  const nz = await open('image-tools/add-noise');
  const grey = path.join(dir, 'grey.png'); await sharp({ create: { width: 64, height: 64, channels: 3, background: '#808080' } }).png().toFile(grey);
  await nz.locator('input[type=file]').first().setInputFiles(grey);
  await nz.locator('#noise-colour').check();
  await nz.getByRole('button', { name: /Apply|Add/ }).first().click();
  const na = nz.locator('[data-file-download] a[data-download], a[download]').first(); await na.waitFor({ timeout: 60000 });
  const raw = await sharp(await bytesOf(nz, na)).removeAlpha().raw().toBuffer();
  let coloured = 0; for (let i = 0; i < raw.length; i += 3) if (raw[i] !== raw[i + 1] || raw[i + 1] !== raw[i + 2]) coloured++;
  check('add-noise: colour noise — most pixels no longer grey (R, G, B differ)', coloured > raw.length / 3 * 0.8, `${coloured} of ${raw.length / 3}`);
  await nz.close();
  const bc = await open('image-tools/brightness-contrast');
  await bc.locator('input[type=file]').first().setInputFiles(photo);
  await bc.locator('#bc-saturation').fill('0');
  await bc.getByRole('button', { name: /Apply|Adjust/ }).first().click();
  const ba = bc.locator('[data-file-download] a[data-download], a[download]').first(); await ba.waitFor({ timeout: 60000 });
  const bp = [...await sharp(await bytesOf(bc, ba)).extract({ left: 150, top: 100, width: 1, height: 1 }).raw().toBuffer()];
  check('brightness-contrast: saturation 0 gives grey', Math.abs(bp[0] - bp[1]) <= 3 && Math.abs(bp[1] - bp[2]) <= 3, String(bp));
  await bc.close();
  const FF = path.join(os.tmpdir(), 'ffmpeg-btbn/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe');
  if (name === 'webkit') console.log('SKIP webkit audio-waveform save: this engine takes the iPhone saving path (no download event in the test browser)');
  else if (fs.existsSync(FF)) {
    const wav = path.join(dir, 'tone.wav'); execFileSync(FF, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=300', '-t', '1', wav]);
    const wf = await open('audio-tools/audio-waveform');
    await wf.locator('input[type=file]').first().setInputFiles(wav);
    await wf.waitForTimeout(1500);
    await wf.locator('#wf-w').selectOption('1200'); await wf.locator('#wf-h').selectOption('150'); await wf.locator('#wf-transparent').check();
    const [dl] = await Promise.all([wf.waitForEvent('download', { timeout: 30000 }), wf.getByRole('button', { name: /PNG|Download/ }).last().click()]);
    const png = path.join(dir, 'wave.png'); await dl.saveAs(png);
    const wm = await sharp(png).metadata(); const c0 = [...await sharp(png).ensureAlpha().extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer()];
    check('audio-waveform: PNG at the chosen 1200 × 150, transparent background', wm.width === 1200 && wm.height === 150 && c0[3] === 0, `${wm.width}×${wm.height} alpha ${c0[3]}`);
    await wf.close();
  }
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 4; i++) pdf.addPage([300, 300]).drawText(`Text of page ${i}`, { x: 30, y: 150, size: 14, font });
  const pf = path.join(dir, 'four.pdf'); fs.writeFileSync(pf, await pdf.save());
  const et = await open('pdf-tools/pdf-extract-text');
  await et.locator('input[type=file]').first().setInputFiles(pf);
  await et.locator('#et-range').fill('2-3'); await et.locator('#et-headings').uncheck();
  await et.getByRole('button', { name: /Extract/ }).first().click();
  await et.waitForFunction(() => document.querySelector('main textarea')?.value, null, { timeout: 30000 }).catch(() => {});
  const txt = await et.locator('main textarea').first().inputValue();
  check('pdf-extract-text: pages 2-3 only, without "Page N:" headings', /Text of page 2/.test(txt) && /Text of page 3/.test(txt) && !/page 1|page 4|Page \d+:/.test(txt), JSON.stringify(txt.slice(0, 60)));
  await et.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exitCode = fails ? 1 : 0;
