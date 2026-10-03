// P30 lot 5: the PUBLIC key the isolated Chromium service trusts, derived exactly as services/gotenberg/edge/main.go
// DeriveKey does from Gotenberg's Basic Auth credentials (read in this process from the Railway CLI, never printed).
// Prints the public key (not a secret) and whether gotenberg-v2 and gotenberg-fonts share the credentials.
//   node scripts/p30/edge-pubkey.mjs
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
const vars = (svc) => JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
function pub(v) {
  const seed = crypto.createHash('sha256').update(Buffer.concat([Buffer.from('oct-chromium-isolated-v1'), Buffer.from([0]), Buffer.from(v.GOTENBERG_API_BASIC_AUTH_USERNAME), Buffer.from([0]), Buffer.from(v.GOTENBERG_API_BASIC_AUTH_PASSWORD)])).digest();
  const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
  const key = crypto.createPublicKey(crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' }));
  return key.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64url');
}
const a = vars('gotenberg-v2'), b = vars('gotenberg-fonts');
console.log('same credentials on gotenberg-v2 and gotenberg-fonts:', a.GOTENBERG_API_BASIC_AUTH_USERNAME === b.GOTENBERG_API_BASIC_AUTH_USERNAME && a.GOTENBERG_API_BASIC_AUTH_PASSWORD === b.GOTENBERG_API_BASIC_AUTH_PASSWORD);
console.log('public key gotenberg-v2:', pub(a));
console.log('public key gotenberg-fonts:', pub(b));
