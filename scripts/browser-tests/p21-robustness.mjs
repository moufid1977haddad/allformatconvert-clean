// P21 phase 5 (02/10) — robustness of EVERY tool that takes a file. For each tool page with a file input, each bad
// input is given as a visitor would (file picker, then the tool's main button if it does not start by itself):
//   empty      a 0-byte file with the tool's own extension
//   corrupt    512 random bytes with the tool's own extension
//   wrong      a real file of another kind under the tool's extension (a PDF named .png, a PNG named .pdf/.mp4/.mp3…)
//   locked     a password-protected PDF (PDF tools)
//   giant      a real 30 000 × 30 000 PNG (900 megapixels, 2.6 MB on disk) (image tools)
//   bomb       a real 20 000 × 20 000 two-colour PNG (400 megapixels, 49 KB: under every size cap) (image tools, P23)
//   silent     a real MP4 with no audio track (tools that take a video and give sound)
// Expected everywhere: a clear sentence on the page; never an uncaught page error, a blank page, a spinner that never
// ends, or a "result" made from nothing. Tools whose job is to take ANY bytes (hash, Base64, split, zip, encrypt…)
// are expected to give a result for corrupt / wrong input and a message for the empty file only where it makes sense.
// Usage: node scripts/browser-tests/p21-robustness.mjs <origin> [--browser=chromium|firefox|webkit] [--only=slug,slug]
//        [--cases=empty,corrupt] [--no-vercel-toolbar] [--json=out.json]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const name = arg('browser') || 'chromium';
const engine = { chromium, firefox, webkit }[name];
const only = (arg('only') || '').split(',').filter(Boolean);
const cases = (arg('cases') || 'empty,corrupt,wrong,locked,giant,bomb,silent').split(',');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-robust-'));

// Tools whose job is to accept any bytes: a result from corrupt / wrong input is right there.
// Tools whose answer to any file is a report (properties, a verdict): their report is the right answer.
const INFO_TOOLS = new Set(['file-metadata', 'file-comparator', 'image-metadata', 'audio-metadata', 'video-metadata']);
const ANY_BYTES = new Set(['hash-generator', 'base64-encoder', 'file-splitter', 'file-merger', 'zip-creator', 'file-encryptor', 'file-metadata',
  'file-comparator', 'checksum-calculator', 'file-converter', 'image-to-base64', 'file-size-calculator', 'binary-viewer', 'hex-viewer']);

// ---- inventory of tool pages with a file input (from the code) --------------------------------------------------
function inventory() {
  const out = [];
  const toolsDir = path.join(ROOT, 'app', 'tools');
  for (const cat of fs.readdirSync(toolsDir)) {
    const cdir = path.join(toolsDir, cat);
    if (!fs.statSync(cdir).isDirectory()) continue;
    for (const t of fs.readdirSync(cdir)) {
      const tdir = path.join(cdir, t);
      if (!fs.statSync(tdir).isDirectory()) continue;
      let src = '';
      for (const f of fs.readdirSync(tdir)) if (/\.(jsx|tsx|js)$/.test(f) && !/worker|config|seo/i.test(f)) src += fs.readFileSync(path.join(tdir, f), 'utf8');
      if (/MediaServiceTool|GifFromVideoTool/.test(src)) src += 'type="file" accept="video/*,.mp4,.mov"';
      if (!/type=["']file["']|type: ?'file'/.test(src)) continue;
      const acc = (/accept=\{?["'`]([^"'`]+)["'`]/.exec(src) || [])[1] || '';
      out.push({ slug: `${cat}/${t}`, tool: t, accept: acc });
    }
  }
  return out;
}

const extFor = (accept) => {
  const exts = accept.split(',').map((s) => s.trim()).filter((s) => s.startsWith('.'));
  if (exts.length) return exts[0].slice(1);
  if (/image\//.test(accept)) return 'png';
  if (/video\//.test(accept)) return 'mp4';
  if (/audio\//.test(accept)) return 'mp3';
  if (/pdf/.test(accept)) return 'pdf';
  return 'bin';
};
const kindOf = (accept, ext) => /pdf/.test(ext) ? 'pdf' : /^(png|jpe?g|webp|gif|bmp|tiff?|heic|heif|avif|svg|ico)$/.test(ext) || /^image\//.test(accept) ? 'image'
  : /^(mp4|mov|webm|mkv|avi|m4v)$/.test(ext) || /video\//.test(accept) ? 'video' : /^(mp3|wav|m4a|aac|flac|ogg|opus)$/.test(ext) || /audio\//.test(accept) ? 'audio' : 'other';

// ---- fixtures -----------------------------------------------------------------------------------------------------
const realPdf = await (async () => { const d = await PDFDocument.create(); d.addPage([200, 200]); return Buffer.from(await d.save()); })();
const realPng = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#4080c0' } }).png().toBuffer();
const lockedPdf = fs.readFileSync(path.join(ROOT, 'scripts', 'converter-tests', 'fixtures', 'encrypted-user-password.pdf'));
const giantPng = path.join(dir, 'giant.png');
const bombPng = path.join(dir, 'bomb.png');
if (cases.includes('bomb')) await sharp({ create: { width: 20000, height: 20000, channels: 3, background: '#fff' }, limitInputPixels: false }).greyscale().png({ compressionLevel: 9, palette: true, colours: 2 }).toFile(bombPng);
if (cases.includes('giant')) await sharp({ create: { width: 30000, height: 30000, channels: 3, background: '#000' }, limitInputPixels: false }).greyscale().png({ compressionLevel: 9 }).toFile(giantPng);
const silentMp4 = (() => { // a real MP4 without sound, from the repo's fixtures if one exists
  const cand = [path.join(ROOT, 'docs', 'audit', 'fixtures-safari'), path.join(ROOT, 'scripts', 'audit', 'fixtures', 'files')];
  for (const d of cand) if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (/no-?audio|silent|noaudio/i.test(f) && /\.mp4$/i.test(f)) return path.join(d, f);
  return null;
})();
function fixture(c, t) {
  const ext = extFor(t.accept), kind = kindOf(t.accept, ext);
  const p = path.join(dir, `${c}-${t.tool}.${ext}`);
  if (c === 'empty') fs.writeFileSync(p, Buffer.alloc(0));
  else if (c === 'corrupt') { const b = Buffer.alloc(512); for (let i = 0; i < 512; i++) b[i] = (i * 2654435761 >>> 13) & 255; fs.writeFileSync(p, b); }
  else if (c === 'wrong') fs.writeFileSync(p, kind === 'pdf' ? realPng : realPdf);
  else if (c === 'locked') { if (kind !== 'pdf') return null; fs.writeFileSync(p, lockedPdf); }
  else if (c === 'giant') { if (kind !== 'image' || ext === 'svg') return null; fs.copyFileSync(giantPng, p); }
  else if (c === 'bomb') { if (kind !== 'image' || ext === 'svg') return null; fs.copyFileSync(bombPng, p); }
  else if (c === 'silent') { if (!(kind === 'video' && /audio|mp3|wav|sound|transcri/.test(t.tool)) || !silentMp4) return null; fs.copyFileSync(silentMp4, p); }
  return p;
}

// Good companions for the two-file tools
const GOOD = { pdf: path.join(dir, 'good.pdf'), png: path.join(dir, 'good.png'), mp3: path.join(ROOT, 'docs', 'audit', 'fixtures-safari', 'safari-tone-B-3s.mp3'), mp4: path.join(ROOT, 'scripts', 'audit', 'fixtures', 'files', 'sample.mp4') };
fs.writeFileSync(GOOD.pdf, realPdf); fs.writeFileSync(GOOD.png, realPng);
const MESSAGE = /could ?n[o']t|can ?n[o']t|can't|cannot|unable|failed|invalid|damaged|corrupt|empty|0 bytes|not an? (valid )?|isn'?t a|unsupported|not supported|doesn'?t|does not|no (audio|sound|pages?|pictures?|image)|too (large|big)|larger than|no [\w ]{0,30} found|over the|limit|megapixel|password|protected|encrypted|error|unreadable|unrecognized|wrong|different format|only accepts|please (choose|select|use)|doesn't take|this tool (takes|needs|works)|not available/i;
const BUSY = /…|\.\.\.|ing\b/;
// P23: a raw JavaScript / browser error shown as is is not a sentence for a visitor (Video Merger under Firefox showed
// 'can't access property "find", e.streams is undefined'; Image Cropper 'Passed-in image is "broken"').
const RAW_ERROR = /can't access property|is undefined\b|is not a function|Cannot read propert|null is not an object|undefined is not an object|is not defined\b|Passed-in image|NS_ERROR|InvalidStateError|DataCloneError|Failed to execute|Unexpected token|out of bounds of the DataView/i;

// P23 (02/10): a browser with enough memory (Firefox) really turns the 900 MP picture into a PDF. Counted right only
// when the PDF opens, holds the whole 30 000 × 30 000 image, on a page of at most 14 400 points (Acrobat's limit).
async function giantPdfIsReal(p, side = 30000) {
  try {
    const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
      const u = new Uint8Array(await (await fetch(a.href)).arrayBuffer()); if (u[0] !== 0x25 || u[1] !== 0x50) return null;
      let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
    });
    if (!b64) return false;
    const { PDFName, PDFRawStream } = await import('pdf-lib');
    const d = await PDFDocument.load(Buffer.from(b64, 'base64'));
    const { width, height } = d.getPage(0).getSize();
    let full = false;
    d.context.enumerateIndirectObjects().forEach(([, o]) => { if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image') && String(o.dict.get(PDFName.of('Width'))) === String(side) && String(o.dict.get(PDFName.of('Height'))) === String(side)) full = true; });
    return full && Math.max(width, height) <= 14400;
  } catch { return false; }
}
// P23: a picture made from the white 400 MP bomb (a crop, an icon, a resized copy, a GIF frame) is a real result when
// it opens and its centre is white and opaque; a canvas that failed to decode gives transparent or black pixels.
async function bombImageIsReal(p) {
  try {
    const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
      const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
      const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await fetch(a.href);
      const u = new Uint8Array(await res.arrayBuffer()); if (u.length > 64e6) return null;
      let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
    });
    if (!b64) return false;
    let buf = Buffer.from(b64, 'base64');
    if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) { // ICO: its largest entry, PNG or BMP
      const n = buf.readUInt16LE(4); let best = null;
      for (let i = 0; i < n; i++) { const e = 6 + i * 16, w = buf[e] || 256, size = buf.readUInt32LE(e + 8), off = buf.readUInt32LE(e + 12); if (!best || w > best.w) best = { w, size, off }; }
      buf = buf.subarray(best.off, best.off + best.size);
      if (buf[0] !== 0x89) return false; // only PNG entries are checked here
    }
    const img = sharp(buf, { limitInputPixels: false });
    const m = await img.metadata();
    const px = await sharp(buf, { limitInputPixels: false }).ensureAlpha().extract({ left: Math.floor(m.width / 2), top: Math.floor(m.height / 2), width: 1, height: 1 }).raw().toBuffer();
    return px[0] > 200 && px[1] > 200 && px[2] > 200 && px[3] > 200;
  } catch { return false; }
}
// P23: on a preview, with another bench running, the whole test browser died twice (memory: giant / bomb cases four
// at a time). The bench then stopped and measured nothing more. Now: the cases in flight when it died are logged, the
// browser is relaunched, and those cases are played again one at a time at the end (their second verdict counts).
let b = null;
const inflight = new Set();
let relaunching = null;
async function launch() {
  const br = await engine.launch();
  br.on('disconnected', () => { if (inflight.size) console.log(`BROWSER-DIED (${name}) with in flight: ${[...inflight].join(', ')}`); });
  return br;
}
async function liveBrowser() {
  if (b && b.isConnected()) return b;
  relaunching ??= launch().then((br) => { b = br; relaunching = null; return br; });
  return relaunching;
}
b = await launch();
const retry = [];
const rows = [];
let fails = 0, passes = 0;
const tools = inventory().filter((t) => !only.length || only.includes(t.tool));
console.log(`${tools.length} tools with a file input`);
const jobs = [];
for (const t of tools) for (const c of cases) { const file = fixture(c, t); if (file) jobs.push({ t, c, file }); }
async function runCase({ t, c, file }, final = false) {
  const key = `${t.tool} [${c}]`;
  inflight.add(key);
  try {
    const ctx = await (await liveBrowser()).newContext({ acceptDownloads: true });
    if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
    // NO PAID CALL, EVER: every /api/ route and the media service are played here. A page that sends the bad file to
    // the server gets the refusal our routes give ("422, this file could not be read") and must show it.
    // --real-media (preview only): OUR media service is reached for real (ticket route + service host), to see its
    // own refusal of a bad video reach the page; every other route stays played (paid providers never reached).
    const realMedia = process.argv.includes('--real-media');
    await ctx.route('**/api/**', (r) => (r.request().url().includes('/api/report-error')
      ? r.fulfill({ status: 204, body: '' })
      : realMedia && r.request().url().includes('/api/media/') ? r.continue()
      : r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'This file could not be read. It may be damaged or not the right type.' }) })));
    const host = new URL(origin).host;
    await ctx.route((u) => u.host !== host, (r) => (['POST', 'PUT', 'PATCH'].includes(r.request().method()) && !realMedia ? r.abort() : r.continue())); // the page itself never posts to a paid provider (those calls are server-side, played above)
    const p = await ctx.newPage();
    const errors = []; p.on('pageerror', (e) => { if (!/navigator\.storage\.persisted/.test(e.message)) errors.push(e.message.slice(0, 200)); }); // the Vercel preview toolbar under WebKit (absent on www), see all-pages-load.mjs
    let verdict = '', detail = '';
    try {
      await p.goto(`${origin}/tools/${t.slug}`, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(800);
      const before = (await p.locator('main').first().innerText().catch(() => '')).length;
      // Tools that need two files (merge, compare): the bad file plus a good one of the same kind.
      const needsTwo = /merg|compar|join|combin|duplicat|gif-maker/.test(t.tool);
      const good = { pdf: GOOD.pdf, image: GOOD.png, audio: GOOD.mp3, video: GOOD.mp4, other: GOOD.pdf }[kindOf(t.accept, extFor(t.accept))];
      // A tool with modes (Audio to Text: microphone / file; Hash Generator: text / file) shows its file field once
      // the file mode is chosen.
      // Barcode Generator takes a file (CSV import) in its "Many" mode only (P23).
      const fileMode = p.locator('main').getByRole('button', { name: /upload .*file|^file$/i }).or(p.locator('main').getByRole('radio', { name: /file|^many/i })).first();
      if (await fileMode.count()) await fileMode.click({ timeout: 5000 }).catch(() => {});
      const inputs = p.locator('main input[type=file]');
      if ((await inputs.count()) >= 2 && good) { // two separate fields (File Comparator): the bad file and a good one
        await inputs.nth(0).setInputFiles(file, { timeout: 10000 });
        await inputs.nth(1).setInputFiles(good, { timeout: 10000 });
      } else await p.locator('input[type=file]').first().setInputFiles(needsTwo && good ? [file, good] : file, { timeout: 10000 });
      const pw = p.locator('main input[type=password]');
      if (await pw.count()) for (let i = 0; i < await pw.count(); i++) await pw.nth(i).fill('robustness-Test-123').catch(() => {});
      await p.waitForTimeout(1500);
      const msgNow = async () => {
        const texts = await p.locator('[role=alert], [role=status], .text-red-400, .text-red-500, .text-red-600, .text-red-700, .text-amber-700, .text-amber-800, .text-amber-900, .text-yellow-400, [class*="bg-red"], [class*="bg-amber"]').allInnerTexts().catch(() => []);
        return texts.map((x) => String(x || '').trim()).filter((x) => x && MESSAGE.test(x)).join(' | ');
      };
      let msg = await msgNow();
      if (!msg && !(await p.locator('[data-file-download]').count())) {
        // the tool's main action
        const btns = p.locator('main button:visible');
        const n = await btns.count();
        // the tool's main action: among the matching, enabled buttons, the widest (the primary, full-width one) —
        // not a mode tab such as "Encrypt" / "Decrypt"
        let best = null, bestW = -1, bestTxt = '';
        for (let i = 0; i < n; i++) {
          const btn = btns.nth(i);
          const txt = ((await btn.innerText().catch(() => '')) || '').trim();
          if (!txt || /^(✕|×|↑|↓|cancel|clear|reset|remove all|choose|browse|select|add (more|files?|images?|pdfs?|photos?|videos?)b|copy|paste|swap|menu|search|light|dark|language|log ?in|sign|subscribe|use microphone|record|scan with camera|camera)/i.test(txt) || /^[A-Z]{2}$/.test(txt)) continue;
          if (!/^add|noise|border|vignette|sepia|grayscale|greyscale|invert|pixelat|bright|contrast|saturat|round|meme|collage|mirror|tint|convert|compress|merge|split|remove|extract|process|start|create|generate|resize|rotate|crop|apply|trim|encrypt|decrypt|unlock|protect|repair|scan|analy|run|make|translate|summar|transcribe|check|detect|compare|join|cut|boost|change|clean|optimi|fix|read|caption|upscale|enhance|blur|sharpen|flip|watermark|number|delete|organi|redact|ocr|edit|play|filter|mute|reverse|speed|loop|equaliz|normaliz|amplif|reduce|shrink|turn|export|save|unzip|open|view|decode|encode|hash|calculat|count|parse|format|validat|beautif|minif|go|submit|upload/i.test(txt)) continue;
          if (await btn.isDisabled().catch(() => true)) continue;
          const w = (await btn.boundingBox().catch(() => null))?.width || 0;
          if (w > bestW) { best = btn; bestW = w; bestTxt = txt; }
        }
        if (best) { await best.click({ timeout: 5000 }).catch(() => {}); detail = `clicked "${bestTxt.slice(0, 40)}"`; }
      }
      const t0 = Date.now();
      let results = 0;
      while (Date.now() - t0 < 45000) {
        msg = await msgNow();
        results = await p.locator('[data-file-download]').count();
        if (msg || results || errors.length) break;
        await p.waitForTimeout(1000);
      }
      const bodyLen = (await p.locator('main').first().innerText().catch(() => '')).length;
      const busyBtn = (await p.locator('button:visible').allInnerTexts().catch(() => [])).find((x) => /…|\.\.\.$/.test(x.trim()) && /ing/i.test(x));
      if (errors.length) verdict = 'CRASH';
      else if (bodyLen < Math.min(200, before / 3)) verdict = 'BLANK';
      // an archive may hold an empty file (Zip Creator): its result is right even for an empty one
      // an archive may hold an empty file (Zip Creator), and an empty file has a well-known hash (Hash Generator)
      else if (results && c === 'giant' && await giantPdfIsReal(p, 30000)) verdict = 'OK-RESULT';
      // P24: removing metadata never decodes the pixels: a copy of a giant picture without its text chunks is right
      else if (results && (c === 'giant' || c === 'bomb') && t.tool === 'image-metadata') verdict = 'OK-RESULT';
      else if (results && c === 'bomb' && (await giantPdfIsReal(p, 20000) || await bombImageIsReal(p))) verdict = 'OK-RESULT'; // P23: opened and checked, see below
      else if (results && !(ANY_BYTES.has(t.tool) && (c !== 'empty' || t.tool === 'zip-creator' || t.tool === 'hash-generator'))) verdict = 'FAKE-RESULT';
      else if (results) verdict = 'OK-RESULT';
      else if (msg && RAW_ERROR.test(msg)) verdict = 'RAW-ERROR';
      else if (msg) verdict = 'OK-MESSAGE';
      else if (INFO_TOOLS.has(t.tool) && /0 B|bytes|different|identical|Real format|Type|No embedded metadata|cannot display/i.test(await p.locator('main').innerText().catch(() => ''))) verdict = 'OK-REPORT';
      else if (busyBtn) verdict = 'STUCK';
      else verdict = 'SILENT';
      detail += ` ${msg.slice(0, 160)}${busyBtn ? ` busy:"${busyBtn}"` : ''}${errors.length ? ' err:' + errors[0] : ''}`;
    } catch (e) { verdict = /has been closed|Target closed|disconnected|browser has crashed/i.test(String(e)) ? 'BROWSER-DIED' : 'BENCH-ERROR'; detail = String((e && e.stack) || e).slice(0, 400); }
    if (verdict === 'BROWSER-DIED' && !final) { retry.push({ t, c, file }); await ctx.close().catch(() => {}); return; }
    const ok = verdict.startsWith('OK');
    if (ok) passes++; else fails++;
    rows.push({ tool: t.slug, case: c, verdict, detail: detail.trim() });
    console.log(ok ? 'PASS' : 'FAIL', `${name} ${t.slug} [${c}] ${verdict}${final ? ' (played again alone)' : ''}`, ok ? '' : detail.trim());
    await ctx.close().catch(() => {});
  } catch (e) {
    if (!final) { retry.push({ t, c, file }); return; }
    fails++; rows.push({ tool: t.slug, case: c, verdict: 'BROWSER-DIED', detail: String(e).slice(0, 200) });
    console.log('FAIL', `${name} ${t.slug} [${c}] BROWSER-DIED (played again alone)`, String(e).slice(0, 200));
  } finally { inflight.delete(key); }
}
// 4 pages at a time
const POOL = Number(arg('pool') || 4);
let next = 0;
await Promise.all(Array.from({ length: POOL }, async () => { while (next < jobs.length) await runCase(jobs[next++]); }));
if (retry.length) console.log(`${retry.length} case(s) interrupted by the browser's death: played again one at a time`);
for (const j of retry) await runCase(j, true);
await (await liveBrowser()).close();
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(rows, null, 1));
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
