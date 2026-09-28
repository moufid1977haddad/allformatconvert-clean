// PDF to Excel, one real conversion, what the page and /api/pdf-to-excel answer (28/09 diagnosis: a text-only PDF gave 502).
// Usage: node scripts/browser-tests/pdf-to-excel-probe.mjs <origin> <pdf>
import { chromium } from '@playwright/test';
const [origin, file] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const p = await ctx.newPage();
const api = [];
p.on('response', async (r) => { if (/\/api\//.test(r.url())) api.push(`${r.status()} ${new URL(r.url()).pathname} ${(await r.text().catch(() => '')).slice(0, 200)}`); });
await p.goto(origin + '/tools/pdf-tools/pdf-to-excel', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').first().setInputFiles(file);
await p.getByRole('button', { name: /Download \.xlsx|Convert to \.xlsx/ }).click();
const r = await Promise.race([p.waitForEvent('download').then((d) => 'download ' + d.suggestedFilename()), p.locator('a[data-download]').waitFor().then(() => 'button'), p.locator('[role=alert]:not(#__next-route-announcer__), p.text-red-500').waitFor().then(async () => 'error ' + (await p.locator('[role=alert]:not(#__next-route-announcer__), p.text-red-500').innerText()))].map((x) => x.catch(() => 'timeout')));
console.log(r); console.log(api.join('\n'));
await b.close();
