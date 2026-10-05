// P33 point 4 (05/10): JPG to PDF / Image to PDF on a simulated iPhone (phone UA, iOS canvas cap): a picture that is
// not a JPEG over the phone bound (48 MP) is named at selection with the same amber message and the same one-gesture
// button as Image Compressor, "Reduce to 48 MP then convert to PDF"; the PDF then holds the reduced picture (page
// 12220 × 3927 for the owner's 14000 × 4500 panorama, "Fit to each picture"). Peak of the tab's process read from
// Windows BEFORE the PDF is read back (scripts/p32/pdf-peak-memory.mjs method; P32 reference: the 48 MP photo through
// Image Compressor, 961 MB Firefox / 1,389 MB Chromium working set). The owner's 48 MP photo as WebP must pass with no word.
//   node scripts/p33/pdf-reduce.mjs <origin> [--browser=chromium|firefox] [--tools=jpg-to-pdf,image-to-pdf] [--only=webp,png,alpha,avif,photo48]
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { iosCanvasCapInit } from '../browser-tests/lib/ios-canvas-cap.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = process.argv.includes('--browser=firefox') ? 'firefox' : 'chromium';
const slugs = (process.argv.find((a) => a.startsWith('--tools='))?.slice(8) || 'jpg-to-pdf,image-to-pdf').split(',');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const kit = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const PANO = path.join(kit, 'kit-iphone-p27', 'panorama-63mpx.jpg'), PHOTO48 = path.join(kit, 'kit-iphone-p19', 'photo-48mpx.jpg');
const cache = path.join(os.tmpdir(), 'p33-reduce');
fs.mkdirSync(cache, { recursive: true });
sharp.cache(false);
const make = async (name, fn) => { const f = path.join(cache, name); if (!fs.existsSync(f)) await fn(f); return f; };
const cases = [
  { key: 'webp', file: await make('panorama-63mpx.webp', (f) => sharp(PANO).webp({ quality: 90 }).toFile(f)), over: true, kind: 'jpg' },
  { key: 'png', file: await make('panorama-63mpx.png', (f) => sharp(PANO).png({ compressionLevel: 6 }).toFile(f)), over: true, kind: 'png' }, // a PNG stays PNG (lossless)
  // transparency: the reduced picture stays PNG (with its alpha) in the PDF
  { key: 'alpha', file: await make('panorama-63mpx-alpha.png', (f) => sharp(PANO).ensureAlpha(0.6).png({ compressionLevel: 6 }).toFile(f)), over: true, kind: 'png', alpha: true },
  // AVIF (as HEIC on an iPhone: an ISO-BMFF picture whose size is read from its 'ispe' box)
  { key: 'avif', file: await make('panorama-63mpx.avif', (f) => sharp(PANO).avif({ quality: 60, effort: 0 }).toFile(f)), over: true, kind: 'jpg' },
  { key: 'photo48', file: await make('photo-48mpx.webp', (f) => sharp(PHOTO48).webp({ quality: 90 }).toFile(f)), over: false, kind: 'jpg' },
].filter((c) => !only || only.includes(c.key));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

function peaks(marker) {
  const ps = `$all = Get-CimInstance Win32_Process; $ids = @($all | Where-Object { $_.CommandLine -like '*${marker}*' } | ForEach-Object { $_.ProcessId }); do { $n = $ids.Count; $ids = @($ids + @($all | Where-Object { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) } | ForEach-Object { $_.ProcessId })) } while ($ids.Count -gt $n); $all | Where-Object { $ids -contains $_.ProcessId -and ($_.CommandLine -match '--type=renderer' -or $_.CommandLine -match '-contentproc.*\\stab\\s*$') } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { "$([math]::Round($p.PeakWorkingSet64/1MB)) $([math]::Round($p.PeakPagedMemorySize64/1MB))" } }`;
  const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  let ws = 0, priv = 0;
  for (const l of out.split(/\r?\n/).filter(Boolean)) { const [a, b] = l.trim().split(/\s+/).map(Number); ws = Math.max(ws, a); priv = Math.max(priv, b); }
  return { ws, priv };
}

let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${engine} [iphone] ${n}`, ok ? '' : info); };
for (const slug of slugs) {
  for (const c of cases) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p33red-'));
    const ctx = engine === 'firefox'
      ? await firefox.launchPersistentContext(dir, { userAgent: UA, hasTouch: true, acceptDownloads: true })
      : await chromium.launchPersistentContext(dir, { userAgent: UA, isMobile: true, hasTouch: true, acceptDownloads: true });
    await ctx.addInitScript(iosCanvasCapInit);
    await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
    const p = ctx.pages()[0] || await ctx.newPage();
    await p.goto(`${origin}/tools/pdf-tools/${slug}`, { waitUntil: 'load' });
    await p.waitForTimeout(800);
    const meta = await sharp(c.file).metadata();
    const name = `${slug} ${path.basename(c.file)} (${meta.width} × ${meta.height})`;
    await p.locator('input[type=file]').first().setInputFiles(c.file);
    const box = p.locator('[data-size-preflight]');
    await box.waitFor({ timeout: 5000 }).catch(() => {});
    const text = (await box.count()) ? await box.innerText() : '';
    const t0 = Date.now();
    if (c.over) {
      check(`${name}: named at selection, limit 48 MP, reducible to 12,220 × 3,927, "Reduce to 48 MP then convert to PDF"`,
        /14,000 × 4,500 pixels \(63 megapixels\): on a phone the limit is 48 megapixels/.test(text) && /reduced to 12,220 × 3,927 \(48 MP, the size of a 48 MP phone photo\) first/.test(text)
        && (await p.locator('[data-reduce-then-convert]').innerText().catch(() => '')) === 'Reduce to 48 MP then convert to PDF', text);
      await p.locator('[data-reduce-then-convert]').click();
    } else {
      check(`${name}: under the bound, no message`, text === '', text);
      await p.getByRole('button', { name: /^Convert to PDF/ }).first().click();
    }
    const r = await Promise.race([
      p.locator('[data-file-download] a[data-download]').first().waitFor({ timeout: 600000 }).then(() => 'done'),
      p.locator('.text-red-600, [role=alert]:not([data-size-preflight])').filter({ hasText: /\w/ }).first().waitFor({ timeout: 600000 }).then(() => 'message'),
    ]).catch(() => 'timeout');
    const ms = Date.now() - t0;
    await p.waitForTimeout(1000);
    const pk = peaks(path.basename(dir));
    if (r !== 'done') {
      check(`${name}: PDF made`, false, `${r} ${await p.locator('.text-red-600, [role=alert]').allInnerTexts().catch(() => '')}`);
    } else {
      const note = (await p.locator('[data-reduced-note]').allInnerTexts()).join(' | ');
      const a = p.locator('[data-file-download] a[data-download]').first();
      const bytes = Buffer.from(await a.evaluate(async (el) => { for (let i = 0; i < 50 && el.dataset.retyped !== '1'; i++) await new Promise((res) => setTimeout(res, 100)); return Array.from(new Uint8Array(await (await fetch(el.href)).arrayBuffer())); }));
      const doc = await PDFDocument.load(bytes);
      const { width, height } = doc.getPage(0).getSize();
      const imgs = [];
      for (const [, obj] of doc.context.enumerateIndirectObjects()) {
        // the picture itself (its alpha, when there is one, is a separate DeviceGray image named by /SMask)
        if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image') && obj.dict.get(PDFName.of('ColorSpace'))?.toString() !== '/DeviceGray') {
          imgs.push({ w: obj.dict.get(PDFName.of('Width'))?.toString(), h: obj.dict.get(PDFName.of('Height'))?.toString(), f: obj.dict.get(PDFName.of('Filter'))?.toString(), smask: !!obj.dict.get(PDFName.of('SMask')) });
        }
      }
      const main = imgs.find((i) => !imgs.some((j) => j !== i && Number(j.w) * Number(j.h) > Number(i.w) * Number(i.h))) || {};
      const want = c.over ? { w: 12220, h: 3927 } : { w: meta.width, h: meta.height };
      const wantFilter = c.kind === 'png' ? '/FlateDecode' : '/DCTDecode';
      check(`${name}: PDF ${(bytes.length / 1e6).toFixed(1)} MB in ${ms} ms, page ${Math.round(width)} × ${Math.round(height)}, image ${main.w} × ${main.h} ${main.f}${main.smask ? ' + alpha' : ''}${c.over ? `, note "${note}"` : ''} | tab peak working set ${pk.ws} MB, peak private ${pk.priv} MB`,
        doc.getPageCount() === 1 && Math.round(width) === want.w && Math.round(height) === want.h && Number(main.w) === want.w && Number(main.h) === want.h && main.f === wantFilter
        && !!c.alpha === main.smask && (!c.over || note.includes(`reduced from 14,000 × 4,500 to 12,220 × 3,927 pixels`)), JSON.stringify(imgs));
    }
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
console.log(fails ? `${fails} FAIL, ${passes} pass (${engine})` : `ALL PASS: ${passes} checks (${engine})`);
process.exit(fails ? 1 : 0);
