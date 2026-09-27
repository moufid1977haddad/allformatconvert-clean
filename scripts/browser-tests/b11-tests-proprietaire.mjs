// Bloquant 11 -- the owner's "seven tests" sheet (claude/tests-manuels-proprietaire.md), tests 1 to 6, automated on
// the real pages as a visitor would do them; every downloaded file is reopened here (sharp, ffmpeg, xlsx, pdfjs) and
// the images the sheet says to "open" are saved in <fixtures>/out-<browser>/ to be looked at. Test 7 (a real page
// crash written to tool_errors) is b11-test7-crash.mjs, on a preview only.
// Fixtures (<fixtures dir>): A.mp4 (landscape), B.mp4 (portrait pixels), B-rot.mp4 (landscape + 90° display matrix,
// as a phone stores it); for test 2's geometry W.mp4 / W-port.mp4 / W-rot.mp4, the same three shapes in plain dark
// grey (on a moving picture the white text cannot be told apart from what changed between frames), C-excel-fr.csv / C-excel-fr-ansi.csv (saved by the real Excel, see the report), the rest is
// made here with ffmpeg and LibreOffice.
// Usage: node scripts/browser-tests/b11-tests-proprietaire.mjs <origin> <ffmpeg> <fixtures dir> [--browser=firefox] [--only=1,3]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as XLSX from 'xlsx';

const [entry, FF, FX] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const want = (n) => !only.length || only.includes(String(n));
const FP = FF.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
const OUT = path.join(FX, `out-${browserName}`); fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const note = (s) => console.log('NOTE', `${browserName} ${s}`);

const engine = { chromium, firefox, webkit }[browserName];
const browser = await engine.launch({ args: browserName === 'chromium' ? ['--autoplay-policy=no-user-gesture-required'] : [] });
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
const newPage = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(60000); return p; };
const save = async (d, name) => { const f = path.join(OUT, name); await d.saveAs(f); return f; };
const probe = (f) => JSON.parse(execFileSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]).toString());

// Raw RGB of an image file (any format sharp reads), and PSNR between two same-size images.
const rgb = async (f, w, h) => { let s = sharp(f).removeAlpha(); if (w) s = s.resize(w, h, { fit: 'fill' }); const { data, info } = await s.raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
const psnr = (a, b) => { let se = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; se += d * d; } const mse = se / a.length; return mse === 0 ? 99 : 10 * Math.log10(255 * 255 / mse); };
const meanLuma = (d) => { let s = 0; for (let i = 0; i < d.length; i += 3) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; return s / (d.length / 3); };
// One frame of a video as PNG, at time t (ffmpeg applies the display matrix, as players do).
async function bestNear(video, t, img, tag) { let best = { p: -1, dt: 0 }; for (let k = -6; k <= 6; k++) { const tt = Math.max(0, t + k / 30); const r = await rgb(frameAt(video, tt, path.join(OUT, `_near.png`)), img.w, img.h); const q = psnr(img.data, r.data); if (q > best.p) best = { p: q, dt: k }; } return best; }
const frameAt = (video, t, out) => { execFileSync(FF, ['-y', '-v', 'error', '-ss', String(t), '-i', video, '-frames:v', '1', out]); return out; };

// ---------------------------------------------------------------- Test 1: video-screenshot, PNG then JPG
async function test1(name) {
  const src = path.join(FX, name + '.mp4');
  const p = await newPage();
  await p.goto(`${origin}/tools/video-tools/video-screenshot`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(src);
  const v = p.locator('video');
  await v.waitFor();
  await p.waitForFunction(() => document.querySelector('video')?.readyState >= 2, null, { timeout: 60000 });
  const dims = await v.evaluate((e) => [e.videoWidth, e.videoHeight]);
  // Play, then pause on a frame (the sheet's gesture), well inside the clip.
  await v.evaluate(async (e) => { e.muted = true; await e.play(); await new Promise((r) => setTimeout(r, 2500)); e.pause(); await new Promise((r) => setTimeout(r, 400)); });
  const t = await v.evaluate((e) => e.currentTime);
  const fmt = p.locator('select:has(option[value=jpg])');
  const shots = [];
  for (const f of ['png', 'jpg']) {
    await fmt.selectOption(f);
    await p.getByRole('button', { name: 'Capture Screenshot' }).click();
    const link = p.locator(`a[download$=".${f}"]`).last();
    await link.waitFor({ timeout: 15000 });
    const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
    shots.push(await save(d, `t1-${name}.${f}`));
  }
  const [png, jpg] = await Promise.all(shots.map((f) => rgb(f)));
    const jr = await rgb(shots[1], png.w, png.h);
  const pj = psnr(png.data, jr.data); const near = await bestNear(src, t, png); const pr = near.p;
  check(`test1 ${name}: PNG and JPG are the video's own size (${dims.join('x')})`, png.w === dims[0] && png.h === dims[1] && jpg.w === dims[0] && jpg.h === dims[1], `png ${png.w}x${png.h} jpg ${jpg.w}x${jpg.h}`);
  check(`test1 ${name}: JPG not black (mean luma ${meanLuma(jpg.data).toFixed(1)}; PNG ${meanLuma(png.data).toFixed(1)})`, meanLuma(jpg.data) > 20 && Math.abs(meanLuma(jpg.data) - meanLuma(png.data)) < 8);
  check(`test1 ${name}: JPG = the same frame as the PNG (PSNR ${pj.toFixed(1)} dB)`, pj > 30);
  check(`test1 ${name}: PNG = the frame on screen at ${t.toFixed(2)} s (best PSNR ${pr.toFixed(1)} dB against ffmpeg's frames, at ${near.dt >= 0 ? '+' : ''}${near.dt} frame)`, pr > 24 && Math.abs(near.dt) <= 2);
  await p.close();
  // The sheet's variant: capture BEFORE playing (nothing decoded yet may give a black JPG with no error).
  const q = await newPage();
  await q.goto(`${origin}/tools/video-tools/video-screenshot`, { waitUntil: 'networkidle' });
  await q.locator('input[type=file]').first().setInputFiles(src);
  await q.locator('video').waitFor();
  await q.locator('select:has(option[value=jpg])').selectOption('jpg');
  await q.getByRole('button', { name: 'Capture Screenshot' }).click(); // as soon as the player is there
  await q.waitForTimeout(1500);
  const link = q.locator('a[download$=".jpg"]');
  if (await link.count()) {
    const [d] = await Promise.all([q.waitForEvent('download'), link.last().click()]);
    const f = await save(d, `t1-${name}-before-play.jpg`);
    const im = await rgb(f);
    const tb = await q.locator('video').evaluate((e) => e.currentTime); const r0n = await bestNear(src, tb, im);
    // Reference: how close a CORRECT capture of this video gets to ffmpeg's frame (colour conversion differs
    // slightly between a browser and ffmpeg) -- the capture made after playing, just above.
    check(`test1 ${name}: capture before playing gives the frame shown (${tb.toFixed(2)} s), neither black nor blank (luma ${meanLuma(im.data).toFixed(1)}, best PSNR ${r0n.p.toFixed(1)} dB at ${r0n.dt} frame; a correct capture of this video: ${pr.toFixed(1)} dB)`, meanLuma(im.data) > 20 && meanLuma(im.data) < 250 && r0n.p > pr - 2);
  } else {
    const msg = await q.locator('text=/no readable frame|wait for it to load/i').count();
    check(`test1 ${name}: capture before playing refused with a message (no black file)`, msg > 0);
  }
  await q.close();
}

// ---------------------------------------------------------------- Test 2: video-watermark, the 5 positions
const WM_TEXT = 'Mon Type © 2026';
async function test2(name, positions) {
  const src = path.join(FX, name + '.mp4');
  const at = 2;
  const refFrame = await rgb(frameAt(src, at, path.join(OUT, `t2-${name}-src.png`)));
  for (const pos of positions) {
    const p = await newPage();
    await p.goto(`${origin}/tools/video-tools/video-watermark`, { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').first().setInputFiles(src);
    const txt = p.locator('label:text-is("Watermark Text") + input');
    await txt.fill(WM_TEXT);
    await p.getByRole('button', { name: pos, exact: true }).click();
    const go = p.getByRole('button', { name: 'Add Watermark' });
    await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Add Watermark/.test(b.textContent) && !b.disabled), null, { timeout: 60000 });
    const t0 = Date.now();
    await go.click();
    const dl = p.locator('a[download]').filter({ hasText: /Download/i }).first();
    const errP = p.locator('p.text-red-400').first();
    await Promise.race([dl.waitFor({ timeout: 600000 }), errP.waitFor({ timeout: 600000 }).then(async () => { throw new Error((await errP.innerText()).slice(0, 200)); })]);
    const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
    const f = await save(d, `t2-${name}-${pos}.mp4`);
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    const outFrame = await rgb(frameAt(f, at, path.join(OUT, `t2-${name}-${pos}.png`)));
    const same = outFrame.w === refFrame.w && outFrame.h === refFrame.h;
    check(`test2 ${name} ${pos}: output keeps the video's size and orientation (${outFrame.w}x${outFrame.h})`, same, `source ${refFrame.w}x${refFrame.h}, ${secs} s`);
    if (!same) { await p.close(); continue; }
    // Where the watermark is: pixels much brighter than the source frame (white text), bounding box.
    const { w, h } = outFrame;
    let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const d = (outFrame.data[i] + outFrame.data[i + 1] + outFrame.data[i + 2]) - (refFrame.data[i] + refFrame.data[i + 1] + refFrame.data[i + 2]);
      if (d > 90) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const margin = Math.round(Math.min(w, h) * 0.03);
    const box = `box x ${x0}-${x1}, y ${y0}-${y1} in ${w}x${h} (${n} px), margin ${margin}`;
    const inside = n > 200 && x0 >= margin / 2 && y0 >= margin / 2 && x1 <= w - 1 - margin / 2 && y1 <= h - 1 - margin / 2;
    const cx = (x0 + x1) / 2 / w, cy = (y0 + y1) / 2 / h;
    const where = { 'top-left': cx < 0.5 && cy < 0.5, 'top-right': cx > 0.5 && cy < 0.5, center: Math.abs(cx - 0.5) < 0.08 && Math.abs(cy - 0.5) < 0.08, 'bottom-left': cx < 0.5 && cy > 0.5, 'bottom-right': cx > 0.5 && cy > 0.5 }[pos];
    check(`test2 ${name} ${pos}: text entirely in the frame, off the edges, at the announced place`, inside && where, box);
    // Crop around the watermark for a human look (descenders of "y" and "p", right edge).
    if (n > 0) await sharp(path.join(OUT, `t2-${name}-${pos}.png`)).extract({ left: Math.max(0, x0 - 30), top: Math.max(0, y0 - 30), width: Math.min(w, x1 + 30) - Math.max(0, x0 - 30), height: Math.min(h, y1 + 30) - Math.max(0, y0 - 30) }).toFile(path.join(OUT, `t2-${name}-${pos}-crop.png`));
    await p.close();
  }
}

// ---------------------------------------------------------------- Test 3: a real French Excel CSV (semicolons, decimal commas)
const EXPECT = [
  ['Nom', 'Prix unitaire', 'Quantité', 'Total', 'Date', 'Remarque'],
  ['Café moulu', '12,5', '3', '37,5', '28/09/2026', 'Arabica; origine Éthiopie'],
  ['Thé vert', '8,75', '10', '87,5', '27/09/2026', 'Boîte de 100 g'],
  ['Chocolat noir 70 %', '1234,5', '2', '2469', '26/09/2026', 'prix « de gros »'],
  ['Crème fraîche', '2,1', '1', '2,1', '25/09/2026', 'ligne avec "guillemets"'],
  ['Pâtes, fusilli', '0,99', '25', '24,75', '24/09/2026', 'virgule dans le nom'],
];
// A decimal cell is right if it is the same text, or the same number (12,5 read as 12.5 is a correct reading).
const sameCell = (got, want) => { const g = String(got ?? '').trim(); if (g === want) return true; if (/^\d+(,\d+)?$/.test(want)) return Number(g.replace(',', '.')) === Number(want.replace(',', '.')) && g !== ''; return false; };
const gridReport = (rows) => rows.slice(0, 3).map((r) => JSON.stringify(r)).join(' | ');
function compareGrid(label, rows) {
  const cols = rows.map((r) => r.length);
  const shapeOk = rows.length === EXPECT.length && cols.every((c) => c === 6);
  check(`test3 ${label}: 6 columns, 6 rows (header included)`, shapeOk, `rows ${rows.length}, columns per row ${cols.join('/')}; ${gridReport(rows)}`);
  if (!shapeOk) return;
  const bad = [];
  EXPECT.forEach((r, i) => r.forEach((want, j) => { if (!sameCell(rows[i][j], want)) bad.push(`${want} → ${JSON.stringify(rows[i][j])}`); }));
  check(`test3 ${label}: every value right (decimal commas, accents, quoted ; and "")`, !bad.length, bad.slice(0, 8).join(' ; '));
}
async function test3() {
  const FILES = [['C-excel-fr.csv', 'UTF-8 + BOM (Excel "CSV UTF-8")', /UTF-8/], ['C-excel-fr-ansi.csv', 'Windows-1252 (Excel "CSV (point-virgule)")', /1252/]];
  // The CSV family: csv-to-json, csv-to-excel, csv-to-sql (Web Worker, file streamed) and csv-to-tsv (in page).
  const open = async (tool, src) => {
    const p = await newPage();
    await p.goto(`${origin}/tools/developer-tools/${tool}`, { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').first().setInputFiles(src);
    await p.waitForFunction(() => !/Comma/.test(document.querySelector('#csv-delimiter option[value=auto]')?.textContent || 'Comma'), null, { timeout: 5000 }).catch(() => {});
    const det = await p.locator('#csv-delimiter option[value=auto]').innerText();
    const encOpt = p.locator('#csv-encoding option[value=auto]');
    const enc = (await encOpt.count()) ? await encOpt.innerText() : '(no encoding choice)';
    return { p, det, enc };
  };
  for (const [file, label, encWant] of FILES) {
    const src = path.join(FX, file);
    for (const tool of ['csv-to-json', 'csv-to-excel', 'csv-to-sql', 'csv-to-tsv']) {
      const { p, det, enc } = await open(tool, src);
      check(`test3 ${tool} ${label}: delimiter auto-detected as semicolon`, /semicolon|;/i.test(det), det);
      check(`test3 ${tool} ${label}: encoding auto-detected`, encWant.test(enc), enc);
      let rows;
      if (tool === 'csv-to-tsv') {
        await p.getByRole('button', { name: 'Convert', exact: true }).click();
        const [d] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Download/ }).click()]);
        const out = fs.readFileSync(await save(d, `t3-${file}.tsv`), 'utf8');
        rows = out.replace(/\r/g, '').split('\n').filter(Boolean).map((l) => l.split('\t'));
      } else {
        const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('button', { name: /Convert|Download/ }).last().click()]);
        const out = await save(d, `t3-${file}.${tool.split('-').pop()}`);
        if (tool === 'csv-to-json') {
          const arr = JSON.parse(fs.readFileSync(out, 'utf8'));
          const keys = Object.keys(arr[0] || {});
          rows = [keys, ...arr.map((o) => keys.map((k) => o[k]))];
          check(`test3 csv-to-json ${label}: decimal comma read as a number (12,5 → 12.5), dates left as text`, arr[0]['Prix unitaire'] === 12.5 && arr[2]['Prix unitaire'] === 1234.5 && arr[0].Date === '28/09/2026', JSON.stringify(arr[0]));
        } else if (tool === 'csv-to-excel') {
          const wb = XLSX.read(fs.readFileSync(out));
          rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' });
          const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
          check(`test3 csv-to-excel ${label}: number cells (B2 = 12.5, D4 = 2469), text stays text`, raw[1][1] === 12.5 && raw[3][3] === 2469 && raw[1][0] === 'Café moulu', `B2 ${typeof raw[1][1]} ${raw[1][1]}, D4 ${typeof raw[3][3]} ${raw[3][3]}, A2 ${raw[1][0]}`);
        } else {
          const sql = fs.readFileSync(out, 'utf8');
          check(`test3 csv-to-sql ${label}: numeric columns typed, 12,5 written 12.5, accents intact`, /Prix unitaire DECIMAL/.test(sql) && /Quantité INTEGER/.test(sql) && sql.includes("VALUES ('Café moulu', 12.5, 3, 37.5, '28/09/2026'"), sql.split('\n').slice(0, 9).join(' | ').slice(0, 300));
          await p.close();
          continue;
        }
      }
      compareGrid(`${tool} ${label}`, rows);
      await p.close();
    }
  }
  // Leading zeros (phone numbers, postcodes) must stay text; a mixed column stays text.
  const idFile = path.join(FX, 'C-ids.csv');
  fs.writeFileSync(idFile, 'Nom;Téléphone;Code;Montant\nA;0612345678;01000;12,5\nB;0712345678;75001;3\n');
  const { p } = await open('csv-to-json', idFile);
  const [d] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Convert/ }).click()]);
  const arr = JSON.parse(fs.readFileSync(await save(d, 't3-ids.json'), 'utf8'));
  check('test3 csv-to-json: phone numbers and postcodes with a leading zero stay text, amounts become numbers', arr[0]['Téléphone'] === '0612345678' && arr[0].Code === '01000' && arr[1].Code === '75001' && arr[0].Montant === 12.5, JSON.stringify(arr));
  await p.close();
}

// ---------------------------------------------------------------- Test 4: audio-merger, MP3 44.1 kHz stereo + WAV 48 kHz mono
function makeAudio() {
  const mp3 = path.join(FX, 'D-44k-stereo.mp3'), wav = path.join(FX, 'D-48k-mono.wav');
  // Two different sources: a 440 Hz (left) / 660 Hz (right) MP3 of 6 s, and a 1000 Hz mono PCM of 4 s.
  if (!fs.existsSync(mp3)) execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=f=440:r=44100:d=6', '-f', 'lavfi', '-i', 'sine=f=660:r=44100:d=6', '-filter_complex', '[0][1]join=inputs=2:channel_layout=stereo', '-c:a', 'libmp3lame', '-b:a', '192k', mp3]);
  if (!fs.existsSync(wav)) execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=f=1000:r=48000:d=4', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
  return { mp3, wav };
}
// Frequency of a pure tone by zero crossings, per channel, in a window [a, b] s of a decoded float stereo stream.
function tone(pcm, sr, ch, a, b) {
  let z = 0, prev = 0; const i0 = Math.floor(a * sr), i1 = Math.floor(b * sr);
  for (let i = i0; i < i1; i++) { const s = pcm[i * 2 + ch]; if (i > i0 && ((prev < 0 && s >= 0))) z++; prev = s; }
  return z / (b - a);
}
const rms = (pcm, sr, ch, a, b) => { let s = 0, n = 0; for (let i = Math.floor(a * sr); i < Math.floor(b * sr); i++) { s += pcm[i * 2 + ch] ** 2; n++; } return Math.sqrt(s / n); };
async function test4() {
  const { mp3, wav } = makeAudio();
  for (const order of [['mp3', 'wav'], ['wav', 'mp3']]) {
    const files = order.map((k) => (k === 'mp3' ? mp3 : wav));
    const p = await newPage();
    await p.goto(`${origin}/tools/audio-tools/audio-merger`, { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').setInputFiles(files);
    await p.locator('#merge-format').waitFor({ timeout: 120000 });
    const fmt = await p.locator('#merge-format').inputValue();
    await p.getByRole('button', { name: 'Merge Audio Files' }).click();
    await p.locator('a[download]').waitFor({ timeout: 240000 });
    const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').click()]);
    const f = await save(d, `t4-${order.join('-')}-${d.suggestedFilename()}`);
    const info = probe(f); const st = info.streams.find((s) => s.codec_type === 'audio');
    const sr = Number(st.sample_rate), dur = Number(info.format.duration);
    const pcm = new Float32Array(new Uint8Array(execFileSync(FF, ['-v', 'error', '-i', f, '-f', 'f32le', '-ac', '2', '-'], { maxBuffer: 1 << 28 })).buffer);
    const dA = order[0] === 'mp3' ? 6 : 4;
    const seg1 = [0.5, dA - 0.5], seg2 = [dA + 0.5, 9.5];
    const fr = (seg, ch) => tone(pcm, sr, ch, ...seg);
    const mp3Seg = order[0] === 'mp3' ? seg1 : seg2, wavSeg = order[0] === 'mp3' ? seg2 : seg1;
    const l = fr(mp3Seg, 0), r = fr(mp3Seg, 1), wl = fr(wavSeg, 0), wr = fr(wavSeg, 1);
    const eL = rms(pcm, sr, 0, ...wavSeg), eR = rms(pcm, sr, 1, ...wavSeg);
    const tag = `test4 ${order.join(' then ')} (default output ${fmt}, ${st.codec_name} ${sr} Hz ${st.channels} ch)`;
    check(`${tag}: both parts, in order, duration ${dur.toFixed(3)} s ≈ 10 s`, Math.abs(dur - 10) < 0.15);
    check(`${tag}: no speed or pitch change — MP3 part L ${l.toFixed(1)} / R ${r.toFixed(1)} Hz (440/660), WAV part ${wl.toFixed(1)} Hz (1000)`, Math.abs(l - 440) < 3 && Math.abs(r - 660) < 3 && Math.abs(wl - 1000) < 3 && Math.abs(wr - 1000) < 3);
    check(`${tag}: mono part heard in both ears (RMS L ${eL.toFixed(3)} R ${eR.toFixed(3)})`, eL > 0.05 && Math.abs(eL - eR) / eL < 0.02);
    await p.close();
  }
}

// ---------------------------------------------------------------- Test 5: .doc, .ppt, .ods to PDF
async function test5(soffice) {
  const E = path.join(FX, 'E'); fs.mkdirSync(E, { recursive: true });
  const fid = path.resolve('docs/audit/fixtures-fidelite');
  const make = (srcFile, fmt, ext) => { const out = path.join(E, path.basename(srcFile).replace(/\.\w+$/, '.' + ext)); if (!fs.existsSync(out)) execFileSync(soffice, ['--headless', '--convert-to', fmt, '--outdir', E, srcFile], { stdio: 'ignore' }); return out; };
  const cases = [
    ['word-to-pdf', make(path.join(fid, 'fidelite-01.docx'), 'doc:MS Word 97', 'doc'), '.doc'],
    ['ppt-to-pdf', make(path.join(fid, 'fidelite-05.pptx'), 'ppt:MS PowerPoint 97', 'ppt'), '.ppt'],
    ['excel-to-pdf', make(path.join(fid, 'fidelite-03.xlsx'), 'ods', 'ods'), '.ods'],
  ];
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  for (const [tool, file, ext] of cases) {
    const head = fs.readFileSync(file).subarray(0, 8).toString('hex');
    const p = await newPage();
    await p.goto(`${origin}/tools/pdf-tools/${tool}`, { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').first().setInputFiles(file);
    const t0 = Date.now();
    const err = p.locator('[role=alert]').filter({ hasText: /S/ }).first();
    const dlP = p.waitForEvent('download', { timeout: 300000 });
    await p.getByRole('button', { name: 'Download PDF' }).click();
    const res = await Promise.race([dlP.then((d) => ({ d })), err.waitFor({ timeout: 300000 }).then(() => 'error')]).catch(() => 'timeout');
    if (!res.d) {
      const msg = res === 'error' ? await err.innerText() : '(nothing shown after 300 s)';
      const clear = res === 'error' && !/\b(500|undefined|null|TypeError|stack|ECONN|fetch failed)\b/i.test(msg) && msg.length > 20;
      check(`test5 ${ext} on ${tool}: no PDF — the visitor is told clearly`, clear, msg.slice(0, 200));
      await p.close(); continue;
    }
    const d = res.d;
    const f = await save(d, `t5-${path.basename(file)}.pdf`);
    const buf = fs.readFileSync(f);
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), verbosity: 0 }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) text += (await (await doc.getPage(i)).getTextContent()).items.map((it) => it.str).join(' ') + '\n';
    const words = text.replace(/\s+/g, ' ').trim();
    check(`test5 ${ext} (${head.slice(0, 8)}) on ${tool}: a readable PDF (${doc.numPages} pages, ${words.length} characters of text, ${((Date.now() - t0) / 1000).toFixed(1)} s)`, buf.subarray(0, 5).toString() === '%PDF-' && doc.numPages > 0 && words.length > 40, words.slice(0, 160));
    fs.writeFileSync(path.join(OUT, `t5-${path.basename(file)}.txt`), text);
    await p.close();
  }
}

// ---------------------------------------------------------------- Test 6: pdf-ocr language search, then French OCR
const FR_TEXT = [
  'Le château médiéval se trouvait à côté',
  "d'une forêt où l'on apercevait des élèves.",
  'Ça ne coûte rien : un garçon français',
  'a reçu une leçon près du théâtre.',
  'Noël, où êtes-vous ? Déjà très âgé.',
];
async function makeScan() {
  const pdfF = path.join(FX, 'F-scan-fr.pdf');
  if (fs.existsSync(pdfF)) return pdfF;
  const { createCanvas } = await import('@napi-rs/canvas');
  const W = 2480, H = 1400; const c = createCanvas(W, H); const x = c.getContext('2d');
  x.fillStyle = '#f4f1e8'; x.fillRect(0, 0, W, H);
  x.translate(W / 2, H / 2); x.rotate(0.6 * Math.PI / 180); x.translate(-W / 2, -H / 2); // a scan is never straight
  x.fillStyle = '#1a1a1a'; x.font = '72px serif';
  FR_TEXT.forEach((l, i) => x.fillText(l, 180, 220 + i * 210));
  const img = x.getImageData(0, 0, W, H); // paper noise
  for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 36; for (let k = 0; k < 3; k++) img.data[i + k] = Math.max(0, Math.min(255, img.data[i + k] + n)); }
  x.putImageData(img, 0, 0);
  const jpg = await sharp(c.toBuffer('image/png')).grayscale().jpeg({ quality: 70 }).toBuffer();
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create(); const im = await pdf.embedJpg(jpg);
  const page = pdf.addPage([595, 595 * H / W]); page.drawImage(im, { x: 0, y: 0, width: 595, height: 595 * H / W });
  fs.writeFileSync(pdfF, await pdf.save());
  return pdfF;
}
async function test6() {
  const pdfF = await makeScan();
  const p = await newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'networkidle' });
  const search = p.getByPlaceholder('Search languages...');
  const sel = search.locator('xpath=following-sibling::select[1]');
  for (const q of ['fran', 'fr', 'français', 'Français', 'french']) {
    await search.fill(q);
    const opts = await sel.locator('option').allInnerTexts();
    check(`test6 search "${q}": French found`, opts.some((o) => /^French( —|$)/.test(o)), `${opts.length} options: ${opts.slice(0, 6).join(', ')}`);
  }
  // What the visitor sees vs what will be used: after typing "fr", is the shown language the one the OCR takes?
  await search.fill('fr');
  const shown = await sel.evaluate((s) => s.options[s.selectedIndex]?.text);
  note(`after typing "fr" the list shows "${shown}" selected (before choosing anything)`);
  await sel.selectOption('fra');
  await p.locator('input[type=file]').first().setInputFiles(pdfF);
  await p.getByRole('button', { name: 'Run OCR' }).click();
  const out = p.locator('textarea[readonly]').first();
  await out.waitFor({ timeout: 300000 });
  await p.waitForTimeout(1000);
  const got = (await out.inputValue()).normalize('NFC');
  fs.writeFileSync(path.join(OUT, 't6-ocr.txt'), got);
  const accents = [...FR_TEXT.join(' ').matchAll(/[éèêàâçôûîùëœ]/gi)].length;
  const gotAcc = [...got.matchAll(/[éèêàâçôûîùëœ]/gi)].length;
  const words = FR_TEXT.join(' ').split(/\s+/); const hit = words.filter((w) => got.includes(w.replace(/[.,:?]$/, ''))).length;
  check(`test6 French OCR: real accents in the text (${gotAcc} accented letters for ${accents} in the page), no replacement characters`, gotAcc >= accents * 0.8 && !/\uFFFD/.test(got), got.replace(/\s+/g, ' ').slice(0, 200));
  check(`test6 French OCR: ${hit}/${words.length} words read exactly`, hit / words.length >= 0.8);
  await p.close();
  // A visitor who types "french", SEES "French" in the list and runs the OCR without opening the list: which
  // language does Tesseract load? (The language data file it fetches says it.)
  const ctx2 = await browser.newContext(); const q = await ctx2.newPage(); q.setDefaultTimeout(60000); // fresh context: no language data cached
  const langs = [];
  q.on('request', (r) => { const m = /\/([a-z_]{3,8})\.traineddata/.exec(r.url()); if (m) langs.push(m[1]); });
  await q.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'networkidle' });
  const s2 = q.getByPlaceholder('Search languages...');
  await s2.fill('french');
  const shownNow = await s2.locator('xpath=following-sibling::select[1]').evaluate((s) => s.options[s.selectedIndex]?.text);
  await q.locator('input[type=file]').first().setInputFiles(pdfF);
  await q.getByRole('button', { name: 'Run OCR' }).click();
  await q.locator('textarea[readonly]').first().waitFor({ timeout: 300000 });
  const got2 = (await q.locator('textarea[readonly]').first().inputValue()).normalize('NFC');
  const acc2 = [...got2.matchAll(/[éèêàâçôûîùëœ]/gi)].length;
  check(`test6 typing "french" (list shows "${shownNow}") and running without opening the list uses French`, langs.includes('fra') && !langs.includes('eng'), `language data fetched: ${langs.join(', ') || '(none seen: cached?)'}; ${acc2} accented letters read`);
  await q.close();
}

// Every language offered by pdf-ocr loads ITS OWN model: for each option, run the OCR, catch the model
// request (aborted: nothing downloaded) and compare it with the option; then check that file exists on the CDN.
async function test6models() {
  const pdfF = await makeScan();
  const mctx = await browser.newContext(); const p = await mctx.newPage(); p.setDefaultTimeout(60000); // fresh context: no model already cached
  const seen = [];
  await p.route(/\.traineddata/, (r) => { seen.push(r.request().url()); return r.abort(); });
  await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(pdfF);
  const sel = p.getByPlaceholder('Search languages...').locator('xpath=following-sibling::select[1]');
  const codes = await sel.locator('option').evaluateAll((os) => os.map((o) => o.value));
  const wrong = [], missing = [], urls = [], noMessage = [];
  for (const code of codes) {
    seen.length = 0;
    await sel.selectOption(code);
    await p.getByRole('button', { name: 'Run OCR' }).click();
    const t0 = Date.now();
    while (!seen.length && Date.now() - t0 < 30000) await p.waitForTimeout(100);
    const u = seen[0] || '';
    urls.push([code, u]);
    if (!u) missing.push(code); else if (!u.includes(`/${code}/`) || !u.includes(`${code}.traineddata`)) wrong.push(`${code} -> ${u}`);
    const told = await p.locator('text=/language data could not be downloaded/').first().waitFor({ timeout: 45000 }).then(() => true, () => false);
    if (!told) noMessage.push(code);
  }
  check(`test6 all ${codes.length} languages: a failed model download is told to the visitor (not an endless wait)`, !noMessage.length, noMessage.join(', '));
  check(`test6 all ${codes.length} languages: each requests its own model`, !wrong.length && !missing.length, [...wrong, ...missing.map((c) => c + ' -> (no request)')].slice(0, 6).join(' ; '));
  const absent = [];
  for (const [code, u] of urls) {
    if (!u) continue;
    const r = await fetch(u, { headers: { Range: 'bytes=0-3' } }).catch(() => null);
    if (!r || (r.status !== 200 && r.status !== 206)) absent.push(`${code} (${r ? r.status : 'network'})`);
  }
  check(`test6 all ${urls.length} models exist on the CDN Tesseract.js loads them from`, !absent.length, absent.join(', '));
  await p.close();
}

const t = Date.now();
try {
  if (want(1)) for (const n of ['A', 'B', 'B-rot']) await test1(n).catch((e) => check(`test1 ${n} ran`, false, e.message.split('\n')[0]));
  if (want(2)) { for (const [n, pos] of [['W', ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right']], ['W-port', ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right']], ['W-rot', ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right']]]) await test2(n, pos).catch((e) => check(`test2 ${n} ran`, false, e.message.split('\n')[0])); }
  if (want(3)) await test3().catch((e) => check('test3 ran', false, e.message.split('\n')[0]));
  if (want(4)) await test4().catch((e) => check('test4 ran', false, e.message.split('\n')[0]));
  if (want(5)) await test5('C:/Program Files/LibreOffice/program/soffice.exe').catch((e) => check('test5 ran', false, e.message.split('\n')[0]));
  if (want(6)) await test6().catch((e) => check('test6 ran', false, e.message.split('\n')[0]));
  if (want('6m')) await test6models().catch((e) => check('test6 models ran', false, e.message.split('\n')[0]));
} finally { await browser.close(); }
console.log(`${fails ? 'FAILURES: ' + fails : 'ALL PASS'} (${browserName}, ${((Date.now() - t) / 1000).toFixed(0)} s)`);
process.exit(fails ? 1 : 0);
