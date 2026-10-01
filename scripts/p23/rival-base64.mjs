// P23: how competitors show the Base64 of a 2 MB photo (full text in a field, or a cut preview + copy/download).
import { chromium } from '@playwright/test';
const file = process.argv[2];
const b = await chromium.launch();
for (const url of ['https://www.base64-image.de/', 'https://base64.guru/converter/encode/image']) {
  const p = await b.newPage();
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(3000);
    await p.locator('input[type=file]').first().setInputFiles(file); await p.waitForTimeout(12000);
    if (/guru/.test(url)) { await p.getByRole('button', { name: /encode image to base64/i }).first().click().catch(() => {}); await p.waitForTimeout(8000); }
    const fields = await p.locator('textarea, pre, code').evaluateAll((els) => els.map((e) => [e.tagName, (e.value ?? e.textContent ?? '').length]).filter(([, n]) => n > 100));
    const btns = (await p.locator('button:visible, a:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => /copy|download|show/i.test(t)).slice(0, 10);
    console.log(url, 'fields:', JSON.stringify(fields), 'buttons:', JSON.stringify(btns));
  } catch (e) { console.log(url, 'ERR', e.message.slice(0, 100)); }
  await p.close();
}
await b.close();
