// Wave 1, paid calls: Background Remover (self-hosted IS-Net service, quota-accounted) and Grammar Fixer
// (OpenAI). Run against a PREVIEW only (interdit permanent n° 8): AUDIT_BASE=<preview origin>
// AUDIT_SHARE_URL=<_vercel_share link>. One call per scenario.
import fs from 'node:fs';
import path from 'node:path';
import { openBrowser, openTool, upload, download, sniff, fx, OUT } from './lib.mjs';

const results = [];
const { browser, ctx } = await openBrowser();

async function scenario(name, fn) {
  const t0 = Date.now();
  try { results.push({ scenario: name, secs: +((Date.now() - t0) / 1000).toFixed(1), ...(await fn()) }); }
  catch (e) { results.push({ scenario: name, exception: String(e).slice(0, 300) }); }
  results.at(-1).secs = +((Date.now() - t0) / 1000).toFixed(1);
  console.log(JSON.stringify(results.at(-1)));
}

for (const src of ['01_portrait_cheveux.jpg', '06_produit_fond_blanc.jpg']) {
  await scenario(`background-remover:${src}`, async () => {
    const { page, errors } = await openTool(ctx, '/tools/ai-tools/background-remover');
    await upload(page, fx(src));
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /Remove Background/i }).click();
    const link = page.locator('a[download]');
    await link.waitFor({ timeout: 120000 });
    const dl = await download(page, link, `bg-${src}`);
    return { dl, kind: sniff(dl.dest), errors };
  });
}

await scenario('grammar-fixer', async () => {
  const { page, errors } = await openTool(ctx, '/tools/ai-tools/grammar-fixer');
  const input = "Their going to the libary tomorow, but me and him doesnt no if it's open. The informations was wrong yesterday, and we should of checked before.";
  await page.locator('textarea').first().fill(input);
  await page.getByRole('button', { name: /Fix/i }).first().click();
  await page.waitForFunction(() => [...document.querySelectorAll('textarea')].some((t, i) => i > 0 && t.value.length > 20) || document.querySelector('.text-red-400, .text-red-500'), null, { timeout: 90000 });
  const out = await page.evaluate(() => [...document.querySelectorAll('textarea')].slice(1).map((t) => t.value).join('\n'));
  return { input, out, errors };
});

fs.writeFileSync(path.join(OUT, 'wave1-paid-results.json'), JSON.stringify(results, null, 2));
await browser.close();
