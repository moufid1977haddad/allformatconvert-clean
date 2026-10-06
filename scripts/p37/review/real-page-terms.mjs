// P37 review n° 4: several terms (one per line) on the REAL page, then pdftotext of the result for each term.
//   node scripts/p37/review/real-page-terms.mjs <origin> <pdf> "<term1>|<term2>" [--browser=chromium|webkit]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [origin, pdf, termsArg] = args;
const engine = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const terms = termsArg.split('|');
const N = (s) => s.normalize('NFKC').replace(/[ً-ٰٟـ‎‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, '').toLowerCase();
const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
await p.goto(`${new URL(origin).origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
await p.waitForTimeout(500);
await p.locator('input[type=file]').first().setInputFiles(pdf);
await p.locator('#rd-terms').fill(terms.join('\n'));
await p.getByRole('button', { name: 'Redact PDF' }).click();
await p.waitForSelector('[data-summary], p[role=alert]', { timeout: 180000 });
const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
if (alert) console.log(`${engine}: ALERT ${alert.slice(0, 200)}`);
else {
  const out = path.join(os.tmpdir(), 'p37-review-redact', `real-terms-${engine}-${path.basename(pdf)}`);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
  await dl.saveAs(out);
  const txt = execFileSync('pdftotext', ['-enc', 'UTF-8', out, '-']).toString();
  console.log(`${engine}: summary: ${(await p.locator("[data-summary]").innerText()).slice(0, 2000)}`);
  for (const t of terms) console.log(`  ${t}: pdftotext ${N(txt).includes(N(t)) ? 'LEAK' : 'absent'}`);
}
await b.close();
