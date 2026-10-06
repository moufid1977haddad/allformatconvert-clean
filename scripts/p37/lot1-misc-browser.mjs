// P37 lot 1 (misc), what only a browser proves:
//   - Markdown Editor and Markdown Previewer: the rendered pane is styled (heading sizes, list bullets, table borders,
//     code background), in light and dark mode; a screenshot of each pane for a visual check.
//   - Color Picker: a code typed without "#" moves the preview and the browser swatch; an invalid code shows a message
//     and keeps the previous color.
// Usage: node scripts/p37/lot1-misc-browser.mjs <origin>      e.g. http://localhost:3000 (a local `next start`)
// Screenshots: scripts/p37/out/lot1-misc-*.png
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const originArg = process.argv[2];
if (!originArg) { console.error('usage: node scripts/p37/lot1-misc-browser.mjs <origin>'); process.exit(2); }
const origin = new URL(originArg).origin;
const outDir = path.join('scripts', 'p37', 'out');
fs.mkdirSync(outDir, { recursive: true });

let fails = 0, passes = 0;
const check = (name, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `-- ${info}`); };

const SAMPLE = [
  '# Title one', '', '## Title two', '', 'Some **bold**, *italic*, ~~gone~~ and `inline code` with a [link](https://example.com).', '',
  '- bullet a', '- bullet b', '  - nested', '', '1. first', '2. second', '', '- [x] done', '- [ ] to do', '',
  '> a quote', '', '```js', 'const x = 1;', '```', '', '| A | B |', '|---|---|', '| 1 | 2 |', '| 3 | 4 |', '', '---', '', 'End.',
].join('\n');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
// keep our own test traffic out of tool_errors (same cookie as the site's other robot runs)
await context.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const page = await context.newPage();

for (const tool of ['markdown-editor', 'markdown-previewer']) {
  await page.goto(`${origin}/tools/developer-tools/${tool}`, { waitUntil: 'networkidle' });
  await page.getByLabel('Markdown', { exact: true }).fill(SAMPLE);
  const pane = page.locator('label:text-is("Preview") + div');
  await pane.locator('table').waitFor();
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
    const st = await pane.evaluate((el) => {
      const cs = (sel, p) => getComputedStyle(el.querySelector(sel))[p];
      return {
        base: parseFloat(getComputedStyle(el).fontSize), h1: parseFloat(cs('h1', 'fontSize')), h2: parseFloat(cs('h2', 'fontSize')),
        ul: cs('ul', 'listStyleType'), ol: cs('ol', 'listStyleType'), td: cs('td', 'borderTopWidth'), codeBg: cs('p code', 'backgroundColor'),
        preBg: cs('pre', 'backgroundColor'), quote: cs('blockquote', 'borderLeftWidth'), a: cs('a', 'textDecorationLine'), color: getComputedStyle(el).color,
        bg: getComputedStyle(el).backgroundColor,
      };
    });
    const tag = `${tool} ${theme}`;
    check(`${tag}: h1 larger than h2 larger than text`, st.h1 > st.h2 && st.h2 > st.base, JSON.stringify(st));
    check(`${tag}: list bullets and numbers`, st.ul === 'disc' && st.ol === 'decimal', `${st.ul} / ${st.ol}`);
    check(`${tag}: table cell borders`, parseFloat(st.td) >= 1, st.td);
    check(`${tag}: code and pre backgrounds`, !/rgba\(0, 0, 0, 0\)|transparent/.test(st.codeBg) && !/rgba\(0, 0, 0, 0\)|transparent/.test(st.preBg), `${st.codeBg} / ${st.preBg}`);
    check(`${tag}: quote bar, underlined link`, parseFloat(st.quote) > 0 && st.a.includes('underline'), `${st.quote} / ${st.a}`);
    console.log(`      text ${st.color} on ${st.bg}`);
    await pane.screenshot({ path: path.join(outDir, `lot1-misc-${tool}-${theme}.png`) });
  }
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
}

await page.goto(`${origin}/tools/developer-tools/color-picker`, { waitUntil: 'networkidle' });
const input = page.getByLabel('Colour value (HEX)');
const swatch = page.getByLabel('Pick a colour');
const preview = page.locator('div.w-48.h-48');
const bg = () => preview.evaluate((el) => getComputedStyle(el).backgroundColor);
for (const [typed, rgb, sw] of [['ff0000', 'rgb(255, 0, 0)', '#ff0000'], ['0f0', 'rgb(0, 255, 0)', '#00ff00'], ['#0000ff80', 'rgba(0, 0, 255, 0.5', '#0000ff']]) {
  await input.fill(typed);
  const got = await bg();
  check(`color-picker: "${typed}" -> preview ${rgb}`, got.startsWith(rgb), got);
  check(`color-picker: "${typed}" -> swatch ${sw}`, (await swatch.inputValue()) === sw, await swatch.inputValue());
}
await input.fill('ff0000');
await input.fill('red');
check('color-picker: "red" shows a message', /Not a HEX color/.test(await page.locator('#hex-error').innerText()));
check('color-picker: "red" keeps the previous color', (await bg()) === 'rgb(255, 0, 0)', await bg());
await page.locator('div.max-w-2xl').first().screenshot({ path: path.join(outDir, 'lot1-misc-color-picker.png') });

await browser.close();
console.log(`\n${passes} passed, ${fails} failed; screenshots in ${outDir}`);
process.exit(fails ? 1 : 0);
