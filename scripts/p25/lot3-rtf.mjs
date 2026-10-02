// P25 (03/10), lot 3: PDF to Word in RTF (E1) on REAL PDFs — PAID (ConvertAPI, 0.01 $ a conversion): run it on a
// PREVIEW only, once (owner's test budget for E1: 0.05 $). Each .rtf is reopened in Microsoft Word (COM) and in
// LibreOffice (headless) and its text compared with the PDF's. Also: E3's whole-document mode is not offered while
// the service is not configured.
// Usage: node scripts/p25/lot3-rtf.mjs <origin> [--browser=chromium] [--no-paid]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
const paid = !process.argv.includes('--no-paid');
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p25-rtf-'));
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.route(/vercel\.live/, (r) => r.abort());

// Two real PDFs printed by Chromium: a 1-page report (heading, accents, a table) and a 3-page letter.
const maker = await chromium.launch(); const mp = await maker.newPage();
await mp.setContent('<html lang="fr"><body style="font-family:Arial;margin:2cm"><h1>Rapport trimestriel</h1><p>Le chiffre d\'affaires a progressé de 12 % — café, naïve, Straße.</p><table border="1"><tr><th>Région</th><th>Ventes</th></tr><tr><td>Europe</td><td>4,2 M</td></tr><tr><td>Amériques</td><td>6,8 M</td></tr></table></body></html>');
const pdf1 = path.join(dir, 'rapport.pdf'); await mp.pdf({ path: pdf1, format: 'A4' });
// 3 pages with different openings (an identical line at the top of every page is taken for a page header by the
// converter, measured 03/10: it goes to the RTF's header, as Word itself does with a running head)
const topics = ['Delivery terms and the schedule agreed', 'Payment, invoices and late fees', 'Warranty, returns and contact details'];
await mp.setContent(`<html><body style="font-family:Georgia;margin:2.5cm">${topics.map((t, i) => `<h2>${i + 1}. ${t}</h2><p>` + Array.from({ length: 30 }, (_, k) => `Clause ${i + 1}.${k + 1} describes ${t.toLowerCase().split(' ')[0]} in detail for this agreement.`).join(' ') + '</p><div style="page-break-after:always"></div>').join('')}</body></html>`);
const pdf2 = path.join(dir, 'letter.pdf'); await mp.pdf({ path: pdf2, format: 'Letter' });
await maker.close();

const wordText = (file) => execFileSync('powershell', ['-NoProfile', '-Command',
  `[Console]::OutputEncoding = [Text.Encoding]::UTF8; $w = New-Object -ComObject Word.Application; $w.Visible = $false; try { $d = $w.Documents.Open('${file.replace(/'/g, "''")}', $false, $true); "TABLES=" + $d.Tables.Count; $d.Content.Text; $d.Close($false) } finally { $w.Quit() }`], { encoding: 'utf8' });
const loText = (file) => {
  const out = path.join(dir, 'lo'); fs.mkdirSync(out, { recursive: true });
  execFileSync('C:/Program Files/LibreOffice/program/soffice.exe', ['--headless', '--convert-to', 'txt:Text (encoded):UTF8', '--outdir', out, file], { stdio: 'ignore' });
  return fs.readFileSync(path.join(out, path.basename(file).replace(/\.rtf$/, '.txt')), 'utf8');
};

{ // the RTF choice is on the page; E3's mode is not offered without its service
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-to-word`, { waitUntil: 'load' });
  check('pdf-to-word: RTF offered next to DOCX', (await p.getByRole('radio', { name: /Rich Text \(\.rtf\)/ }).count()) === 1);
  await p.goto(`${origin}/tools/pdf-tools/pdf-translate`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const avail = await p.evaluate(() => fetch('/api/pdf-translate-document').then((r) => r.json()));
  check('pdf-translate: whole-document mode hidden while the service is not configured (GET says so)', avail.available === false && (await p.getByRole('radio', { name: /Whole PDF/ }).count()) === 0, JSON.stringify(avail));
  await p.close();
}
if (paid) {
  const cases = [[pdf1, ['Rapport trimestriel', 'naïve', 'Straße', 'Amériques']], [pdf2, ['1. Delivery terms', '2. Payment, invoices', '3. Warranty, returns', 'Clause 3.30']]];
  for (const [pdf, expect] of (process.argv.includes('--only-letter') ? cases.slice(1) : cases)) {
    const p = await ctx.newPage();
    await p.goto(`${origin}/tools/pdf-tools/pdf-to-word`, { waitUntil: 'load' });
    await p.locator('input[type=file]').setInputFiles(pdf);
    await p.getByRole('radio', { name: /Rich Text/ }).check();
    await p.getByRole('button', { name: 'Convert to .rtf' }).click();
    const link = p.locator('a[data-download]').first();
    const ok = await Promise.race([link.waitFor({ timeout: 180000 }).then(() => true), p.locator('p[role=alert]').first().waitFor({ timeout: 180000 }).then(() => false)]).catch(() => false);
    if (!ok) { check(`RTF of ${path.basename(pdf)}`, false, await p.locator('p[role=alert]').first().innerText().catch(() => 'timeout')); await p.close(); continue; }
    const dl = p.waitForEvent('download'); await link.click(); const d = await dl;
    const out = path.join(dir, d.suggestedFilename()); await d.saveAs(out);
    const head = fs.readFileSync(out).subarray(0, 5).toString('latin1');
    // Word makes "1. …" a real numbered list: the number is not part of its text
    const w = wordText(out); const lo = loText(out);
    const missingW = expect.filter((x) => !w.includes(x.replace(/^\d+\. /, ''))); const missingL = expect.filter((x) => !lo.includes(x));
    check(`RTF of ${path.basename(pdf)}: named .rtf, starts {\\rtf, reopened in Word and LibreOffice with its text${pdf === pdf1 ? ' and its table' : ''}`,
      /\.rtf$/.test(d.suggestedFilename()) && head === '{\\rtf' && !missingW.length && !missingL.length && (pdf !== pdf1 || /TABLES=[1-9]/.test(w)),
      `${d.suggestedFilename()} ${fs.statSync(out).size} B; Word missing [${missingW}] ${w.match(/TABLES=\d+/)}; LibreOffice missing [${missingL}]`);
    await p.close();
  }
}
await b.close();
console.log(`${name}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
