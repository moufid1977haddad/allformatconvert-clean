// P26: run a bench against the LIVE pdf-tools service with one of its own API keys, read from Railway through the
// owner's logged-in CLI and passed to the child in an environment variable -- never printed, never written.
//   node scripts/p26/with-pdftools-key.mjs <ENV_NAME> <command> [args...]   (the URL is in $PDFTOOLS_LIVE_URL)
import { execFileSync, spawnSync } from 'node:child_process';

const [envName, cmd, ...args] = process.argv.slice(2);
const vars = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', 'pdf-tools', '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const keys = Object.keys(JSON.parse(vars.API_KEYS || '{}'));
if (!keys.length) { console.error('no API key on pdf-tools'); process.exit(2); }
const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, [envName]: keys[0], PDFTOOLS_LIVE_URL: `https://${vars.RAILWAY_PUBLIC_DOMAIN}` } });
process.exit(r.status ?? 1);
