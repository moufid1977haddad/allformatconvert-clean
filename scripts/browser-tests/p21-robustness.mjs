// P21 phase 5 (02/10) — robustness of EVERY tool that takes a file. For each tool page with a file input, each bad
// input is given as a visitor would (file picker, then the tool's main button if it does not start by itself):
//   empty      a 0-byte file with the tool's own extension
//   corrupt    512 random bytes with the tool's own extension
//   wrong      a real file of another kind under the tool's extension (a PDF named .png, a PNG named .pdf/.mp4/.mp3…)
//   locked     a password-protected PDF (PDF tools)
//   giant      a real 30 000 × 30 000 PNG (900 megapixels, 1.8 MB on disk) (image tools)
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
const cases = (arg('cases') || 'empty,corrupt,wrong,locked,giant,silent').split(',');
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
  else if (c === 'silent') { if (!(kind === 'video' && /audio|mp3|wav|sound|transcri/.test(t.tool)) || !silentMp4) return null; fs.copyFileSync(silentMp4, p); }
  return p;
}

// Good companions for the two-file tools
const GOOD = { pdf: path.join(dir, 'good.pdf'), png: path.join(dir, 'good.png'), mp3: path.join(ROOT, 'docs', 'audit', 'fixtures-safari', 'safari-tone-B-3s.mp3'), mp4: path.join(ROOT, 'scripts', 'audit', 'fixtures', 'files', 'sample.mp4') };
fs.writeFileSync(GOOD.pdf, realPdf); fs.writeFileSync(GOOD.png, realPng);
const MESSAGE = /could ?n[o']t|can ?n[o']t|cannot|unable|failed|invalid|damaged|corrupt|empty|0 bytes|not an? (valid )?|isn'?t a|unsupported|not supported|doesn'?t|does not|no (audio|sound|pages?|pictures?|image)|too (large|big)|over the|limit|megapixel|password|protected|encrypted|error|unreadable|unrecognized|wrong|different format|only accepts|please (choose|select|use)|doesn't take|this tool (takes|needs|works)|not available/i;
const BUSY = /…|\.\.\.|ing\b/;

const b = await engine.launch();
const rows = [];
let fails = 0, passes = 0;
const tools = inventory().filter((t) => !only.length || only.includes(t.tool));
console.log(`${tools.length} tools with a file input`);
const jobs = [];
for (const t of tools) for (const c of cases) { const file = fixture(c, t); if (file) jobs.push({ t, c, file }); }
async function runCase({ t, c, file }) {
  {
    const ctx = await b.newContext({ acceptDownloads: true });
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
    const errors = []; p.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
    let verdict = '', detail = '';
    try {
      await p.goto(`${origin}/tools/${t.slug}`, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(800);
      const before = (await p.locator('main').first().innerText().catch(() => '')).length;
      // Tools that need two files (merge, compare): the bad file plus a good one of the same kind.
      const needsTwo = /merg|compar|join|combin|duplicat/.test(t.tool);
      const good = { pdf: GOOD.pdf, image: GOOD.png, audio: GOOD.mp3, video: GOOD.mp4, other: GOOD.pdf }[kindOf(t.accept, extFor(t.accept))];
      // A tool with modes (Audio to Text: microphone / file; Hash Generator: text / file) shows its file field once
      // the file mode is chosen.
      const fileMode = p.locator('main').getByRole('button', { name: /upload .*file|^file$/i }).or(p.locator('main').getByRole('radio', { name: /file/i })).first();
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
          if (!txt || /^(✕|×|↑|↓|cancel|clear|reset|remove all|choose|browse|select|add (more|files?|images?|pdfs?|photos?|videos?)b|copy|paste|swap|menu|search|light|dark|language|log ?in|sign|subscribe|use microphone|record)/i.test(txt) || /^[A-Z]{2}$/.test(txt)) continue;
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
      else if (results && !(ANY_BYTES.has(t.tool) && (c !== 'empty' || t.tool === 'zip-creator' || t.tool === 'hash-generator'))) verdict = 'FAKE-RESULT';
      else if (results) verdict = 'OK-RESULT';
      else if (msg) verdict = 'OK-MESSAGE';
      else if (INFO_TOOLS.has(t.tool) && /0 B|bytes|different|identical|Real format|Type|No embedded metadata|cannot display/i.test(await p.locator('main').innerText().catch(() => ''))) verdict = 'OK-REPORT';
      else if (busyBtn) verdict = 'STUCK';
      else verdict = 'SILENT';
      detail += ` ${msg.slice(0, 160)}${busyBtn ? ` busy:"${busyBtn}"` : ''}${errors.length ? ' err:' + errors[0] : ''}`;
    } catch (e) { verdict = 'BENCH-ERROR'; detail = String((e && e.stack) || e).slice(0, 400); }
    const ok = verdict.startsWith('OK');
    if (ok) passes++; else fails++;
    rows.push({ tool: t.slug, case: c, verdict, detail: detail.trim() });
    console.log(ok ? 'PASS' : 'FAIL', `${name} ${t.slug} [${c}] ${verdict}`, ok ? '' : detail.trim());
    await ctx.close();
  }
}
// 4 pages at a time
const POOL = Number(arg('pool') || 4);
let next = 0;
await Promise.all(Array.from({ length: POOL }, async () => { while (next < jobs.length) await runCase(jobs[next++]); }));
await b.close();
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(rows, null, 1));
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
