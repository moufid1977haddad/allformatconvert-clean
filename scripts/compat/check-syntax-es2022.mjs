// Parses every client script of the build (.next/static) and public/ as ES2022 — the language level Safari 16.4 /
// iOS 16.4 fully supports. A script that only parses with a later version uses syntax those Safaris reject (RegExp
// `v` flag, import attributes, `using`, …): the whole file would fail to load there.
// Usage: node scripts/compat/check-syntax-es2022.mjs   (exit 1 on any such file)
import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.m?js$/.test(e.name)) yield p;
  }
}

const parse = (src, ecmaVersion, sourceType) => acorn.parse(src, { ecmaVersion, sourceType, allowHashBang: true, allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true });
let bad = 0, n = 0;
for (const root of ['.next/static', 'public']) for (const file of walk(root)) {
  n++;
  const src = fs.readFileSync(file, 'utf8');
  let err = null;
  for (const st of ['module', 'script']) { try { parse(src, 2022, st); err = null; break; } catch (e) { err = err || e; } }
  if (!err) continue;
  let later = false;
  for (const st of ['module', 'script']) { try { parse(src, 'latest', st); later = true; break; } catch {} }
  if (later) { bad++; console.log(`ES2023+ syntax: ${file} — ${err.message} …${src.slice(Math.max(0, err.pos - 80), err.pos + 60).replace(/\s+/g, ' ')}…`); }
  else console.log(`unparsable even as latest (not JS for the browser?): ${file} — ${err.message}`);
}
console.log(`${n} files, ${bad} with syntax newer than ES2022`);
process.exit(bad ? 1 : 0);
