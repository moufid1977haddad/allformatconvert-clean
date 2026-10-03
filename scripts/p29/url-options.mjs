// P29 (04/10): the options /api/convert-url-to-pdf adds (one long page, scale, screen or print CSS, backgrounds), on
// snapshots from scripts/p29/url-snapshots.mjs, for one Gotenberg service; compare two runs with compare-pdfs.mjs.
//   node scripts/p29/url-options.mjs <railway-service> <snapshot-dir> <out-dir>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [svc, snaps, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const v = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const auth = 'Basic ' + Buffer.from(`${v.GOTENBERG_API_BASIC_AUTH_USERNAME}:${v.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');
const sets = {
  single: { singlePage: 'true', scale: '0.7', emulatedMediaType: 'screen', printBackground: 'true', preferCssPageSize: 'true' },
  print: { emulatedMediaType: 'print', scale: '1', printBackground: 'true', preferCssPageSize: 'true' },
};
for (const n of ['snap-wikipedia', 'snap-bbc', 'snap-govuk']) for (const [k, fields] of Object.entries(sets)) {
  const fd = new FormData();
  fd.append('files', new Blob([fs.readFileSync(path.join(snaps, `${n}.html`))]), 'index.html');
  for (const [a, b] of Object.entries(fields)) fd.append(a, b);
  const r = await fetch(`https://${v.RAILWAY_PUBLIC_DOMAIN}/forms/chromium/convert/html`, { method: 'POST', headers: { Authorization: auth }, body: fd, signal: AbortSignal.timeout(180_000) });
  const body = Buffer.from(await r.arrayBuffer());
  if (r.status === 200) fs.writeFileSync(path.join(out, `${n}-${k}.pdf`), body);
  console.log(r.status === 200 ? 'PASS' : 'FAIL', `${n}-${k}`, r.status, body.length);
}
