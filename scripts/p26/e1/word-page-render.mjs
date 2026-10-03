// P26: PDF to Word page as published (no conversion: a real one would be a paid ConvertAPI call): the three
// formats, the .doc note, the button label, and no "4 MB" limit left on RTF.
//   node scripts/p26/e1/word-page-render.mjs <origin> <small.pdf> <big.pdf>
import { chromium } from '@playwright/test';
import { previewAuth } from '../preview-auth.mjs';
const [originArg, small, big] = process.argv.slice(2);
const origin = new URL(originArg).origin;
const b = await chromium.launch(); const ctx = await b.newContext();
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
await previewAuth(ctx, origin);
await ctx.route('**/api/**', (r) => r.abort()); // nothing sent to a route
let fails = 0; const check = (n, ok, i = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, i); };
const p = await ctx.newPage();
await p.goto(`${origin}/tools/pdf-tools/pdf-to-word`, { waitUntil: 'load' }); await p.waitForTimeout(800);
const formats = await p.locator('input[name=pw-format]').evaluateAll((els) => els.map((e) => e.value));
check('three formats offered', formats.join(',') === 'docx,doc,rtf', formats.join(','));
for (const [f, file] of [['doc', small], ['rtf', big], ['doc', big]]) {
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.locator(`input[name=pw-format][value=${f}]`).check();
  const btn = p.getByRole('button', { name: `Convert to .${f}` });
  check(`.${f} with ${file.split(/[\/]/).pop()}: button enabled`, await btn.isEnabled());
  if (f === 'doc') check('.doc note shown before sending', await p.locator('[data-doc-note]').isVisible());
}
check('no "RTF up to 4 MB" left', !(await p.locator('[data-rtf-limit]').count()));
await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
