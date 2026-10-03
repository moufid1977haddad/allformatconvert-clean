// P26 E1 — LOCAL BENCH ONLY: run a command (next build / next start) with what the site needs to stage large files
// on our REAL media service (and to reach our real pdf-tools): public URLs, and the secrets read from Railway through the owner's logged-in
// CLI and handed to the child process in memory -- never printed, never written to a file. The rate-limit settings
// below are local test values (the site's own production values live in Vercel and are not touched).
//   node scripts/p26/e1/with-media-env.mjs <command> [args...]
import { execFileSync, spawnSync } from 'node:child_process';

const [cmd, ...args] = process.argv.slice(2);
const vars = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', 'media-processing', '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
if (!vars.MEDIA_TICKET_SECRET) { console.error('media service has no MEDIA_TICKET_SECRET'); process.exit(2); }
// pdf-tools (PDF/A, .doc): its public URL and one of its own API keys, the same way, in memory only.
const pt = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', 'pdf-tools', '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const ptKey = Object.keys(JSON.parse(pt.API_KEYS || '{}'))[0];
if (!ptKey) { console.error('pdf-tools has no API key'); process.exit(2); }
const env = {
  ...process.env,
  NEXT_PUBLIC_MEDIA_SERVICE_URL: `https://${vars.RAILWAY_PUBLIC_DOMAIN}`,
  MEDIA_TICKET_SECRET: vars.MEDIA_TICKET_SECRET,
  MEDIA_TICKET_MAX_BYTES: vars.MEDIA_MAX_FILE_BYTES || String(2 * 1024 ** 3),
  MEDIA_JOBS_PER_HOUR_PER_IP: '20',
  MEDIA_JOBS_PER_DAY_PER_IP: '100',
  PDFTOOLS_SERVICE_URL: `https://${pt.RAILWAY_PUBLIC_DOMAIN}`,
  PDFTOOLS_API_KEY: ptKey,
  // PDF to Word on, with a placeholder token: fake-providers.mjs answers for ConvertAPI, which is never reached.
  ...(process.env.FAKE_CONVERTAPI_DOCX ? { PDF_TO_WORD_CONVERTAPI_ENABLED: 'true', CONVERTAPI_TOKEN: 'local-bench-fake' } : {}),
};
const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: true });
process.exit(r.status ?? 1);
