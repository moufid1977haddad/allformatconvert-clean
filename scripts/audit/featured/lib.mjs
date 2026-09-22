// Shared helpers for the "featured tools" audit (bloquant 5): drive a real tool page in a real browser
// against a deployed site, feed it a real file, capture what the visitor would actually download.
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const BASE = process.env.AUDIT_BASE || 'https://www.onlineconvertools.com';
export const FX = process.env.AUDIT_FX; // directory holding the real test files
export const OUT = process.env.AUDIT_OUT; // where downloads are written
if (!FX || !OUT) throw new Error('Set AUDIT_FX (fixtures dir) and AUDIT_OUT (output dir)');
fs.mkdirSync(OUT, { recursive: true });

export const fx = (name) => path.join(FX, name);

export async function openBrowser(engineName = 'chromium') {
  const engine = { chromium, firefox, webkit }[engineName];
  const browser = await engine.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 } });
  // A preview share link (?_vercel_share=...) sets the bypass cookie on first visit.
  if (process.env.AUDIT_SHARE_URL) {
    const p = await ctx.newPage();
    await p.goto(process.env.AUDIT_SHARE_URL, { waitUntil: 'domcontentloaded' });
    await p.close();
  }
  return { browser, ctx };
}

export async function openTool(ctx, route) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
  return { page, errors };
}

// The tool's own file input (tool pages have exactly one; the navbar has none).
export async function upload(page, files) {
  const input = page.locator('main input[type=file], input[type=file]').first();
  await input.setInputFiles(files);
}

// Click an <a download> (or anything that triggers a download) and save it under OUT/<prefix>-<suggested>.
export async function download(page, locator, prefix, timeout = 120000) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout }), locator.click()]);
  const name = dl.suggestedFilename();
  const dest = path.join(OUT, `${prefix}__${name}`);
  await dl.saveAs(dest);
  return { name, dest, size: fs.statSync(dest).size };
}

// Magic-byte sniffing: what the downloaded bytes actually are, whatever the file name says.
export function sniff(file) {
  const b = fs.readFileSync(file);
  const s = (o, n) => b.subarray(o, o + n).toString('latin1');
  if (s(0, 5) === '%PDF-') return 'pdf';
  if (b[0] === 0x89 && s(1, 3) === 'PNG') return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP') return 'webp';
  if (s(0, 4) === 'RIFF' && s(8, 4) === 'WAVE') return 'wav';
  if (s(4, 4) === 'ftyp') { const brand = s(8, 4); return brand.startsWith('avi') ? 'avif' : brand.startsWith('heic') || brand.startsWith('mif1') ? 'heic' : 'mp4'; }
  if (s(0, 3) === 'GIF') return 'gif';
  if (s(0, 2) === 'BM') return 'bmp';
  if (s(0, 4) === 'PK\u0003\u0004') return 'zip';
  if (s(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'mp3';
  if (s(0, 4) === 'OggS') return 'ogg';
  if (s(0, 4) === 'fLaC') return 'flac';
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  if (s(0, 5) === '<?xml' || s(0, 4) === '<svg') return 'svg/xml';
  return 'unknown:' + b.subarray(0, 8).toString('hex');
}

export function ext(name) { return (name.split('.').pop() || '').toLowerCase().replace('jpeg', 'jpg'); }

export function record(results, tool, verdict, evidence) {
  results.push({ tool, verdict, ...evidence });
  console.log(`[${verdict}] ${tool} :: ${JSON.stringify(evidence)}`);
}
