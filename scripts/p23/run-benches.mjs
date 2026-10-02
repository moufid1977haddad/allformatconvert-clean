// P23: runs a list of browser benches one after another against one origin, a log per bench, then a summary table
// (passes, fails, last line) — the table that goes into the report. The Vercel toolbar is cut on every bench
// (absent on www, it throws under WebKit on previews).
// Usage: node scripts/p23/run-benches.mjs <origin> <outDir> <lane>   lane = robust | rest | www
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const [origin, out, lane] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const B = 'scripts/browser-tests/';
const T = '--no-vercel-toolbar';
const LANES = {
  robust: [
    ['robust-chromium', B + 'p21-robustness.mjs', origin, '--browser=chromium', T],
    ['robust-firefox', B + 'p21-robustness.mjs', origin, '--browser=firefox', T],
    ['robust-webkit', B + 'p21-robustness.mjs', origin, '--browser=webkit', T],
  ],
  rest: [
    ['dg-chromium', B + 'download-guard.mjs', origin, '--browser=chromium', T],
    ['dg-firefox', B + 'download-guard.mjs', origin, '--browser=firefox', T],
    ['dg-webkit', B + 'download-guard.mjs', origin, '--browser=webkit', T],
    ['dg-chromium-iphone', B + 'download-guard.mjs', origin, '--browser=chromium', '--device=iphone', T],
    ['dg-webkit-iphone', B + 'download-guard.mjs', origin, '--browser=webkit', '--device=iphone', T],
    ['dg-webkit-ipad', B + 'download-guard.mjs', origin, '--browser=webkit', '--device=ipad', T],
    ['layout-chromium', B + 'p21-layout.mjs', origin, '--browser=chromium', '--device=both', T],
    ['layout-webkit', B + 'p21-layout.mjs', origin, '--browser=webkit', '--device=both', T],
    ['pages-chromium', B + 'all-pages-load.mjs', origin, '--browser=chromium', T],
    ['pages-firefox', B + 'all-pages-load.mjs', origin, '--browser=firefox', T],
    ['pages-webkit', B + 'all-pages-load.mjs', origin, '--browser=webkit', T],
    ['pages-webkit-safari16', B + 'all-pages-load.mjs', origin, '--browser=webkit', '--safari16', T],
    ['raw-chromium', B + 'p22-raw.mjs', origin, '--browser=chromium', T],
    ['raw-firefox', B + 'p22-raw.mjs', origin, '--browser=firefox', T],
    ['raw-webkit', B + 'p22-raw.mjs', origin, '--browser=webkit', T],
    ['raw-chromium-iphone', B + 'p22-raw.mjs', origin, '--browser=chromium', '--device=iphone', T],
    ['raw-chromium-ipad', B + 'p22-raw.mjs', origin, '--browser=chromium', '--device=ipad', T],
    ['raw-webkit-iphone', B + 'p22-raw.mjs', origin, '--browser=webkit', '--device=iphone', T],
    ['raw-webkit-ipad', B + 'p22-raw.mjs', origin, '--browser=webkit', '--device=ipad', T],
    ['psd-chromium', B + 'p21-psd.mjs', origin, '--browser=chromium', T],
    ['psd-firefox', B + 'p21-psd.mjs', origin, '--browser=firefox', T],
    ['big-chromium-iphone', B + 'big-image.mjs', origin, '--device=iphone', '--sizes=12,24,48', '--only=jpg,png,webp', T],
    ['big-firefox-iphone', B + 'big-image.mjs', origin, '--browser=firefox', '--device=iphone', '--sizes=12,24', '--only=jpg,png', T],
    ['big-chromium-ipad-bands', B + 'big-image.mjs', origin, '--device=ipad', '--bands', '--sizes=12,48,20', '--only=jpg,png,pdf', T],
  ],
};
LANES.www = [...LANES.rest.filter(([n]) => /^(dg-|pages-chromium|pages-firefox|pages-webkit$|raw-chromium$|raw-webkit-iphone|big-chromium-iphone)/.test(n)), ...LANES.robust];
const rows = [];
for (const [name, ...args] of LANES[lane]) {
  const log = path.join(out, `${name}.log`);
  const t0 = Date.now();
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, args, { stdio: ['ignore', fs.openSync(log, 'w'), fs.openSync(log, 'a')] });
    p.on('exit', resolve);
  });
  const text = fs.readFileSync(log, 'utf8');
  const pass = (text.match(/^PASS/gm) || []).length, fail = (text.match(/^FAIL/gm) || []).length;
  const last = text.trim().split('\n').pop().slice(0, 140);
  rows.push({ name, pass, fail, code, min: ((Date.now() - t0) / 60000).toFixed(1), last });
  console.log(`${name}\t${pass}\t${fail}\texit ${code}\t${rows.at(-1).min} min\t${last}`);
}
fs.writeFileSync(path.join(out, `summary-${lane}.md`), ['| Banc | Réussis | Échecs | Fin | Dernière ligne |', '|---|---|---|---|---|', ...rows.map((r) => `| ${r.name} | ${r.pass} | ${r.fail} | ${r.code} | ${r.last.replace(/\|/g, '/')} |`)].join('\n') + '\n');
