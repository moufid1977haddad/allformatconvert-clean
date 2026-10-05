// P35 (06/10, D2) — helpers around the Railway CLI that NEVER print a variable's value.
// The CLI prints values: its output stays inside this process.
//   node scripts/p35/railway-vars.mjs names <service>          -> the variable NAMES of a service (production)
//   node scripts/p35/railway-vars.mjs check-media              -> pdf-tools' MEDIA_SERVICE_URL: private yes/no, and
//                                                                 whether media-processing has a PORT variable
import { execFileSync } from 'node:child_process';

export function readVars(service) {
  const out = execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', '@railway/cli', 'variables', '--service', service, '--environment', 'production', '--json'], { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32', timeout: 120000 });
  return JSON.parse(out.toString());
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/p35/railway-vars.mjs');
if (isMain) {
  const [cmd, service] = process.argv.slice(2);
  try {
    if (cmd === 'names') {
      console.log(Object.keys(readVars(service)).sort().join('\n'));
    } else if (cmd === 'check-media') {
      const pdf = readVars('pdf-tools');
      const media = readVars('media-processing');
      let host = '';
      try { host = new URL(pdf.MEDIA_SERVICE_URL || '').hostname; } catch { /* absent */ }
      console.log(`pdf-tools MEDIA_SERVICE_URL private: ${host.endsWith('.railway.internal') ? 'yes' : 'no'}`);
      console.log(`media-processing has a PORT variable: ${media.PORT ? 'yes' : 'no'}; RAILWAY_PRIVATE_DOMAIN set: ${media.RAILWAY_PRIVATE_DOMAIN ? 'yes' : 'no'}`);
    } else {
      console.log('usage: names <service> | check-media');
      process.exit(2);
    }
  } catch (e) {
    console.log(`Railway CLI failed: ${String(e.stderr || e.message || '').split(/\r?\n/)[0].slice(0, 160)}`);
    process.exit(2);
  }
}
