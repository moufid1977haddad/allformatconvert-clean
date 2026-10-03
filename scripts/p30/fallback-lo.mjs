// P30: what the Word to PDF backup produces -- each .docx sent to a Gotenberg service on Railway exactly as
// app/api/convert-to-pdf/route.ts sends it (POST /forms/libreoffice/convert, one "files" part, no option). Free (our
// own service). Credentials from the Railway CLI (the owner's login), kept in this process: never printed or written.
//   node scripts/p30/fallback-lo.mjs <railway-service> <out-dir> <file.docx>...
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [svc, out, ...files] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const vars = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const base = `https://${vars.RAILWAY_PUBLIC_DOMAIN}`;
const auth = 'Basic ' + Buffer.from(`${vars.GOTENBERG_API_BASIC_AUTH_USERNAME}:${vars.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');
for (const f of files) {
  const fd = new FormData();
  fd.append('files', new Blob([fs.readFileSync(f)]), path.basename(f));
  const t = Date.now();
  const r = await fetch(`${base}/forms/libreoffice/convert`, { method: 'POST', headers: { Authorization: auth }, body: fd, signal: AbortSignal.timeout(240_000) });
  const body = Buffer.from(await r.arrayBuffer());
  const ok = r.ok && body.subarray(0, 5).toString() === '%PDF-';
  if (ok) fs.writeFileSync(path.join(out, path.basename(f, '.docx') + '.pdf'), body);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path.basename(f)} HTTP ${r.status} ${body.length} bytes ${Date.now() - t} ms`);
}
