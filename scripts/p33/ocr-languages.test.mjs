// P33 (05/10) — every language PDF OCR offers must exist on the server fallback (owner's brief: "Toutes les langues
// proposées dans la liste doivent exister côté serveur"). Checks lib/ocrLanguageCodes.js against
//   1. services/pdf-tools/Dockerfile: one Debian package tesseract-ocr-<code> per code (Debian bookworm's tesseract-lang
//      1:4.1.0-2 builds all of them; read on packages.debian.org 05/10), and no package for a code the site lacks;
//   2. optionally a running service's /health "ocrLanguages" (the models really installed), when a URL is given.
//   node scripts/p33/ocr-languages.test.mjs [<pdf-tools base url>]   (the URL's /health needs no key)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { LANGUAGES } = require(path.join(ROOT, 'lib', 'ocrLanguageCodes.js'));
let failures = 0, passes = 0;
const check = (name, ok, extra = '') => { if (ok) passes++; else failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

const site = new Set(LANGUAGES.map((l) => l.code));
const docker = fs.readFileSync(path.join(ROOT, 'services', 'pdf-tools', 'Dockerfile'), 'utf8');
const pkgs = new Set([...docker.matchAll(/\btesseract-ocr-([a-z]+(?:-[a-z]+)?)\b/g)].map((m) => m[1].replace(/-/g, '_')));
const missing = [...site].filter((c) => !pkgs.has(c));
const extra = [...pkgs].filter((c) => !site.has(c));
check(`Dockerfile installs a model for each of the ${site.size} site languages`, missing.length === 0, missing.join(', '));
check('Dockerfile installs no model the site does not offer', extra.length === 0, extra.join(', '));
check('Dockerfile checks the installed count at build time', new RegExp(`-ge ${site.size}\\b`).test(docker));

const url = process.argv[2];
if (url) {
  const h = await (await fetch(`${url.replace(/\/+$/, '')}/health`)).json();
  const installed = new Set(h.ocrLanguages || []);
  const notThere = [...site].filter((c) => !installed.has(c));
  check(`${url}/health: tesseract ${h.binaries?.tesseract?.version || '?'}, ${installed.size} models; every site language installed`, h.binaries?.tesseract?.ok && notThere.length === 0, notThere.join(', '));
}
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
