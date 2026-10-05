// P35 (06/10, D2) — switch pdf-tools' MEDIA_SERVICE_URL to Railway's private network, or put the saved value back.
// Never prints a value. The previous value is saved in a file outside the repo (the session's scratch directory) for
// the rollback.
//   node scripts/p35/media-url-switch.mjs private <backup file>   -> saves the current value, sets
//        http://${{media-processing.RAILWAY_PRIVATE_DOMAIN}}:8080 (Railway's injected PORT; gunicorn binds 0.0.0.0:$PORT)
//   node scripts/p35/media-url-switch.mjs rollback <backup file>  -> sets the saved value back
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { readVars } from './railway-vars.mjs';

const [cmd, backup] = process.argv.slice(2);
const set = (value) => {
  // on Windows the shell would expand ${{…}} / quotes badly: the value goes through an environment variable
  const q = process.platform === 'win32' ? '"MEDIA_SERVICE_URL=%P35_VALUE%"' : '"MEDIA_SERVICE_URL=$P35_VALUE"';
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', '@railway/cli', 'variables', '--service', 'pdf-tools', '--environment', 'production', '--set', q], { stdio: ['ignore', 'pipe', 'pipe'], shell: true, env: { ...process.env, P35_VALUE: value }, timeout: 180000 });
};
const isPrivate = () => { try { return new URL(readVars('pdf-tools').MEDIA_SERVICE_URL).hostname.endsWith('.railway.internal'); } catch { return false; } };

if (cmd === 'private') {
  if (!backup) throw new Error('backup file required');
  const old = readVars('pdf-tools').MEDIA_SERVICE_URL;
  if (!old) { console.log('MEDIA_SERVICE_URL absent: nothing switched'); process.exit(1); }
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, old, { mode: 0o600 });
  set('http://${{media-processing.RAILWAY_PRIVATE_DOMAIN}}:8080');
  console.log(`set; private now: ${isPrivate() ? 'yes' : 'no'}`);
} else if (cmd === 'rollback') {
  set(fs.readFileSync(backup, 'utf8'));
  console.log(`rolled back; private now: ${isPrivate() ? 'yes' : 'no'}`);
} else {
  console.log('usage: private|rollback <backup file>');
  process.exit(2);
}
