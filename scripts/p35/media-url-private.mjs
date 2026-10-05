// P35 (06/10, D2) — does pdf-tools reach the media service through Railway's private network?
// Reads the service's variables with the Railway CLI INSIDE this process (the CLI prints values: its output never
// reaches the terminal) and prints ONLY: the variable exists, "private: yes/no". Never the value.
//   node scripts/p35/media-url-private.mjs [service=pdf-tools] [VARIABLE=MEDIA_SERVICE_URL]
import { execFileSync } from 'node:child_process';

const service = process.argv[2] || 'pdf-tools';
const name = process.argv[3] || 'MEDIA_SERVICE_URL';
let vars;
try {
  const out = execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', '@railway/cli', 'variables', '--service', service, '--environment', 'production', '--json'], { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32', timeout: 120000 });
  vars = JSON.parse(out.toString());
} catch (e) {
  // the CLI's stderr may hold a message, never a value: only its first line, trimmed
  console.log(`could not read the variables of ${service}: ${String((e.stderr || e.message || '')).split(/\r?\n/)[0].slice(0, 160)}`);
  process.exit(2);
}
const v = vars[name];
if (typeof v !== 'string' || !v) { console.log(`${service}: ${name} absent`); process.exit(1); }
let host = '';
try { host = new URL(v).hostname; } catch { /* not a URL */ }
console.log(`${service}: ${name} present; private: ${host.endsWith('.railway.internal') ? 'yes' : 'no'}${host ? '' : ' (not a URL)'}`);
