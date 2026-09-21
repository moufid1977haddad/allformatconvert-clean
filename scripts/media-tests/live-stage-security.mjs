// Live checks that the DEPLOYED media service never accepts an unsigned or wrongly-scoped request on the
// document ("stage") path. Sends only tiny JSON/no file. Usage: node live-stage-security.mjs <serviceUrl>
// The throwaway "wrong key" secret below is a random value generated for this run: it is NOT a project secret.
import { createHmac, randomBytes } from 'node:crypto';

const base = process.argv[2].replace(/\/+$/, '');
const wrong = randomBytes(32);
const b64 = (b) => Buffer.from(b).toString('base64url');
function forge(payload, key = wrong) {
  const body = b64(JSON.stringify(payload));
  return `v1.${body}.${b64(createHmac('sha256', key).update(body).digest())}`;
}
const jid = randomBytes(16).toString('hex');
const exp = Math.floor(Date.now() / 1000) + 600;
let failures = 0;
async function expect(name, method, path, headers, body, wantStatus) {
  const r = await fetch(base + path, { method, headers, body });
  const ok = r.status === wantStatus;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}: HTTP ${r.status} (wanted ${wantStatus})`);
}
const json = { 'Content-Type': 'application/json' };
const forged = { Authorization: 'Bearer ' + forge({ jid, op: 'stage', max: 1e9, exp }) };
const forgedServer = { Authorization: 'Bearer ' + forge({ jid, op: 'stage', max: 1e9, exp, role: 'server' }) };
await expect('create without ticket', 'POST', '/v1/jobs', json, JSON.stringify({ op: 'stage', size: 10 }), 401);
await expect('create with a forged ticket', 'POST', '/v1/jobs', { ...json, ...forged }, JSON.stringify({ op: 'stage', size: 10 }), 401);
await expect('chunk without ticket', 'PUT', `/v1/jobs/${jid}/chunks/0`, { 'X-Chunk-Sha256': '0'.repeat(64) }, 'x', 401);
await expect('source without ticket', 'GET', `/v1/jobs/${jid}/source`, {}, undefined, 401);
await expect('source with a forged server ticket', 'GET', `/v1/jobs/${jid}/source`, forgedServer, undefined, 401);
await expect('output deposit without ticket', 'PUT', `/v1/jobs/${jid}/output`, { 'X-Output-Ext': 'pdf', 'X-Output-Sha256': '0'.repeat(64) }, '%PDF-', 401);
await expect('output deposit with a forged server ticket', 'PUT', `/v1/jobs/${jid}/output`, { ...forgedServer, 'X-Output-Ext': 'pdf', 'X-Output-Sha256': '0'.repeat(64) }, '%PDF-', 401);
await expect('result without ticket', 'GET', `/v1/jobs/${jid}/result`, {}, undefined, 401);
await expect('delete without ticket', 'DELETE', `/v1/jobs/${jid}`, {}, undefined, 401);
console.log(failures ? `\n${failures} FAILED` : '\nall refused');
process.exit(failures ? 1 : 0);
