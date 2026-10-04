// P32 point 2c (04/10): JPG to PDF and Image to PDF with the owner's 63 MP panorama, on a simulated iPhone (phone UA,
// iOS canvas cap), peak of the tab's process read from Windows -- to compare with Image Compressor's 48 MP path
// (scripts/p32/compressor-peak-memory.mjs). The panorama as JPEG (the kit file: embedded as it is, never decoded) and
// the same pixels as WebP and PNG (decoded on the page: the paths a non-JPEG panorama takes; made here with sharp).
//   node scripts/p32/pdf-peak-memory.mjs <origin> [--browser=chromium|firefox] [--runs=1]
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { iosCanvasCapInit } from '../browser-tests/lib/ios-canvas-cap.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = process.argv.includes('--browser=firefox') ? 'firefox' : 'chromium';
const runs = Number(process.argv.find((a) => a.startsWith('--runs='))?.slice(7) || 1);
const PANO = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p27', 'panorama-63mpx.jpg');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p32pdf-'));
const WEBP = path.join(tmp, 'panorama-63mpx.webp'), PNG = path.join(tmp, 'panorama-63mpx.png');
sharp.cache(false);
await sharp(PANO).webp({ quality: 90 }).toFile(WEBP);
await sharp(PANO).png({ compressionLevel: 6 }).toFile(PNG);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

function peaks(marker) {
  const ps = `$all = Get-CimInstance Win32_Process; $ids = @($all | Where-Object { $_.CommandLine -like '*${marker}*' } | ForEach-Object { $_.ProcessId }); do { $n = $ids.Count; $ids = @($ids + @($all | Where-Object { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) } | ForEach-Object { $_.ProcessId })) } while ($ids.Count -gt $n); $all | Where-Object { $ids -contains $_.ProcessId -and ($_.CommandLine -match '--type=renderer' -or $_.CommandLine -match '-contentproc.*\\stab\\s*$') } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { "$([math]::Round($p.PeakWorkingSet64/1MB)) $([math]::Round($p.PeakPagedMemorySize64/1MB))" } }`;
  const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  let ws = 0, priv = 0;
  for (const l of out.split(/\r?\n/).filter(Boolean)) { const [a, b] = l.trim().split(/\s+/).map(Number); ws = Math.max(ws, a); priv = Math.max(priv, b); }
  return { ws, priv };
}

for (const slug of ['pdf-tools/jpg-to-pdf', 'pdf-tools/image-to-pdf']) {
  for (const file of [PANO, WEBP, PNG]) {
    for (let k = 0; k < runs; k++) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p32pdfp-'));
      const ctx = engine === 'firefox'
        ? await firefox.launchPersistentContext(dir, { userAgent: UA, hasTouch: true, acceptDownloads: true })
        : await chromium.launchPersistentContext(dir, { userAgent: UA, isMobile: true, hasTouch: true, acceptDownloads: true });
      await ctx.addInitScript(iosCanvasCapInit);
      await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
      const p = ctx.pages()[0] || await ctx.newPage();
      await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' });
      await p.waitForTimeout(800);
      const t0 = Date.now();
      await p.locator('input[type=file]').first().setInputFiles(file);
      await p.waitForTimeout(500);
      await p.getByRole('button', { name: /^(Convert|Create)/ }).first().click();
      const r = await Promise.race([
        p.locator('[data-file-download] [data-download], a[download]').first().waitFor({ timeout: 600000 }).then(() => 'done'),
        p.locator('.text-red-600, [role=alert]').filter({ hasText: /\w/ }).first().waitFor({ timeout: 600000 }).then(() => 'message'),
      ]).catch(() => 'timeout');
      const ms = Date.now() - t0;
      const pk = peaks(path.basename(dir));
      const msg = r === 'message' ? (await p.locator('.text-red-600, [role=alert]').filter({ hasText: /\w/ }).first().innerText().catch(() => '')).slice(0, 120) : '';
      console.log(`${engine} ${slug} ${path.basename(file)} (${(fs.statSync(file).size / 1e6).toFixed(1)} MB): ${r} in ${ms} ms | tab peak working set ${pk.ws} MB, peak private ${pk.priv} MB ${msg}`);
      await ctx.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
