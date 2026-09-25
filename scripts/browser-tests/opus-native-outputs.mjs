// Produces the Opus files the in-browser audio tools really hand out (ffmpeg.wasm native encoder), for the
// quality comparison against libopus (docs/audit/RAPPORT-licence-et-ameliorations.md §3c).
// Usage: node scripts/browser-tests/opus-native-outputs.mjs <origin> <outDir> <ref.wav>...
import { chromium } from '@playwright/test';
import path from 'node:path';
const [origin, outDir, ...refs] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
async function run(route, setup, tag, ref) {
  await page.goto(origin + route, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(ref);
  await page.locator('select:has(option[value=opus])').selectOption('opus');
  await setup();
  await page.getByRole('button', { name: /^(Compress|Boost)/ }).click();
  const link = page.getByRole('link', { name: 'Download' });
  await link.waitFor({ timeout: 180000 });
  const [dl] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const dest = path.join(outDir, `${path.basename(ref, '.wav')}-native-${tag}.opus`);
  await dl.saveAs(dest);
  console.log('saved', dest);
}
for (const ref of refs) {
  for (const kb of ['64', '96', '128']) await run('/tools/audio-tools/audio-compressor', () => page.getByRole('button', { name: kb + 'k', exact: true }).click(), kb, ref);
  await run('/tools/audio-tools/audio-booster', () => page.locator('input[type=range]').fill('1'), 'booster-default', ref);
}
await browser.close();
