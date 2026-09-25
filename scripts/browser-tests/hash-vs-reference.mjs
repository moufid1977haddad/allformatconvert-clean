// Same file, same algorithms (MD5, SHA-1, SHA-256, SHA-512, CRC32), same browser: time from click to results on
// our Hash Generator and on the reference (html-code-generator.com file hash generator), results checked equal.
// Usage: node scripts/browser-tests/hash-vs-reference.mjs <our origin or _vercel_share URL> <file> [--browser=firefox] [--ours-only]
import { chromium, firefox } from '@playwright/test';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [entry, file] = args; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch();
const ours = async () => {
  const page = await (await b.newContext()).newPage();
  if (entry.includes('_vercel_share')) await page.goto(entry);
  await page.goto(origin + '/tools/developer-tools/hash-generator', { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: 'Files' }).click();
  await page.getByRole('button', { name: 'Defaults' }).click();
  const t0 = Date.now(); // from the file choice, like the reference (which starts on its own)
  await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('button', { name: /^Hash 1 file$/ }).click();
  await page.getByRole('button', { name: 'Download checksums.txt' }).waitFor({ timeout: 1800000 });
  const secs = (Date.now() - t0) / 1000;
  const v = Object.fromEntries(await page.locator('[data-algorithm]').evaluateAll((els) => els.map((e) => [e.dataset.algorithm, e.textContent])));
  await page.context().close();
  return { secs, sha256: v.sha256, md5: v.md5 };
};
const theirs = async () => {
  const page = await (await b.newContext()).newPage();
  await page.goto('https://www.html-code-generator.com/tools/file-hash-generator', { waitUntil: 'load' });
  for (const id of ['algsa', 'algsb', 'algsd', 'algsg', 'algsh']) await page.locator('#' + id).check({ force: true });
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#drop_single').click()]);
  // With algorithms ticked, the reference starts hashing as soon as the file is chosen: time from there.
  const t0 = Date.now();
  await fc.setFiles(file);
  await page.waitForTimeout(300);
  if (!/loading|%/.test(await page.locator('#drop_single').evaluate((e) => e.parentElement.parentElement.innerText))) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Generate Hash').click()); // ads can overlay it
  }
  // done when an MD5 (32 hex) and a SHA-512 (128 hex) are both on the page
  const results = () => document.querySelector('#drop_single').parentElement.parentElement.innerText.split('Hash Value')[1] || '';
  await page.waitForFunction(`(${results})().includes('CRC32:') && /\\b[0-9a-f]{128}\\b/i.test((${results})())`, null, { timeout: 1800000, polling: 100 });
  const secs = (Date.now() - t0) / 1000;
  const t = await page.evaluate(`(${results})()`);
  await page.context().close();
  return { secs, sha256: (t.match(/\b[0-9a-f]{64}\b/gi) || [])[0]?.toLowerCase(), md5: (t.match(/\b[0-9a-f]{32}\b/gi) || [])[0]?.toLowerCase() };
};
// --ours-only / --theirs-only: one side per browser process (on a 760 MiB file, running both in one browser stalled the reference)
const a = process.argv.includes('--theirs-only') ? null : await ours(); if (a) console.log('ours     ', engine.name(), a.secs.toFixed(1), 's', a.sha256);
if (!process.argv.includes('--ours-only')) { const c = await theirs(); console.log('reference', engine.name(), c.secs.toFixed(1), 's', c.sha256, a ? (c.sha256 === a.sha256 ? '(same SHA-256)' : '(DIFFERENT SHA-256)') : ''); }
await b.close();
