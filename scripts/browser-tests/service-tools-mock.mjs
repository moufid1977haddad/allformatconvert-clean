// The tools that send a file to our media service -- Video Compressor, Video Converter, MP4 to GIF, MOV to GIF, and
// Image Upscaler (staged upload + /api/image-upscale) -- with the service PLAYED BY THIS TEST (routes intercepted;
// no ticket secret, no real service, no cost). What it proves, in any engine (made for Playwright's WebKit, which
// had sent the first chunk's bytes for every chunk on 20/09): the bytes the service receives are exactly the file's
// (SHA-256 of the reassembled chunks, and each chunk's X-Chunk-Sha256 header), the parameters sent, and that what
// the visitor downloads is exactly what the service returned, under the right name. Encoding quality itself is
// covered by services/media-processing/tests and e2e-video-service.mjs.
// Needs a build made with a test service URL (never a real one, no env file involved):
//   NEXT_PUBLIC_MEDIA_SERVICE_URL=https://media.test.invalid npm run build && npx next start -p 3100
// Usage: node scripts/browser-tests/service-tools-mock.mjs <origin> <ffmpeg> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
// On a deployed preview the page's service URL is the real one: MOCK_SERVICE_URL names it so the test still plays it (routes intercepted, nothing reaches it).
const SERVICE = process.env.MOCK_SERVICE_URL || 'https://media.test.invalid';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svcmock-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const sha = (b) => createHash('sha256').update(b).digest('hex');

// Sources: a 3 s MP4 of 2.6 MB (several 1 MiB chunks), the same as a .mov, and a 800x600 JPEG.
const mp4 = path.join(tmp, 'clip.mp4'), mov = path.join(tmp, 'clip.mov');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30:duration=3', '-f', 'lavfi', '-i', 'anoisesrc=d=3', '-c:v', 'libx264', '-b:v', '7M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', mp4]);
fs.copyFileSync(mp4, mov);
const jpg = path.join(tmp, 'small.jpg');
{ const c = createCanvas(800, 600); const x = c.getContext('2d'); x.fillStyle = '#3366cc'; x.fillRect(0, 0, 800, 600); x.fillStyle = '#fff'; x.font = '80px sans-serif'; x.fillText('upscale', 200, 320); fs.writeFileSync(jpg, c.toBuffer('image/jpeg')); }
// What "the service" returns
const BACK = {
  mp4: fs.readFileSync(mp4).subarray(0, 0), // replaced below by a small real MP4
  gif: Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(4096, 1)]),
  png: (() => { const c = createCanvas(3200, 2400); c.getContext('2d').fillRect(0, 0, 10, 10); return c.toBuffer('image/png'); })(),
};
{ const small = path.join(tmp, 'back.mp4'); execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=30:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', small]); BACK.mp4 = fs.readFileSync(small); }

const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
let jobs = [];
let result = { ext: 'mp4', type: 'video/mp4', bytes: BACK.mp4 };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Expose-Headers': '*' };
await ctx.route('**/api/media/ticket', (r) => { const body = r.request().postDataJSON(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jid: 'j' + (jobs.length + 1) + 'x'.repeat(16), ticket: 'test-ticket', op: body.op }) }); });
await ctx.route('**/api/image-upscale', (r) => { const body = r.request().postDataJSON(); jobs.at(-1).route = body; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, width: 3200, height: 2400, outputBytes: result.bytes.length }) }); });
await ctx.route(SERVICE + '/**', async (r) => {
  const req = r.request(); const u = new URL(req.url()); const m = req.method();
  if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const json = (status, o) => r.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
  if (m === 'POST' && u.pathname === '/v1/jobs') { const body = req.postDataJSON(); jobs.push({ ...body, chunks: [], headerOk: true }); return json(201, { chunkBytes: 1 << 20, totalChunks: Math.ceil(body.size / (1 << 20)) }); }
  const job = jobs.at(-1);
  if (m === 'PUT' && /\/chunks\/\d+$/.test(u.pathname)) { const buf = req.postDataBuffer(); const h = (await req.allHeaders())['x-chunk-sha256']; if (h && h !== sha(buf)) job.headerOk = false; if (!h) job.headerMissing = true; job.chunks[Number(u.pathname.split('/').pop())] = buf; return json(200, {}); }
  if (m === 'POST' && u.pathname.endsWith('/start')) return json(202, {});
  if (m === 'GET' && u.pathname.endsWith('/result')) return r.fulfill({ status: 200, headers: { ...cors, 'Content-Type': result.type }, body: result.bytes });
  if (m === 'GET') return json(200, { status: 'done', outputExt: result.ext, outputBytes: result.bytes.length, receivedChunks: job.chunks.length });
  if (m === 'DELETE') return json(200, {});
  return json(404, {});
});
const received = (j) => Buffer.concat(j.chunks.filter(Boolean));
async function dl(p) { const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').first().click()]); return { name: d.suggestedFilename(), bytes: fs.readFileSync(await d.path()) }; }

async function mediaTool(tool, file, want, prep) {
  const p = await ctx.newPage(); jobs = [];
  await p.goto(origin + tool, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(file);
  if (prep) await prep(p);
  await p.getByRole('button', { name: want.button }).first().click();
  const ok = await p.locator('a[download]').first().waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  if (!ok) { check(`${tool}: a result to download`, false, (await p.locator('[role=alert]').allTextContents()).join(' ')); await p.close(); return; }
  const j = jobs[0]; const src = fs.readFileSync(file); const d = await dl(p);
  check(`${tool}: the service received exactly the file (${j.chunks.length} chunks, SHA-256 of the whole and of each chunk)`, jobs.length === 1 && sha(received(j)) === sha(src) && j.headerOk && !j.headerMissing, `${received(j).length} of ${src.length} B, op ${j.op} ${JSON.stringify(j.params)}`);
  check(`${tool}: downloads the service's bytes as ${d.name}`, d.bytes.equals(result.bytes) && want.name.test(d.name), d.name);
  await p.close();
}

result = { ext: 'mp4', type: 'video/mp4', bytes: BACK.mp4 };
await mediaTool('/tools/video-tools/video-compressor', mp4, { button: /^Compress/, name: /\.mp4$/ });
await mediaTool('/tools/video-tools/video-converter', mov, { button: /^Convert/, name: /\.mp4$/ });
result = { ext: 'gif', type: 'image/gif', bytes: BACK.gif };
await mediaTool('/tools/gif-tools/mp4-to-gif', mov, { button: /Convert|GIF/, name: /\.gif$/ });
await mediaTool('/tools/gif-tools/mov-to-gif', mov, { button: /Convert|GIF/, name: /\.gif$/ });

{ // Image Upscaler: refusal above 1 Mpx (said, nothing sent), then a 800x600 JPEG x4 through the staged upload
  result = { ext: 'png', type: 'image/png', bytes: BACK.png };
  const p = await ctx.newPage(); jobs = [];
  await p.goto(origin + '/tools/ai-tools/image-upscaler', { waitUntil: 'networkidle' });
  const big = path.join(tmp, 'big.jpg'); { const c = createCanvas(4000, 3000); c.getContext('2d').fillRect(0, 0, 50, 50); fs.writeFileSync(big, c.toBuffer('image/jpeg')); }
  await p.locator('input[type=file]').setInputFiles(big);
  const said = await p.getByText(/12.0 megapixels/).first().textContent({ timeout: 10000 }).catch(() => '');
  check('image-upscaler: 12 Mpx refused with its size, nothing sent', /12\.0 megapixels/.test(said) && jobs.length === 0, said.slice(0, 120));
  await p.locator('input[type=file]').setInputFiles(jpg);
  await p.getByRole('button', { name: /4×/ }).click();
  await p.getByRole('button', { name: /Upscale/ }).click();
  const ok = await p.locator('a[download]').first().waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
  if (!ok) check('image-upscaler: a result', false, (await p.locator('[role=alert], .text-red-600, .text-red-500').allTextContents()).join(' '));
  else {
    const j = jobs[0]; const d = await dl(p);
    check('image-upscaler: the service received exactly the JPEG (staged upload), route asked for scale 4', sha(received(j)) === sha(fs.readFileSync(jpg)) && j.headerOk && j.op === 'stage' && j.route?.scale === 4, `${j.op} ${JSON.stringify(j.route)}`);
    check('image-upscaler: downloads the service\'s PNG', d.bytes.equals(BACK.png) && /\.png$/.test(d.name), d.name);
  }
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);
