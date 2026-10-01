// P21 phase 6 (02/10) — every tool page on iPhone (375 px) and iPad (768 px), simulated (user agent, touch, size):
//   - no horizontal scroll (the page is never wider than the screen), and which element overflows when it is;
//   - touch targets of the TOOL itself (help text below excluded) at least 44 × 44 px (Apple's minimum): buttons,
//     links styled as buttons, selects, text fields, checkboxes / radios through their label, sliders;
//   - the upload zone is there and at least 44 px tall;
//   - no text cut off: an element whose text overflows its box while clipping it.
// Usage: node scripts/browser-tests/p21-layout.mjs <origin> [--browser=chromium|webkit] [--device=iphone|ipad|both]
//        [--only=slug,slug] [--json=out.json] [--no-vercel-toolbar]
import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const name = arg('browser') || 'chromium';
const engine = { chromium, webkit }[name];
const devices = (arg('device') || 'both') === 'both' ? ['iphone', 'ipad'] : [arg('device')];
const only = (arg('only') || '').split(',').filter(Boolean);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const DEV = {
  iphone: { viewport: { width: 375, height: 812 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: name === 'chromium', deviceScaleFactor: 3 },
  ipad: { viewport: { width: 768, height: 1024 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15', hasTouch: true, isMobile: name === 'chromium', deviceScaleFactor: 2 },
};

const pages = [];
for (const cat of fs.readdirSync(path.join(ROOT, 'app', 'tools'))) {
  const cdir = path.join(ROOT, 'app', 'tools', cat);
  if (!fs.statSync(cdir).isDirectory()) continue;
  for (const t of fs.readdirSync(cdir)) if (fs.statSync(path.join(cdir, t)).isDirectory() && fs.readdirSync(path.join(cdir, t)).some((f) => /^page\./.test(f))) pages.push(`${cat}/${t}`);
}

const b = await engine.launch();
const rows = [];
let fails = 0, passes = 0;
for (const dev of devices) {
  const ctx = await b.newContext(DEV[dev]);
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  if (dev === 'ipad') await ctx.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 }));
  const p = await ctx.newPage();
  for (const slug of pages) {
    if (only.length && !only.includes(slug.split('/')[1])) continue;
    let r;
    try {
      await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(700);
      r = await p.evaluate(() => {
        const W = window.innerWidth;
        const out = { overflow: [], small: [], cut: [], upload: null, scrollW: document.documentElement.scrollWidth };
        const desc = (el) => { const t = (el.innerText || el.value || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40); return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${t}"`; };
        const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
        if (out.scrollW > W + 1) {
          for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > W + 1 && visible(el) && getComputedStyle(el).position !== 'fixed') { out.overflow.push(`${desc(el)} right=${Math.round(r.right)}`); if (out.overflow.length > 4) break; } }
        }
        const main = document.querySelector('main') || document.body;
        const seo = main.querySelector('[data-seo-content]');
        const inTool = (el) => main.contains(el) && !(seo && seo.contains(el));
        for (const el of main.querySelectorAll('button, select, input:not([type=hidden]):not([type=file]), textarea, [role=button], a[class*="bg-"], a[class*="rounded"]')) {
          if (!inTool(el) || !visible(el)) continue;
          let r = el.getBoundingClientRect();
          if (el.type === 'checkbox' || el.type === 'radio') {
            const lab = el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || (el.nextElementSibling && el.nextElementSibling.tagName === 'LABEL' ? el.nextElementSibling : null);
            if (lab) { const lr = lab.getBoundingClientRect(); r = { width: Math.max(lr.right, r.right) - Math.min(lr.left, r.left), height: Math.max(lr.height, r.height) }; }
          }
          if (el.tagName === 'TEXTAREA') continue; // big by nature
          if (Math.min(r.width, r.height) < 43.5) out.small.push(`${desc(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
        }
        const fileInput = main.querySelector('input[type=file]');
        if (fileInput) {
          const zone = fileInput.closest('label') || fileInput.parentElement;
          const zr = zone.getBoundingClientRect();
          out.upload = { h: Math.round(zr.height), w: Math.round(zr.width) };
        }
        for (const el of main.querySelectorAll('*')) {
          if (!inTool(el) || !visible(el) || el.children.length || el.closest('.sr-only')) continue; // visually hidden on purpose
          const s = getComputedStyle(el);
          if (!(el.textContent || '').trim()) continue;
          if (['hidden', 'clip'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 1 && !el.title) out.cut.push(`${desc(el)} ${el.scrollWidth}>${el.clientWidth}`);
        }
        return out;
      });
    } catch (e) { r = { error: String(e).slice(0, 120) }; }
    const problems = [];
    if (r.error) problems.push('load: ' + r.error);
    else {
      if (r.overflow.length || r.scrollW > DEV[dev].viewport.width + 1) problems.push(`horizontal scroll ${r.scrollW}px: ${r.overflow.join('; ')}`);
      if (r.small.length) problems.push(`${r.small.length} small target(s): ${r.small.slice(0, 4).join('; ')}`);
      if (r.upload && r.upload.h < 44) problems.push(`upload zone ${r.upload.w}×${r.upload.h}`);
      if (r.cut.length) problems.push(`${r.cut.length} cut text: ${r.cut.slice(0, 3).join('; ')}`);
    }
    rows.push({ slug, dev, problems, raw: r });
    if (problems.length) { fails++; console.log('FAIL', `${name} [${dev}] ${slug}:`, problems.join(' || ')); } else passes++;
  }
  await ctx.close();
}
await b.close();
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(rows, null, 1));
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} pages (${name})`);
process.exit(fails ? 1 : 0);
