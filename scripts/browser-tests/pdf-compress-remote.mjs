// PDF Compress against a deployment, BOTH paths, exactly as the page does them:
//   file <= 4 MiB : multipart to /api/pdf-compress, the PDF comes back
//   file >  4 MiB : ticket (purpose pdf-compress) -> chunked upload to the media service -> start ->
//                   /api/pdf-compress with {jid, ticket, level} -> download the result from the media service
// Runs in Node, not in a browser, so a preview can be tested without opening the media service's CORS to it.
// Usage: node scripts/browser-tests/pdf-compress-remote.mjs <origin or _vercel_share URL> <media service URL> <level> <file>...
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [entry, media, level, ...files] = process.argv.slice(2);
const origin = new URL(entry).origin;
let cookie = '';
if (entry.includes('_vercel_share')) {
  const r = await fetch(entry, { redirect: 'manual' });
  cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
}
const site = (p, init = {}) => fetch(origin + p, { ...init, headers: { ...(init.headers || {}), ...(cookie ? { Cookie: cookie } : {}) } });
const svc = async (p, ticket, init = {}) => {
  const r = await fetch(media + p, { ...init, headers: { ...(init.headers || {}), Authorization: 'Bearer ' + ticket } });
  return { r, j: await r.clone().json().catch(() => ({})) };
};

async function staged(file, bytes) {
  const t = await site('/api/media/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'stage', size: bytes.length, purpose: 'pdf-compress' }) });
  const tj = await t.json();
  if (!t.ok) throw new Error('ticket ' + t.status + ' ' + JSON.stringify(tj));
  const { jid, ticket } = tj;
  const c = await svc('/v1/jobs', ticket, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'stage', size: bytes.length, params: {} }) });
  if (c.r.status !== 201) throw new Error('create ' + c.r.status + ' ' + JSON.stringify(c.j));
  const { chunkBytes, totalChunks } = c.j;
  for (let n = 0; n < totalChunks; n++) {
    const part = bytes.subarray(n * chunkBytes, Math.min(bytes.length, (n + 1) * chunkBytes));
    const sha = crypto.createHash('sha256').update(part).digest('hex');
    const p = await svc(`/v1/jobs/${jid}/chunks/${n}`, ticket, { method: 'PUT', headers: { 'X-Chunk-Sha256': sha }, body: part });
    if (p.r.status !== 200) throw new Error(`chunk ${n}: ${p.r.status}`);
  }
  const s = await svc(`/v1/jobs/${jid}/start`, ticket, { method: 'POST' });
  if (s.r.status !== 202) throw new Error('start ' + s.r.status + ' ' + JSON.stringify(s.j));
  const t0 = Date.now();
  const res = await site('/api/pdf-compress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level, jid, ticket, filename: path.basename(file) }) });
  const j = await res.json().catch(() => ({}));
  const secs = (Date.now() - t0) / 1000;
  if (!res.ok || !j.ok) return { status: res.status, j, secs };
  if (j.notSmaller) return { status: 200, j, secs };
  const d = await fetch(`${media}/v1/jobs/${jid}/result`, { headers: { Authorization: 'Bearer ' + ticket } });
  const out = Buffer.from(await d.arrayBuffer());
  return { status: 200, j, secs, out };
}

async function direct(file, bytes) {
  const form = new FormData();
  form.append('level', level);
  form.append('file', new Blob([bytes], { type: 'application/pdf' }), path.basename(file));
  const t0 = Date.now();
  const res = await site('/api/pdf-compress', { method: 'POST', body: form });
  const secs = (Date.now() - t0) / 1000;
  if ((res.headers.get('content-type') || '').includes('application/pdf')) {
    return { status: 200, j: JSON.parse(res.headers.get('x-compress-stats') || '{}'), secs, out: Buffer.from(await res.arrayBuffer()) };
  }
  return { status: res.status, j: await res.json().catch(() => ({})), secs };
}

let fails = 0;
for (const file of files) {
  const bytes = fs.readFileSync(file);
  const isStaged = bytes.length > 4 * 1024 * 1024;
  let r;
  try { r = await (isStaged ? staged(file, bytes) : direct(file, bytes)); } catch (e) { r = { status: 'ERR', j: { error: e.message } }; }
  const ok = r.out ? r.out.subarray(0, 5).toString() === '%PDF-' && r.out.length < bytes.length : r.status === 200 && r.j?.notSmaller;
  if (!ok) fails++;
  if (r.out) fs.writeFileSync(file.replace(/\.pdf$/i, `.remote-${level}.pdf`), r.out);
  console.log(ok ? 'PASS' : 'FAIL', path.basename(file), isStaged ? 'staged' : 'direct', level, `${bytes.length} -> ${r.out ? r.out.length : '-'} B`, r.out ? `(${((1 - r.out.length / bytes.length) * 100).toFixed(1)}%)` : '', `${r.secs ?? '-'} s`, JSON.stringify(r.j).slice(0, 160));
}
process.exit(fails ? 1 : 0);
