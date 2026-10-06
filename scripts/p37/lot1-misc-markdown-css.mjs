// P37 lot 1, item 3, without the Next server: marked's real output for a sample, styled by
// app/components/markdownPreview.module.css (":global(.dark)" read as ".dark", the class name kept as "preview"),
// with Tailwind's preflight reset emulated for the elements involved. Before = no stylesheet (what "prose" without
// @tailwindcss/typography gives). Run: node scripts/p37/lot1-misc-markdown-css.mjs [before]
import { chromium } from '@playwright/test';
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';

const before = process.argv[2] === 'before';
const css = before ? '' : fs.readFileSync('app/components/markdownPreview.module.css', 'utf8').replace(/:global\(\.dark\)/g, '.dark');
// Tailwind v4 preflight, the parts that matter here
const preflight = '*,::before,::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}ol,ul,menu{list-style:none}a{color:inherit;text-decoration:inherit}table{border-collapse:collapse}code,pre{font-family:monospace;font-size:1em}';
const md = ['# Title one', '', '## Title two', '', 'Some **bold** and `inline code` with a [link](https://example.com).', '', '- bullet a', '- bullet b', '', '1. first', '2. second', '', '- [x] done', '- [ ] to do', '', '> a quote', '', '```js', 'const x = 1;', '```', '', '| A | B |', '|---|---|', '| 1 | 2 |'].join('\n');
const html = `<!doctype html><style>${preflight}${css} body{font:16px sans-serif;padding:16px} .card{background:#fff;color:#171717} .dark .card{background:#1a1a1a;color:#ededed}</style>
<div class="card" style="padding:16px;width:600px"><div class="preview">${marked.parse(md, { gfm: true })}</div></div>`;
const browser = await chromium.launch();
const page = await browser.newPage();
let fails = 0;
for (const theme of ['light', 'dark']) {
  await page.setContent(html.replace('<div class="card"', theme === 'dark' ? '<div class="dark"><div class="card"' : '<div class="card"'));
  const st = await page.evaluate(() => {
    const el = document.querySelector('.preview'); const cs = (s, p) => getComputedStyle(el.querySelector(s))[p];
    return { base: getComputedStyle(el).fontSize, h1: cs('h1', 'fontSize'), h2: cs('h2', 'fontSize'), ul: cs('ul', 'listStyleType'), ol: cs('ol', 'listStyleType'), td: cs('td', 'borderTopWidth'), code: cs('p code', 'backgroundColor'), quote: cs('blockquote', 'borderLeftWidth'), a: cs('a', 'color') };
  });
  const ok = parseFloat(st.h1) > parseFloat(st.h2) && parseFloat(st.h2) > parseFloat(st.base) && st.ul === 'disc' && st.ol === 'decimal' && parseFloat(st.td) >= 1 && !/rgba\(0, 0, 0, 0\)/.test(st.code) && parseFloat(st.quote) > 0;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${theme}: ${JSON.stringify(st)}`);
  fs.mkdirSync('scripts/p37/out', { recursive: true });
  await page.locator(theme === 'dark' ? '.dark' : '.card').screenshot({ path: path.join('scripts/p37/out', `lot1-misc-markdown-css-${before ? 'before' : 'after'}-${theme}.png`) });
}
await browser.close();
process.exit(fails ? 1 : 0);
