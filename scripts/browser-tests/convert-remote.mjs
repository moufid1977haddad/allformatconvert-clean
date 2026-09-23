// A media-service "convert" job against a deployment, exactly as app/lib/mediaJob.js runMediaJob does it:
// ticket from the site -> create -> chunked upload -> start -> poll -> download. Node, not a browser, so a
// preview can be tested without opening the media service's CORS to it.
// Usage: node scripts/browser-tests/convert-remote.mjs <origin or _vercel_share URL> <media URL> '<params JSON>' <file>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [entry, media, paramsJson, file] = process.argv.slice(2);
const params = JSON.parse(paramsJson);
let cookie = '';
if (entry.includes('_vercel_share')) {
  const r = await fetch(entry, { redirect: 'manual' });
  cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
}
const origin = new URL(entry).origin;
const svc = async (p, ticket, init = {}) => {
  const r = await fetch(media + p, { ...init, headers: { ...(init.headers || {}), Authorization: 'Bearer ' + ticket } });
  return { r, j: await r.clone().json().catch(() => ({})) };
};
const bytes = fs.readFileSync(file);
const t = await fetch(origin + '/api/media/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify({ op: 'convert', size: bytes.length }) });
const tj = await t.json();
if (!t.ok) { console.log('FAIL ticket', t.status, JSON.stringify(tj)); process.exit(1); }
const { jid, ticket } = tj;
const c = await svc('/v1/jobs', ticket, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'convert', size: bytes.length, params }) });
if (c.r.status !== 201) { console.log('FAIL create', c.r.status, JSON.stringify(c.j)); process.exit(1); }
for (let n = 0; n < c.j.totalChunks; n++) {
  const part = bytes.subarray(n * c.j.chunkBytes, Math.min(bytes.length, (n + 1) * c.j.chunkBytes));
  const p = await svc(`/v1/jobs/${jid}/chunks/${n}`, ticket, { method: 'PUT', headers: { 'X-Chunk-Sha256': crypto.createHash('sha256').update(part).digest('hex') }, body: part });
  if (p.r.status !== 200) { console.log('FAIL chunk', n, p.r.status); process.exit(1); }
}
const t0 = Date.now();
const s = await svc(`/v1/jobs/${jid}/start`, ticket, { method: 'POST' });
if (s.r.status !== 202) { console.log('FAIL start', s.r.status, JSON.stringify(s.j)); process.exit(1); }
let st;
for (;;) {
  st = (await svc(`/v1/jobs/${jid}`, ticket)).j;
  if (st.status === 'done' || st.status === 'error') break;
  await new Promise((r) => setTimeout(r, 700));
}
if (st.status !== 'done') { console.log('FAIL job', JSON.stringify(st)); process.exit(1); }
const d = await fetch(`${media}/v1/jobs/${jid}/result`, { headers: { Authorization: 'Bearer ' + ticket } });
const out = Buffer.from(await d.arrayBuffer());
const dest = `${file}.remote.${st.outputExt}`;
fs.writeFileSync(dest, out);
console.log(out.length === st.outputBytes ? 'PASS' : 'FAIL size', path.basename(file), JSON.stringify(params), `${bytes.length} -> ${out.length} B`, st.outputExt, `${((Date.now() - t0) / 1000).toFixed(1)} s`, '->', dest);
