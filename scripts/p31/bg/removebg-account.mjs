// P31 (03/10) — remove.bg account state (free endpoint, no credit used): are there credits / free API previews left?
// The key is read from .env.local and never printed.
import fs from 'node:fs';

export function envKey(name, file = process.env.ENV_FILE || '.env.local') {
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((x) => x.startsWith(name + '='));
  if (!line) return null;
  let v = line.slice(name.length + 1).trim();
  if (/^["']/.test(v)) v = v.slice(1, -1);
  return v || null;
}

if (process.argv[1] && process.argv[1].endsWith('removebg-account.mjs')) {
  const k = envKey('REMOVEBG_API_KEY');
  console.log('REMOVEBG_API_KEY present:', !!k);
  if (k) {
    const r = await fetch('https://api.remove.bg/v1.0/account', { headers: { 'X-Api-Key': k } });
    console.log(r.status, await r.text());
  }
}
