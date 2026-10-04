// P32 point 2 (04/10): peak memory of Image Compressor's two iPhone paths, measured the P27 way (peak working set of
// the tab's renderer process, page + its Workers + WebAssembly, read from Windows), in a fresh Chromium per run:
//   pano  -- kit panorama-63mpx.jpg (14000 × 4500), "Reduce to N MP then compress" (the path that killed the iPhone tab)
//   p48   -- kit photo-48mpx.jpg (8064 × 6048), "Compress" (the path that works on the owner's iPhone: the reference)
// iPhone user agent (phone bounds) and the iOS canvas cap simulated in the page and the worker (band decoding, as on
// iOS). Chromium is NOT WebKit: it decodes a band from one whole-image bitmap (its cropped decode of rotated photos is
// wrong, app/lib/bigImage.js), WebKit crops natively -- so the absolute numbers are Chromium's; the comparison between
// the two paths, same engine, same rules, is what this measures. Playwright's WebKit on Windows has no OffscreenCanvas:
// Image Compressor does not run there at all (known since P21).
// Only this browser's processes are read (its own user-data-dir is matched in their command line).
//   node scripts/p32/compressor-peak-memory.mjs <origin> [--runs=2] [--only=pano|p48]
import { chromium, firefox } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iosCanvasCapInit } from '../browser-tests/lib/ios-canvas-cap.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const runs = Number(process.argv.find((a) => a.startsWith('--runs='))?.slice(7) || 2);
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const trace = process.argv.includes('--trace');
const engine = process.argv.includes('--browser=firefox') ? 'firefox' : 'chromium';
const kit = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const CASES = {
  pano: { file: path.join(kit, 'kit-iphone-p27', 'panorama-63mpx.jpg'), button: '[data-reduce-then-compress]' },
  p48: { file: path.join(kit, 'kit-iphone-p19', 'photo-48mpx.jpg'), button: null },
};
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

function peaks(marker) {
  // the browser process carries the user-data-dir; its renderers / GPU process are its descendants
  const ps = `$all = Get-CimInstance Win32_Process; $ids = @($all | Where-Object { $_.CommandLine -like '*${marker}*' } | ForEach-Object { $_.ProcessId }); do { $n = $ids.Count; $ids = @($ids + @($all | Where-Object { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) } | ForEach-Object { $_.ProcessId })) } while ($ids.Count -gt $n); $all | Where-Object { $ids -contains $_.ProcessId } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { $t = if ($_.CommandLine -match '--type=(\\S+)') { $matches[1] } elseif ($_.CommandLine -match '-contentproc.*\\stab\\s*$') { 'renderer' } elseif ($_.CommandLine -match '-contentproc.*\\sgpu\\s*$') { 'gpu-process' } else { 'browser' }; "$t $([math]::Round($p.PeakWorkingSet64/1MB)) $([math]::Round($p.PeakPagedMemorySize64/1MB))" } }`;
  const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  const r = { renderer: 0, rendererPrivate: 0, gpu: 0 };
  for (const line of out.split(/\r?\n/).filter(Boolean)) {
    const [type, ws, priv] = line.trim().split(/\s+/);
    if (type === 'renderer') { r.renderer = Math.max(r.renderer, +ws); r.rendererPrivate = Math.max(r.rendererPrivate, +priv); }
    if (type === 'gpu-process') r.gpu = Math.max(r.gpu, +ws);
  }
  return r;
}

function rendererPid(marker) {
  const ps = `$all = Get-CimInstance Win32_Process; $roots = @($all | Where-Object { $_.CommandLine -like '*${marker}*' -and $_.CommandLine -notmatch '--type=|-contentproc' } | ForEach-Object { $_.ProcessId }); $all | Where-Object { $roots -contains $_.ParentProcessId -and ($_.CommandLine -match '--type=renderer' -or $_.CommandLine -match '-contentproc.*\\stab\\s*$') -and $_.CommandLine -notmatch 'extension' } | ForEach-Object { $_.ProcessId }`;
  const pids = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' }).split(/\s+/).filter(Boolean).map(Number);
  // the tab's renderer: the one using the most memory now (the page is loaded)
  return pids.map((id) => [id, Number(execFileSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${id}).WorkingSet64`], { encoding: 'utf8' }))]).sort((a, b) => b[1] - a[1])[0][0];
}

const results = {};
for (const [name, c] of Object.entries(CASES)) {
  if (only && only !== name) continue;
  for (let k = 0; k < runs; k++) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p32peak-'));
    const ctx = engine === 'firefox'
      ? await firefox.launchPersistentContext(dir, { userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 }, acceptDownloads: true })
      : await chromium.launchPersistentContext(dir, { userAgent: UA, isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await ctx.addInitScript(iosCanvasCapInit);
    await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
    const p = ctx.pages()[0] || await ctx.newPage();
    await p.goto(`${origin}/tools/image-tools/image-compressor`, { waitUntil: 'load' });
    await p.waitForTimeout(800);
    const idle = peaks(path.basename(dir));
    // --trace: the renderer's working set / private bytes sampled every 100 ms, and the page's status line timed, so
    // the peak can be put on a stage (reducing / compressing)
    let sampler = null; const samples = [];
    if (trace) {
      await p.evaluate(() => { window.__stages = []; new MutationObserver(() => { const t = document.querySelector('li .text-sm p:nth-child(2)')?.textContent || ''; const s = /^Reducing/.test(t) ? 'reduce' : /^Compressing/.test(t) ? 'compress' : 'other'; if (window.__stages.at(-1)?.[1] !== s) window.__stages.push([Date.now(), s]); }).observe(document.body, { subtree: true, childList: true, characterData: true }); });
      const pid = rendererPid(path.basename(dir));
      sampler = spawn('powershell', ['-NoProfile', '-Command', `while ($true) { $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if (-not $p) { break }; "$([DateTimeOffset]::Now.ToUnixTimeMilliseconds()) $([math]::Round($p.WorkingSet64/1MB)) $([math]::Round($p.PrivateMemorySize64/1MB))"; Start-Sleep -Milliseconds 100 }`]);
      sampler.stdout.on('data', (d) => { for (const l of String(d).split(/\r?\n/).filter(Boolean)) samples.push(l.split(' ').map(Number)); });
    }
    const t0 = Date.now();
    await p.locator('input[type=file]').first().setInputFiles(c.file);
    if (c.button) { await p.locator(c.button).waitFor({ timeout: 10000 }); await p.locator(c.button).click(); }
    else await p.getByRole('button', { name: /^Compress/ }).click();
    const r = await Promise.race([
      p.locator('[data-file-download]').first().waitFor({ timeout: 600000 }).then(() => 'done'),
      p.locator('li p.text-red-600').first().waitFor({ timeout: 600000 }).then(() => 'error'),
    ]).catch(() => 'timeout');
    const ms = Date.now() - t0;
    const pk = peaks(path.basename(dir));
    const note = (await p.locator('li').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
    const hits = await p.evaluate(() => window.__iosCanvasCapHits || 0);
    console.log(`${engine} ${name} run ${k + 1}: ${r} in ${ms} ms | renderer peak working set ${pk.renderer} MB (peak private ${pk.rendererPrivate} MB, idle ${idle.renderer} MB) | gpu ${pk.gpu} MB | canvas-cap hits ${hits} | ${note}`);
    (results[name] ||= []).push({ r, ms, ...pk });
    if (sampler) {
      const stages = await p.evaluate(() => window.__stages);
      sampler.kill();
      const stageAt = (t) => { let s = 'before'; for (const [ts, n] of stages) if (ts <= t) s = n; return s; };
      const by = {};
      for (const [t, ws, priv] of samples) { const s = stageAt(t); by[s] ||= { ws: 0, priv: 0, n: 0 }; by[s].ws = Math.max(by[s].ws, ws); by[s].priv = Math.max(by[s].priv, priv); by[s].n++; }
      console.log(`   trace (${samples.length} samples / 100 ms): ` + Object.entries(by).map(([s, v]) => `${s}: max working set ${v.ws} MB, max private ${v.priv} MB (${v.n})`).join(' | '));
    }
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
for (const [name, list] of Object.entries(results)) console.log(`SUMMARY ${engine} ${name}: ${list.filter((x) => x.r === 'done').length}/${list.length} done, renderer peak min ${Math.min(...list.map((x) => x.renderer))} / median ${med(list.map((x) => x.renderer))} / max ${Math.max(...list.map((x) => x.renderer))} MB, peak private median ${med(list.map((x) => x.rendererPrivate))} MB`);
