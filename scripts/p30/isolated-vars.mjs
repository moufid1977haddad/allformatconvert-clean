// P30 lot 5: the isolated Chromium service's variables -- the Chromium/API settings of gotenberg-v2, copied in this
// process (values never printed), and NOTHING else: no Basic Auth credential, no LibreOffice setting, no other secret.
//   node scripts/p30/isolated-vars.mjs <dir linked to the isolated project> <service>
import { execFileSync } from 'node:child_process';
const [dir, svc] = process.argv.slice(2);
// The CLI binary itself (RAILWAY_BIN), not npx through a shell: values such as CHROMIUM_DENY_LIST (a regular
// expression) must reach Railway unchanged, without shell quoting.
const BIN = process.env.RAILWAY_BIN;
if (!BIN) { console.error('RAILWAY_BIN=<path to railway(.exe)> is required'); process.exit(2); }
const rw = (args, cwd) => execFileSync(BIN, args, { encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'pipe'] });
const src = JSON.parse(rw(['variables', '--service', 'gotenberg-v2', '--json'], process.cwd()));
const COPY = ['API_TIMEOUT', 'API_DISABLE_DOWNLOAD_FROM', 'API_DOWNLOAD_FROM_DENY_PRIVATE_IPS', 'CHROMIUM_AUTO_START', 'CHROMIUM_DENY_LIST',
  'CHROMIUM_DENY_PRIVATE_IPS', 'WEBHOOK_DISABLE', 'WEBHOOK_DENY_PRIVATE_IPS', 'GOTENBERG_GRACEFUL_SHUTDOWN_DURATION', 'LOG_STD_FORMAT', 'PORT'];
const set = { OCT_EDGE_MODE: 'back' };
for (const k of COPY) { if (src[k] === undefined) { console.error('missing on gotenberg-v2:', k); process.exit(2); } set[k] = src[k]; }
const args = ['variables', '--service', svc, '--skip-deploys'];
for (const [k, v] of Object.entries(set)) args.push('--set', `${k}=${v}`);
rw(args, dir);
const now = JSON.parse(rw(['variables', '--service', svc, '--json'], dir));
console.log('set:', Object.keys(set).join(' '));
console.log('names now on the service:', Object.keys(now).filter((k) => !k.startsWith('RAILWAY_')).sort().join(' '));
console.log('credentials present:', 'GOTENBERG_API_BASIC_AUTH_PASSWORD' in now || 'GOTENBERG_API_BASIC_AUTH_USERNAME' in now);
