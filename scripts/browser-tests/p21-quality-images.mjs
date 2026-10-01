// P21 phase 4 (02/10) — quality of the most searched image converters, measured against a reference decoder /
// resizer (libvips through sharp) on a real photo (docs/audit/detourage-comparaison/photos-test/01_portrait_cheveux.jpg,
// CC BY 2.0). For each tool, through its real page: output format, size in pixels, file size, and fidelity (PSNR in dB
// against the source as libvips decodes it; ≥ 40 dB = differences invisible, ∞ = identical). For JPG outputs, the
// same photo encoded by libvips' mozjpeg at quality 90 (what reference converters typically use) is given beside ours.
// Usage: node scripts/browser-tests/p21-quality-images.mjs <origin> [--browser=chromium|firefox] [--no-vercel-toolbar]
import { chromium, firefox } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox }[name];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-q-'));
const SRC = path.join('docs', 'audit', 'detourage-comparaison', 'photos-test', '01_portrait_cheveux.jpg');
let fails = 0, passes = 0;
const rows = [];
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

const files = { jpg: path.join(dir, 'photo.jpg'), png: path.join(dir, 'photo.png'), webp: path.join(dir, 'photo.webp') };
fs.copyFileSync(SRC, files.jpg);
await sharp(SRC).png().toFile(files.png);
await sharp(SRC).webp({ quality: 90 }).toFile(files.webp);

async function psnr(a, b) {
  const A = await sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).removeAlpha().resize(A.info.width, A.info.height, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let se = 0; for (let i = 0; i < A.data.length; i++) { const d = A.data[i] - B.data[i]; se += d * d; }
  const mse = se / A.data.length; return mse === 0 ? Infinity : 10 * Math.log10(255 * 255 / mse);
}
const b = await engine.launch();
async function runTool(slug, file, setup) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/image-tools/${slug}`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.waitForTimeout(800);
  if (setup) await setup(p);
  const row = p.locator('[data-file-download]').first();
  if (!(await row.isVisible().catch(() => false))) {
    const btn = p.locator('main button:visible').filter({ hasText: /convert|resize|download|apply/i }).first();
    if (await btn.count()) await btn.click().catch(() => {});
  }
  await row.waitFor({ timeout: 120000 });
  const [dl] = await Promise.all([p.waitForEvent('download'), row.locator('a[data-download]').click()]);
  const out = path.join(dir, `${slug}-${dl.suggestedFilename()}`); await dl.saveAs(out);
  await ctx.close();
  return out;
}
const meta = async (f) => { const m = await sharp(f).metadata(); return { fmt: m.format, w: m.width, h: m.height, bytes: fs.statSync(f).size }; };

// PNG → JPG, WebP → JPG: our JPG against mozjpeg q90 of the same source
for (const [slug, src] of [['png-to-jpg', files.png], ['webp-to-jpg', files.webp]]) {
  const out = await runTool(slug, src);
  const m = await meta(out), q = await psnr(src, out);
  const ref = path.join(dir, `${slug}-ref.jpg`); await sharp(src).jpeg({ quality: 90, mozjpeg: true }).toFile(ref);
  const mr = await meta(ref), qr = await psnr(src, ref);
  rows.push({ tool: slug, ours: `${m.fmt} ${m.w}×${m.h}, ${m.bytes} B, ${q.toFixed(2)} dB`, reference: `mozjpeg q90: ${mr.bytes} B, ${qr.toFixed(2)} dB` });
  check(`${slug}: JPEG ${m.w}×${m.h}, ${(m.bytes / 1024).toFixed(0)} KB at ${q.toFixed(1)} dB (mozjpeg q90: ${(mr.bytes / 1024).toFixed(0)} KB at ${qr.toFixed(1)} dB)`, m.fmt === 'jpeg' && q >= 38 && (q >= qr - 1 || m.bytes <= mr.bytes * 0.9));
}
// JPG → PNG, WebP → PNG: lossless after decoding (browser decoders may differ from libjpeg by a rounding step)
for (const [slug, src] of [['jpg-to-png', files.jpg], ['webp-to-png', files.webp]]) {
  const out = await runTool(slug, src);
  const m = await meta(out), q = await psnr(src, out);
  rows.push({ tool: slug, ours: `${m.fmt} ${m.w}×${m.h}, ${m.bytes} B, ${q === Infinity ? '∞' : q.toFixed(2)} dB vs libvips decode` });
  check(`${slug}: PNG ${m.w}×${m.h}, ${q === Infinity ? 'identical' : q.toFixed(1) + ' dB'} to the decoded source`, m.fmt === 'png' && q >= 45);
}
// Image Resizer 50 %: against libvips Lanczos-3 at the same size, in luma (the output is a JPEG: its own colour
// compression would otherwise dominate the comparison), plus sharpness (mean squared Laplacian) so a blurry resize
// cannot pass.
{
  const out = await runTool('image-resizer', files.jpg, async (p) => { await p.getByRole('button', { name: 'By percentage' }).click(); await p.getByRole('button', { name: /50% smaller/ }).click(); await p.getByRole('button', { name: /^Resize/ }).click(); });
  const m = await meta(out), src = await meta(files.jpg);
  const grey = async (f) => (await sharp(f).removeAlpha().resize(m.w, m.h, { fit: 'fill' }).greyscale().raw().toBuffer());
  const O = await grey(out), L = await sharp(files.jpg).resize(m.w, m.h, { kernel: 'lanczos3', fit: 'fill' }).greyscale().raw().toBuffer();
  let se = 0; for (let i = 0; i < O.length; i++) { const d = O[i] - L[i]; se += d * d; }
  const q = 10 * Math.log10(65025 / (se / O.length));
  const sharp2 = (buf) => { let t = 0, n = 0; for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) { const i = y * m.w + x; const l = 4 * buf[i] - buf[i - 1] - buf[i + 1] - buf[i - m.w] - buf[i + m.w]; t += l * l; n++; } return t / n; };
  const so = sharp2(O), sl = sharp2(L);
  rows.push({ tool: 'image-resizer', ours: `${m.fmt} ${m.w}×${m.h} from ${src.w}×${src.h}, luma ${q.toFixed(2)} dB vs Lanczos-3, sharpness ${so.toFixed(0)}`, reference: `Lanczos-3 sharpness ${sl.toFixed(0)}` });
  check(`image-resizer: ${src.w}×${src.h} → ${m.w}×${m.h}, luma ${q.toFixed(1)} dB against Lanczos-3, sharpness ${so.toFixed(0)} (Lanczos-3: ${sl.toFixed(0)})`, Math.abs(m.w / src.w - 0.5) < 0.01 && q >= 40 && so >= 0.8 * sl);
}
await b.close();
fs.writeFileSync(path.join(dir, 'quality.json'), JSON.stringify(rows, null, 1));
console.log(JSON.stringify(rows, null, 1));
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
