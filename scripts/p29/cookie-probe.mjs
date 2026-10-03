// P29 (04/10): does a cookie set while printing one visitor's HTML reach the next conversion? Conversion 1 loads a
// public URL that sets a cookie; conversion 2 frames a public page that shows the cookies it received.
//   node scripts/p29/cookie-probe.mjs <railway-service> <out-dir>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [svc, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const v = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'variables', '--service', svc, '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const auth = 'Basic ' + Buffer.from(`${v.GOTENBERG_API_BASIC_AUTH_USERNAME}:${v.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');
const tag = `p29c${Date.now() % 100000}`;
async function conv(name, html) {
  const fd = new FormData();
  fd.append('files', new Blob([html]), 'index.html');
  fd.append('waitDelay', '2s');
  const r = await fetch(`https://${v.RAILWAY_PUBLIC_DOMAIN}/forms/chromium/convert/html`, { method: 'POST', headers: { Authorization: auth }, body: fd, signal: AbortSignal.timeout(120_000) });
  const f = path.join(out, `${name}.pdf`);
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  return r.status === 200 ? execFileSync('pdftotext', [f, '-'], { encoding: 'utf8' }) : `HTTP ${r.status}`;
}
await conv('set', `<!doctype html><body><p>set</p><iframe src="https://httpbin.org/cookies/set?${tag}=1" width="500" height="200"></iframe></body>`);
const t = await conv('read', `<!doctype html><body><p>read</p><iframe src="https://httpbin.org/cookies" width="500" height="200"></iframe></body>`);
console.log(`${svc}: cookie of the previous conversion ${t.includes(tag) ? 'SENT AGAIN' : 'not sent'} | ${t.replace(/\s+/g, ' ').slice(0, 120)}`);
