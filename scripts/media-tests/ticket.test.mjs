// Unit tests for lib/media/ticket.js + JS->Python interoperability of the signature.
// The signing key is a throwaway value generated in memory for this run only.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { mintTicket, readConfig, validateRequest, TICKET_TTL_SECONDS } = require('../../lib/media/ticket.js');

const secret = randomBytes(32).toString('base64url');
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('  PASS', name); };

t('mintTicket: shape, 15 minute lifetime, unique job ids', () => {
  const a = mintTicket({ secret, op: 'convert', maxBytes: 1000, now: 1_800_000_000_000 });
  const b = mintTicket({ secret, op: 'convert', maxBytes: 1000 });
  assert.match(a.ticket, /^v1\.[\w-]+\.[\w-]+$/);
  assert.equal(a.expiresAt, 1_800_000_000 + TICKET_TTL_SECONDS);
  assert.notEqual(a.jid, b.jid);
  assert.equal(a.jid.length, 32);
});

t('readConfig: every missing variable is NAMED, none has a default', () => {
  const r = readConfig({});
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing.sort(), ['MEDIA_JOBS_PER_DAY_PER_IP', 'MEDIA_JOBS_PER_HOUR_PER_IP', 'MEDIA_TICKET_MAX_BYTES', 'MEDIA_TICKET_SECRET']);
  const bad = readConfig({ MEDIA_TICKET_SECRET: 'x', MEDIA_TICKET_MAX_BYTES: '0', MEDIA_JOBS_PER_HOUR_PER_IP: 'abc', MEDIA_JOBS_PER_DAY_PER_IP: '5' });
  assert.deepEqual(bad.missing.sort(), ['MEDIA_JOBS_PER_HOUR_PER_IP', 'MEDIA_TICKET_MAX_BYTES']);
  const ok = readConfig({ MEDIA_TICKET_SECRET: 'x', MEDIA_TICKET_MAX_BYTES: '1073741824', MEDIA_JOBS_PER_HOUR_PER_IP: '20', MEDIA_JOBS_PER_DAY_PER_IP: '60' });
  assert.equal(ok.ok, true);
  assert.equal(ok.maxBytes, 1073741824);
});

t('readConfig never echoes a value in its result when incomplete', () => {
  assert.doesNotMatch(JSON.stringify(readConfig({ MEDIA_TICKET_SECRET: 'SUPERSECRETVALUE' })), /SUPERSECRETVALUE/);
});

t('validateRequest: operations, sizes and the size ceiling', () => {
  assert.equal(validateRequest({ op: 'convert', size: 100 }, 1000).ok, true);
  assert.equal(validateRequest({ op: 'delete', size: 100 }, 1000).status, 400);
  assert.equal(validateRequest({ op: 'convert', size: 0 }, 1000).status, 400);
  assert.equal(validateRequest({ op: 'convert', size: 1.5 }, 1000).status, 400);
  assert.equal(validateRequest({ op: 'convert', size: '100' }, 1000).status, 400);
  assert.equal(validateRequest({ op: 'compress', size: 5000 }, 1000).status, 413);
  assert.equal(validateRequest(null, 1000).status, 400);
});

t('INTEROP: a ticket minted by the site is accepted by the Python service verifier', () => {
  const svc = path.resolve('services/media-processing');
  const { ticket, jid } = mintTicket({ secret, op: 'compress', maxBytes: 12345 });
  const py = process.platform === 'win32' ? path.join(svc, '.venv/Scripts/python.exe') : 'python3';
  const code = `import os,sys,json; from app import tickets; p,r=tickets.verify(sys.argv[1]); print(json.dumps([p,r]))`;
  const env = { ...process.env, MEDIA_TICKET_SECRET: secret, ALLOWED_ORIGINS: 'https://x.test', MEDIA_MAX_CONCURRENT_JOBS: '1', MEDIA_MAX_QUEUED_JOBS: '1', MEDIA_MAX_FILE_BYTES: '1', MEDIA_MAX_DURATION_SECONDS: '1', MEDIA_JOB_TTL_SECONDS: '1', MEDIA_FFMPEG_TIMEOUT_SECONDS: '1', MEDIA_WORK_DIR: 'x', MEDIA_FFMPEG_PATH: 'x', MEDIA_CHUNK_BYTES: '1' };
  const r = spawnSync(py, ['-c', code, ticket], { cwd: svc, env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const [payload, reason] = JSON.parse(r.stdout);
  assert.equal(reason, null);
  assert.equal(payload.jid, jid);
  assert.equal(payload.op, 'compress');
  assert.equal(payload.max, 12345);
  // and a tampered payload is rejected
  const tampered = ticket.replace(/^v1\.[\w-]+/, 'v1.' + Buffer.from(JSON.stringify({ jid, op: 'compress', max: 99999999999, exp: 4102444800 })).toString('base64url'));
  const r2 = spawnSync(py, ['-c', code, tampered], { cwd: svc, env, encoding: 'utf8' });
  assert.equal(JSON.parse(r2.stdout)[1], 'bad_signature');
});

console.log(`\n${n} passed`);
