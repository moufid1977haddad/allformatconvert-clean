// P29 (04/10): one real conversion each for the two other tools printed by Gotenberg's Chromium: Markdown to PDF
// (a .md file) and Text to PDF on its renderer path (emoji), through the pages as a visitor; text of the PDF checked.
//   node scripts/p29/md-text-www.mjs <origin> <out-dir>
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [o, out] = process.argv.slice(2); const origin = new URL(o).origin; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
let fail = 0;
async function run(name, url, fill, expect) {
  const p = await ctx.newPage();
  await p.goto(origin + url, { waitUntil: 'load' }); await p.waitForTimeout(800);
  await fill(p);
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const a = p.locator('[data-file-download] [data-download], a[download]').first();
  const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  let text = '';
  if (ok) {
    const b64 = await a.evaluate(async (el) => { const r = await fetch(el.href); const u = new Uint8Array(await r.arrayBuffer()); let s = ''; for (const x of u) s += String.fromCharCode(x); return btoa(s); });
    const f = path.join(out, `${name}.pdf`); fs.writeFileSync(f, Buffer.from(b64, 'base64'));
    text = execFileSync('pdftotext', [f, '-'], { encoding: 'utf8' });
  }
  const good = ok && expect.test(text); if (!good) fail++;
  console.log(good ? 'PASS' : 'FAIL', name, ok ? text.replace(/\s+/g, ' ').slice(0, 80) : 'no PDF');
  await p.close();
}
await run('markdown', '/tools/pdf-tools/markdown-to-pdf', (p) => p.locator('input[type=file]').first().setInputFiles({ name: 'p29.md', mimeType: 'text/markdown', buffer: Buffer.from('# P29 Markdown\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n\n```js\nconst x = 1;\n```\n') }), /P29 Markdown[\s\S]*const x = 1/);
await run('text-emoji', '/tools/pdf-tools/text-to-pdf', (p) => p.locator('textarea').first().fill('P29 text with emoji 😀 and Bengali বাংলা'), /P29 text with emoji/);
await b.close(); console.log(fail ? `md-text-www: ${fail} FAIL` : 'md-text-www: ALL PASS'); process.exit(fail ? 1 : 0);
