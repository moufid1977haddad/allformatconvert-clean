// P32 (04/10) — FAL_KEY for the BRIA bench, read from .env.local INSIDE the process: the value is never printed,
// logged or written anywhere. `node scripts/p32/fal-env.mjs` only says whether the NAME exists with a value.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function falKey() {
  if (process.env.FAL_KEY) return process.env.FAL_KEY;
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return '';
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?FAL_KEY\s*=\s*(.*)$/.exec(line);
    if (m) return m[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return '';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`FAL_KEY in .env.local: ${falKey() ? 'present (value not shown)' : 'ABSENT'}`);
}
