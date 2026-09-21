// Tests of the staged-document helpers (lib/media/staged.js) against a MOCK service, plus JS<->Python
// interoperability of the "server" role ticket. Throwaway signing key, generated in memory for this run.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { mintTicket, verifyTicket } = require('../../lib/media/ticket.js');
const { openStaged, readSource, depositOutput, discard, stagedConfig } = require('../../lib/media/staged.js');

const secret = randomBytes(32).toString('base64url');
const env = { MEDIA_TICKET_SECRET: secret, NEXT_PUBLIC_MEDIA_SERVICE_URL: 'https://svc.test/' };
let n = 0;
const t = async (name, fn) => { await fn(); n++; console.log('  PASS', name); };

await t('verifyTicket: valid, tampered, wrong key, expired, malformed', () => {
  const a = mintTicket({ secret, op: 'stage', maxBytes: 100 });
  assert.equal(verifyTicket(a.ticket, secret).jid, a.jid);
  assert.equal(verifyTicket(a.ticket, secret).role, 'browser');
  assert.equal(verifyTicket(a.ticket, 'other-secret'), null);
  assert.equal(verifyTicket(a.ticket.slice(0, -2) + 'xx', secret), null);
  assert.equal(verifyTicket(mintTicket({ secret, op: 'stage', maxBytes: 1, now: 1_000_000 }).ticket, secret), null); // long expired
  for (const bad of [undefined, null, '', 'v1.a', 'v2.a.b', 'x.y.z']) assert.equal(verifyTicket(bad, secret), null);
});

await t('stagedConfig names missing variables and never a value', () => {
  const r = stagedConfig({});
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing.sort(), ['MEDIA_TICKET_SECRET', 'NEXT_PUBLIC_MEDIA_SERVICE_URL']);
  assert.doesNotMatch(JSON.stringify(stagedConfig({ MEDIA_TICKET_SECRET: 'SUPERSECRET' })), /SUPERSECRET/);
});

await t('openStaged accepts only the visitor\'s own fresh stage ticket for the SAME job', () => {
  const a = mintTicket({ secret, op: 'stage', maxBytes: 5_000_000 });
  const ok = openStaged({ jid: a.jid, ticket: a.ticket, filename: 'r.docx' }, env);
  assert.equal(ok.ok, true);
  assert.equal(ok.base, 'https://svc.test');
  assert.equal(ok.filename, 'r.docx');
  // the server ticket it derives is role=server for that job only
  const sp = verifyTicket(ok.serverTicket, secret);
  assert.equal(sp.role, 'server');
  assert.equal(sp.jid, a.jid);
  assert.equal(sp.op, 'stage');
  // wrong jid, missing ticket, forged, video-op ticket, already-server ticket, no config
  assert.equal(openStaged({ jid: 'a'.repeat(32), ticket: a.ticket }, env).status, 401);
  assert.equal(openStaged({ jid: a.jid }, env).status, 401);
  assert.equal(openStaged({ jid: a.jid, ticket: a.ticket }, { ...env, MEDIA_TICKET_SECRET: 'nope' }).status, 401);
  const video = mintTicket({ secret, op: 'convert', maxBytes: 1 });
  assert.equal(openStaged({ jid: video.jid, ticket: video.ticket }, env).status, 401);
  const srv = mintTicket({ secret, op: 'stage', maxBytes: 1, role: 'server' });
  assert.equal(openStaged({ jid: srv.jid, ticket: srv.ticket }, env).status, 401);
  assert.equal(openStaged(null, env).status, 401);
  assert.equal(openStaged({ jid: a.jid, ticket: a.ticket }, {}).status, 503);
});

// ---- mock service ---------------------------------------------------------------------------
const realFetch = globalThis.fetch;
const calls = [];
function mock(handler) { globalThis.fetch = async (url, init = {}) => { calls.push({ url: String(url), init }); return handler(String(url), init); }; }
const h = openStaged((() => { const a = mintTicket({ secret, op: 'stage', maxBytes: 9e9 }); return { jid: a.jid, ticket: a.ticket, filename: 'x.pptx' }; })(), env);

await t('readSource: sends the SERVER ticket and returns the exact bytes', async () => {
  const data = Buffer.from('hello staged file');
  mock(() => new Response(data, { status: 200, headers: { 'content-length': String(data.length) } }));
  const r = await readSource(h);
  assert.equal(r.ok, true);
  assert.deepEqual(Buffer.from(await r.blob.arrayBuffer()), data);
  assert.equal(calls.at(-1).init.headers.Authorization, 'Bearer ' + h.serverTicket);
  assert.equal(calls.at(-1).url, `https://svc.test/v1/jobs/${h.jid}/source`);
});

await t('readSource: gone (409/404) -> 410, unreachable -> 502, empty or short -> 502', async () => {
  mock(() => new Response('{}', { status: 409 }));
  assert.equal((await readSource(h)).status, 410);
  mock(() => { throw new Error('down'); });
  assert.equal((await readSource(h)).status, 502);
  mock(() => new Response(Buffer.alloc(0), { status: 200 }));
  assert.equal((await readSource(h)).status, 502);
  mock(() => new Response(Buffer.from('abc'), { status: 200, headers: { 'content-length': '999' } }));
  assert.equal((await readSource(h)).status, 502);
});

await t('depositOutput: PUT with length, extension and the SHA-256 of the exact bytes', async () => {
  const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), randomBytes(1000)]);
  mock(() => new Response(JSON.stringify({ ok: true, outputBytes: pdf.length }), { status: 200 }));
  const r = await depositOutput(h, new Uint8Array(pdf), 'pdf');
  assert.equal(r.ok, true);
  assert.equal(r.outputBytes, pdf.length);
  const c = calls.at(-1);
  assert.equal(c.init.method, 'PUT');
  assert.equal(c.init.headers['X-Output-Sha256'], createHash('sha256').update(pdf).digest('hex'));
  assert.equal(c.init.headers['X-Output-Ext'], 'pdf');
  assert.equal(c.init.headers['Content-Length'], String(pdf.length));
  assert.equal(c.init.headers.Authorization, 'Bearer ' + h.serverTicket);
  assert.equal((await depositOutput(h, new Uint8Array(3), 'exe')).ok, false);
  mock(() => new Response('{}', { status: 400 }));
  assert.equal((await depositOutput(h, new Uint8Array(pdf), 'pdf')).status, 502);
});

await t('discard: DELETE, never throws', async () => {
  mock(() => new Response('{}', { status: 200 }));
  await discard(h);
  assert.equal(calls.at(-1).init.method, 'DELETE');
  mock(() => { throw new Error('down'); });
  await discard(h);
});
globalThis.fetch = realFetch;

await t('INTEROP: a server-role ticket minted by the site is accepted by the Python verifier', () => {
  const svc = path.resolve('services/media-processing');
  const { ticket, jid } = mintTicket({ secret, op: 'stage', maxBytes: 777, role: 'server' });
  const py = process.platform === 'win32' ? path.join(svc, '.venv/Scripts/python.exe') : 'python3';
  const code = 'import sys,json; from app import tickets; p,r=tickets.verify(sys.argv[1]); print(json.dumps([p,r]))';
  const penv = { ...process.env, MEDIA_TICKET_SECRET: secret, ALLOWED_ORIGINS: 'https://x.test', MEDIA_MAX_CONCURRENT_JOBS: '1', MEDIA_MAX_QUEUED_JOBS: '1', MEDIA_MAX_FILE_BYTES: '1', MEDIA_MAX_DURATION_SECONDS: '1', MEDIA_JOB_TTL_SECONDS: '1', MEDIA_FFMPEG_TIMEOUT_SECONDS: '1', MEDIA_WORK_DIR: 'x', MEDIA_FFMPEG_PATH: 'x', MEDIA_CHUNK_BYTES: '1' };
  const r = spawnSync(py, ['-c', code, ticket], { cwd: svc, env: penv, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const [payload, reason] = JSON.parse(r.stdout);
  assert.equal(reason, null);
  assert.equal(payload.role, 'server');
  assert.equal(payload.jid, jid);
  assert.equal(payload.op, 'stage');
});

console.log(`\n${n} passed`);
