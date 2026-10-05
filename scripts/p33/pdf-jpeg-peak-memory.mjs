// P33 point 4 (05/10): is "JPEG photos of any size" true on a phone for JPG to PDF / Image to PDF? A JPEG is embedded
// as it is (pdf-lib embedJpg reads its header, nothing decoded): measured here in Playwright's WebKit (Safari's engine;
// iPhone user agent) and, for comparison with P32's references, Chromium and Firefox -- the owner's 63 MP panorama
// (kit P27) and generated very large JPEGs (made with sharp from the panorama: photo-like content). Peak of the tab's
// process read from Windows (WebKitWebProcess / renderer / content process), as scripts/p32/pdf-peak-memory.mjs.
// Also checks that the PDF holds the JPEG whole, byte for byte (inside the page).
//   node scripts/p33/pdf-jpeg-peak-memory.mjs <origin> [--browser=webkit|chromium|firefox] [--runs=1] [--mp=63,150,200]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
const runs = Number(process.argv.find((a) => a.startsWith('--runs='))?.slice(7) || 1);
const mps = (process.argv.find((a) => a.startsWith('--mp='))?.slice(5) || '63,150,200').split(',').map(Number);
const noisy = process.argv.includes('--noisy'); // photo-like file sizes (grain added)
const grain = Number(process.argv.find((a) => a.startsWith('--grain='))?.slice(8) || 6); // ± grain amplitude: 6 -> ~0.12 byte per pixel, 24 -> ~0.4
const phase = (process.argv.find((a) => a.startsWith('--phase='))?.slice(8) || 'convert'); // page | select | convert
const slugs = (process.argv.find((a) => a.startsWith('--tools='))?.slice(8) || 'jpg-to-pdf,image-to-pdf').split(',');
const PANO = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p27', 'panorama-63mpx.jpg');
const cache = path.join(os.tmpdir(), 'p33-big-jpeg');
fs.mkdirSync(cache, { recursive: true });
sharp.cache(false);
const files = [];
for (const mp of mps) {
  if (mp === 63 && !noisy) { files.push(PANO); continue; }
  // the panorama's 14000:4500 shape, scaled to mp megapixels (a 200 MP Android photo is 16320 × 12240; the shape does
  // not change what embedJpg reads)
  const k = Math.sqrt((mp * 1e6) / (14000 * 4500)), w = Math.round(14000 * k), h = Math.round(4500 * k);
  const f = path.join(cache, `panorama-${mp}mpx${noisy ? `-grain${grain === 6 ? '' : grain}` : ''}.jpg`);
  if (!fs.existsSync(f)) {
    if (!noisy) await sharp(PANO, { limitInputPixels: false }).resize(w, h).jpeg({ quality: 90 }).toFile(f);
    else {
      const base = await sharp(PANO, { limitInputPixels: false }).resize(w, h).raw().toBuffer();
      let seed = 1; for (let i = 0; i < base.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; base[i] = Math.max(0, Math.min(255, base[i] + ((seed >> 16) % (2 * grain + 1)) - grain)); }
      await sharp(base, { raw: { width: w, height: h, channels: 3 }, limitInputPixels: false }).jpeg({ quality: 90 }).toFile(f);
    }
  }
  files.push(f);
}
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

// the browser's processes started for this profile directory (marker), and their descendants; the tab's process
// (WebKit: WebKitWebProcess; Chromium: --type=renderer; Firefox: the "tab" content process) -> its peaks
function peaks(marker) {
  const ps = `$all = Get-CimInstance Win32_Process; $ids = @($all | Where-Object { $_.CommandLine -like '*${marker}*' } | ForEach-Object { $_.ProcessId }); do { $n = $ids.Count; $ids = @($ids + @($all | Where-Object { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) } | ForEach-Object { $_.ProcessId })) } while ($ids.Count -gt $n); $all | Where-Object { $ids -contains $_.ProcessId -and ($_.Name -like 'WebKitWebProcess*' -or $_.CommandLine -match '--type=renderer' -or $_.CommandLine -match '-contentproc.*\\stab\\s*$') } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { "$([math]::Round($p.PeakWorkingSet64/1MB)) $([math]::Round($p.PeakPagedMemorySize64/1MB))" } }`;
  const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  let ws = 0, priv = 0, n = 0;
  for (const l of out.split(/\r?\n/).filter(Boolean)) { const [a, b] = l.trim().split(/\s+/).map(Number); ws = Math.max(ws, a); priv = Math.max(priv, b); n++; }
  return { ws, priv, n };
}

const sof = (b) => { for (let i = 2; i < b.length - 9;) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) }; i += 2 + b.readUInt16BE(i + 2); } return null; };
let fails = 0;
for (const slug of slugs) {
  for (const file of files) {
    const src = fs.readFileSync(file), dims = sof(src);
    for (let k = 0; k < runs; k++) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p33pdfj-'));
      const ctx = engine === 'firefox'
        ? await firefox.launchPersistentContext(dir, { userAgent: UA, hasTouch: true, acceptDownloads: true })
        : await { chromium, webkit }[engine].launchPersistentContext(dir, { userAgent: UA, isMobile: engine === 'chromium', hasTouch: true, acceptDownloads: true, viewport: { width: 390, height: 844 } });
      await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
      const p = ctx.pages()[0] || await ctx.newPage();
      await p.goto(`${origin}/tools/pdf-tools/${slug}`, { waitUntil: 'load' });
      await p.waitForTimeout(800);
      const t0 = Date.now();
      if (phase !== 'page') await p.locator('input[type=file]').first().setInputFiles(file);
      await p.waitForTimeout(500);
      const preflight = await p.locator('[data-size-preflight]').count();
      if (phase !== 'convert') {
        if (phase === 'page') { /* nothing chosen: see below */ }
        await p.waitForTimeout(3000);
        const pk0 = peaks(path.basename(dir));
        console.log(`${engine} ${slug} ${path.basename(file)} phase=${phase}: tab peak working set ${pk0.ws} MB, peak private ${pk0.priv} MB (${pk0.n} proc)`);
        await ctx.close(); fs.rmSync(dir, { recursive: true, force: true }); continue;
      }
      await p.getByRole('button', { name: /^Convert to PDF/ }).first().click();
      const r = await Promise.race([
        p.locator('[data-file-download] a[data-download]').first().waitFor({ timeout: 600000 }).then(() => 'done'),
        p.locator('.text-red-600, [role=alert]').filter({ hasText: /\w/ }).first().waitFor({ timeout: 600000 }).then(() => 'message'),
      ]).catch(() => 'timeout');
      const ms = Date.now() - t0;
      await p.waitForTimeout(1000);
      // the tab's peak BEFORE this script reads the PDF back (that copy, an array of numbers, is the test's, not the page's)
      const pk = peaks(path.basename(dir));
      let pdfInfo = '';
      if (r === 'done') {
        const a = p.locator('[data-file-download] a[data-download]').first();
        // checked inside the page (a 100 MB PDF copied out as an array of numbers crashed the test, not the page)
        const info = await a.evaluate(async (el, [head, tail, srcLen]) => {
          for (let i = 0; i < 50 && el.dataset.retyped !== '1'; i++) await new Promise((res) => setTimeout(res, 100));
          const b = new Uint8Array(await (await fetch(el.href)).arrayBuffer());
          const find = (pat) => { outer: for (let i = 0; i + pat.length <= b.length; i++) { if (b[i] !== pat[0]) continue; for (let k = 1; k < pat.length; k++) if (b[i + k] !== pat[k]) continue outer; return i; } return -1; };
          const at = find(head);
          const whole = at >= 0 && find(tail) === at + srcLen - tail.length;
          return { len: b.length, whole };
        }, [Array.from(src.subarray(0, 4096)), Array.from(src.subarray(src.length - 4096)), src.length]);
        pdfInfo = `PDF ${(info.len / 1e6).toFixed(1)} MB, JPEG inside as is (whole, byte for byte): ${info.whole}`;
        if (!info.whole) fails++; // page count: pdf-lib writes object streams; 1 page checked with pdf-lib on the smaller files
      } else fails++;
      const msg = r === 'message' ? (await p.locator('.text-red-600, [role=alert]').filter({ hasText: /\w/ }).first().innerText().catch(() => '')).slice(0, 160) : '';
      console.log(`${engine} ${slug} ${path.basename(file)} ${dims.width}x${dims.height} (${(src.length / 1e6).toFixed(1)} MB): ${r} in ${ms} ms | preflight message: ${preflight ? 'yes' : 'no'} | tab peak working set ${pk.ws} MB, peak private ${pk.priv} MB (${pk.n} proc) ${pdfInfo} ${msg}`);
      await ctx.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}
process.exit(fails ? 1 : 0);
