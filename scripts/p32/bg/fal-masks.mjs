// P32 (04/10) — masks of the fal candidates (REAL PAID CALLS), on the exact upload copy the page sends (work/<case>/upload.jpg,
// made by prep.py: longest side 1024, JPEG 0.92), sent as a data URI to the sync endpoint https://fal.run/<model>.
//   bria     : fal-ai/bria/background/remove (BRIA RMBG 2.0), 0.018 $ / image (fal pricing API, 04/10) -> RGBA PNG, alpha kept
//   birefnet : fal-ai/birefnet/v2, model "General Use (Light)" (fal's default), 1024x1024, mask_only -> grey mask;
//              0.0008 $ / compute second, reserved at 0.004 $ per call (5 s) before the call
// sync_mode: true -> the result comes back as a data URI and is not stored in the fal request history.
// Every call is reserved in docs/audit/depenses-fournisseurs.jsonl BEFORE it is sent (scripts/p30/paid-ledger.mjs,
// chantier P32, budget 1 $, all models together); a 4xx refusal is refunded; a credit/key error stops the bench.
// The key comes from ../fal-env.mjs, goes only into the Authorization header, and is never printed or written.
// Writes work/<case>/out_<model>.png, mask_<model>.png and work/fal-log-<model>.json (wall time, status, sizes).
// Usage: node scripts/p32/bg/fal-masks.mjs <bria|birefnet> [--only=case,case] [--skip-done]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { falKey } from '../fal-env.mjs';
import { reservePaid, refundPaid, spent } from '../../p30/paid-ledger.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', '..');
const WORK = path.join(ROOT, 'docs', 'audit', 'p32-bg', 'private', 'work');
const MODELS = {
  bria: { id: 'fal-ai/bria/background/remove', usd: 0.018, body: {} },
  birefnet: { id: 'fal-ai/birefnet/v2', usd: 0.004, body: { model: 'General Use (Light)', operating_resolution: '1024x1024', mask_only: true, refine_foreground: false, output_format: 'png' } },
};
const name = process.argv[2];
const M = MODELS[name];
if (!M) { console.log('usage: fal-masks.mjs <bria|birefnet>'); process.exit(1); }
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const skipDone = process.argv.includes('--skip-done');
const key = falKey();
if (!key) { console.log('FAL_KEY absent'); process.exit(1); }
const scrub = (s) => String(s).split(key).join('[redacted]');

const logFile = path.join(WORK, `fal-log-${name}.json`);
const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : {};
const cases = fs.readdirSync(WORK).filter((d) => fs.existsSync(path.join(WORK, d, 'upload.jpg')) && (!only.length || only.includes(d)));

async function call(c) {
  const up = fs.readFileSync(path.join(WORK, c, 'upload.jpg'));
  const body = JSON.stringify({ image_url: 'data:image/jpeg;base64,' + up.toString('base64'), sync_mode: true, ...M.body });
  const what = `${M.id} ${c === 'IMG_2433' ? 'IMG_2433 (photo du proprietaire)' : c}`;
  reservePaid({ chantier: 'P32', budgetUsd: 1, provider: 'fal', usd: M.usd, what });
  const t0 = performance.now();
  let r, txt;
  try {
    r = await fetch(`https://fal.run/${M.id}`, { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body });
    txt = await r.text();
  } catch (e) {
    return { ok: false, retry: true, err: scrub(e.message), ms: Math.round(performance.now() - t0) };
  }
  const ms = Math.round(performance.now() - t0);
  const hdr = {};
  for (const [k, v] of r.headers) if (/fal|billing|request-id|x-/i.test(k) && !/auth|cookie/i.test(k)) hdr[k] = scrub(v);
  if (!r.ok) {
    const err = scrub(txt).slice(0, 400);
    if (r.status >= 400 && r.status < 500) refundPaid({ chantier: 'P32', provider: 'fal', usd: M.usd, what });
    const fatal = r.status === 401 || r.status === 403 || /credit|balance|exhausted|locked|key/i.test(err);
    return { ok: false, status: r.status, err, ms, hdr, fatal, retry: r.status >= 500 };
  }
  const j = JSON.parse(txt);
  const img = j.image || (j.images && j.images[0]);
  const m = /^data:([^;]+);base64,(.*)$/s.exec(img.url || '');
  const buf = m ? Buffer.from(m[2], 'base64') : Buffer.from(await (await fetch(img.url)).arrayBuffer());
  fs.writeFileSync(path.join(WORK, c, `out_${name}.png`), buf);
  const meta = await sharp(buf).metadata();
  // the mask: alpha of the RGBA cut-out (BRIA), or the grey mask itself (BiRefNet mask_only)
  const mask = name === 'bria' ? sharp(buf).ensureAlpha().extractChannel(3) : sharp(buf).toColourspace('b-w');
  await mask.png().toFile(path.join(WORK, c, `mask_${name}.png`));
  const extra = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(j).filter(([k]) => !['image', 'images'].includes(k))), (k, v) => (typeof v === 'string' && v.length > 200 ? v.slice(0, 40) + '...' : v)));
  return { ok: true, status: r.status, ms, hdr, out: { width: meta.width, height: meta.height, channels: meta.channels, bytes: buf.length }, extra };
}

for (const c of cases) {
  if (skipDone && log[c] && log[c].ok) continue;
  let res = await call(c);
  if (!res.ok && res.retry && !res.fatal) { console.log(c, 'retry once after', res.status || res.err); res = await call(c); }
  log[c] = { ...res, usdReserved: M.usd, at: new Date().toISOString() };
  fs.writeFileSync(logFile, JSON.stringify(log, null, 1));
  console.log(c, res.ok ? 'ok' : 'FAIL', res.status || '', res.ms, 'ms', res.ok ? JSON.stringify(res.out) : res.err, '| spent P32 fal', spent('P32', 'fal').toFixed(3), '$');
  if (res.fatal) { console.log('STOP: credit/key error'); process.exit(2); }
}
