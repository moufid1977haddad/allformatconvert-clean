// Any staged tool against a deployment, exactly as app/lib/mediaJob.js does it in the browser:
// ticket -> chunked upload to the media service -> start -> the tool's route with {jid, ticket, ...fields}
// -> download of the result from the media service. Node, not a browser: a preview can be tested without
// opening the media service's CORS to it.
// Usage: node scripts/browser-tests/staged-remote.mjs <origin or _vercel_share URL> <media URL> <endpoint> '<fields JSON>' <file> [purpose]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [entry, media, endpoint, fieldsJson, file, purpose] = process.argv.slice(2);
const fields = JSON.parse(fieldsJson || '{}');
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

const bytes = fs.readFileSync(file);
const t = await site('/api/media/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'stage', size: bytes.length, ...(purpose ? { purpose } : {}) }) });
const tj = await t.json();
if (!t.ok) { console.log('FAIL ticket', t.status, tj); process.exit(1); }
const { jid, ticket } = tj;
const c = await svc('/v1/jobs', ticket, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'stage', size: bytes.length, params: {} }) });
if (c.r.status !== 201) { console.log('FAIL create', c.r.status, c.j); process.exit(1); }
for (let n = 0; n < c.j.totalChunks; n++) {
  const part = bytes.subarray(n * c.j.chunkBytes, Math.min(bytes.length, (n + 1) * c.j.chunkBytes));
  const p = await svc(`/v1/jobs/${jid}/chunks/${n}`, ticket, { method: 'PUT', headers: { 'X-Chunk-Sha256': crypto.createHash('sha256').update(part).digest('hex') }, body: part });
  if (p.r.status !== 200) { console.log('FAIL chunk', n, p.r.status); process.exit(1); }
}
const s = await svc(`/v1/jobs/${jid}/start`, ticket, { method: 'POST' });
if (s.r.status !== 202) { console.log('FAIL start', s.r.status, s.j); process.exit(1); }
const t0 = Date.now();
const res = await site(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, jid, ticket, filename: path.basename(file) }) });
const j = await res.json().catch(() => ({}));
const secs = ((Date.now() - t0) / 1000).toFixed(1);
if (!res.ok || !j.ok || !j.outputBytes) { console.log('FAIL route', res.status, JSON.stringify(j).slice(0, 300), `${secs} s`); process.exit(1); }
const d = await fetch(`${media}/v1/jobs/${jid}/result`, { headers: { Authorization: 'Bearer ' + ticket } });
const out = Buffer.from(await d.arrayBuffer());
const ext = j.ext || (d.headers.get('content-type') || '').split('/').pop().replace('vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx').replace('vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx');
const dest = `${file}.remote.${ext}`;
fs.writeFileSync(dest, out);
console.log(out.length === j.outputBytes ? 'PASS' : 'FAIL size', path.basename(file), endpoint, JSON.stringify(fields), `${bytes.length} -> ${out.length} B`, d.headers.get('content-type'), `${secs} s`, JSON.stringify(j).slice(0, 200), '->', dest);
