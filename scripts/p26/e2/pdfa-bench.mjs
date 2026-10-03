// P26 E2: every PDF of <dir> through /v1/pdfa of a pdf-tools service at every level, with and without downgrade.
// Each returned file is re-validated HERE by an independent veraPDF run (not the service's own report) against the
// level the service says it delivered, and for an "a" level its structure tree is checked to be present.
//   node scripts/p26/e2/pdfa-bench.mjs <service-url> <api-key-env-name> <dir> <verapdf.bat> [--levels=2u,3a]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [url, keyEnv, dir, vera] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const levels = (process.argv.find((a) => a.startsWith('--levels='))?.split('=')[1] || '1b,2b,3b,2u,3u,2a,3a').split(',');
const key = process.env[keyEnv];
if (!key) { console.error(`set ${keyEnv}`); process.exit(2); }
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });

function veraCheck(file, level) {
  let stdout = '';
  try { stdout = execFileSync('cmd', ['/c', vera, '-f', level, '--format', 'json', file], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
  catch (e) { stdout = e.stdout || ''; }
  try {
    const j = JSON.parse(stdout).report.jobs[0];
    const v = Array.isArray(j.validationResult) ? j.validationResult[0] : j.validationResult;
    return v.compliant === true;
  } catch { return false; }
}
// Text as pdftotext (poppler, independent of the service's Ghostscript) reads it, as a word list.
const words = (f) => { try { return execFileSync('pdftotext', [f, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 }).split(/\s+/).filter(Boolean); } catch { return null; } };
const inspect = (f) => JSON.parse(execFileSync('python', ['services/pdf-tools/py/pdfa_fix.py', 'inspect', f], { encoding: 'utf8' }));

let pass = 0, fail = 0;
for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.pdf')).sort()) {
  const src = path.join(dir, name);
  const tagged = inspect(src).tagged;
  for (const level of levels) {
    for (const allowDowngrade of level[1] === 'b' ? [false] : [false, true]) {
      const fd = new FormData();
      fd.append('file', new Blob([fs.readFileSync(src)]), name);
      fd.append('conformance', level);
      if (allowDowngrade) fd.append('allowDowngrade', 'true');
      const t0 = Date.now();
      // one retry: on Windows, undici sometimes aborts the write on a reused keep-alive socket (ECONNABORTED)
      const send = () => fetch(`${url}/v1/pdfa`, { method: 'POST', headers: { 'X-API-Key': key, Connection: 'close' }, body: fd });
      const r = await send().catch(() => send());
      const j = await r.json().catch(() => ({}));
      const ms = Date.now() - t0;
      let line = `${name} ${level}${allowDowngrade ? '+down' : ''} -> ${r.status}`;
      let ok;
      if (r.status === 200 && j.file) {
        const f = path.join(out, `${name.replace(/\.pdf$/, '')}-${level}${allowDowngrade ? 'd' : ''}-got-${j.conformance}.pdf`);
        fs.writeFileSync(f, Buffer.from(j.file, 'base64'));
        const valid = veraCheck(f, j.conformance);
        const structure = inspect(f).tagged;
        // delivered level must be the requested one unless downgrade was allowed, and must be independently valid;
        // an "a" level must keep the structure tree.
        // a "u" or "a" file must carry the source's text, word for word (that is what those levels promise)
        let textSame = true;
        if (j.conformance[1] !== 'b') { const a = words(src), b2 = words(f); textSame = !!a && !!b2 && a.join(' ') === b2.join(' '); }
        ok = valid && textSame && (j.conformance === level || (allowDowngrade && j.downgraded === true)) && (j.conformance[1] !== 'a' || structure);
        line += `${textSame ? '' : ' TEXT CHANGED'} got ${j.conformance}${j.downgraded ? ' (downgraded: ' + j.attempts.map((a) => a.conformance + ' ' + a.reason).join(', ') + ')' : ''} | own veraPDF ${valid ? 'valid' : 'INVALID'} | structure ${structure}`;
      } else {
        // a refusal is right only when no downgrade was allowed (or the file cannot be PDF/A at all) and is explained
        ok = r.status === 422 && !!j.error;
        line += ` refused: ${(j.error || '').slice(0, 90)}${j.attempts ? ' [' + j.attempts.map((a) => a.conformance + ' ' + a.reason).join(', ') + ']' : ''}`;
        if (level[1] === 'a' && !tagged && !j.untagged) { ok = false; line += ' (untagged not said)'; }
      }
      ok ? pass++ : fail++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${line} ${ms} ms`);
    }
  }
}
console.log(`pdfa-bench: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
