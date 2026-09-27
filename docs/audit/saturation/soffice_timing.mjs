// Local stand-in for Gotenberg's LibreOffice module (27/09/2026): Gotenberg runs ONE LibreOffice conversion at a time
// per instance (gotenberg.dev/docs/configuration: "a LibreOffice instance cannot execute parallel operations"), so an
// instance's Office capacity is 1 / (time of one conversion). This times one conversion of each fidelity fixture with
// the local LibreOffice, headless, warm (the first run of each is dropped), 3 runs each.
// Usage: node docs/audit/saturation/soffice_timing.mjs "<path to soffice.exe>"
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SOFFICE = process.argv[2];
const FIX = path.resolve('docs/audit/fixtures-fidelite');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'soffice-'));
const profile = 'file:///' + fs.mkdtempSync(path.join(os.tmpdir(), 'soffice-profile-')).replace(/\\/g, '/');
const conv = (f) => { const t = process.hrtime.bigint(); execFileSync(SOFFICE, [`-env:UserInstallation=${profile}`, '--headless', '--convert-to', 'pdf', '--outdir', out, path.join(FIX, f)], { stdio: 'ignore' }); return Number(process.hrtime.bigint() - t) / 1e9; };
conv('fidelite-01.docx'); // warm-up: profile creation, font cache
for (const f of fs.readdirSync(FIX).filter((x) => /\.(docx|xlsx|pptx)$/.test(x))) {
  const runs = [conv(f), conv(f), conv(f)].map((s) => +s.toFixed(2));
  console.log(f, (fs.statSync(path.join(FIX, f)).size / 1024).toFixed(0) + ' KB', 'seconds:', runs.join(' / '));
}
console.log('note: each run includes starting soffice (~1-2 s); Gotenberg keeps LibreOffice running, so this is an upper bound.');
