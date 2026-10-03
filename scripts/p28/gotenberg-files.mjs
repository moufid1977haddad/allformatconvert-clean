// P28: send any documents to one Gotenberg service's LibreOffice route and save the PDFs (same credentials handling as
// scripts/p27/gotenberg-compare.mjs: read from the Railway CLI, never printed or written).
//   node scripts/p28/gotenberg-files.mjs <railway-service> <out-dir> <file>...
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [svc, outDir, ...files] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const vars = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const base = `https://${vars.RAILWAY_PUBLIC_DOMAIN}`;
const auth = 'Basic ' + Buffer.from(`${vars.GOTENBERG_API_BASIC_AUTH_USERNAME}:${vars.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');
const version = await fetch(base + '/version', { headers: { Authorization: auth } }).then((r) => r.text());
console.log(`service ${svc} version ${version.trim()}`);
for (const f of files) {
  const fd = new FormData();
  fd.append('files', new Blob([fs.readFileSync(f)]), path.basename(f));
  const r = await fetch(base + '/forms/libreoffice/convert', { method: 'POST', headers: { Authorization: auth }, body: fd, signal: AbortSignal.timeout(240_000) });
  const body = Buffer.from(await r.arrayBuffer());
  const ok = r.status === 200 && body.subarray(0, 5).toString() === '%PDF-';
  if (ok) fs.writeFileSync(path.join(outDir, path.basename(f).replace(/\./g, '_') + '.pdf'), body);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path.basename(f)} ${r.status} ${body.length} bytes`);
}
