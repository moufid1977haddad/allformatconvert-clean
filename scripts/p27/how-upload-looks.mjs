// P27 phase 6: how the market's tool pages present the upload step, on a computer and on a phone -- the upload
// area's words, whether an action button exists before a file is chosen, the top navigation (words or icons) and the
// footer's category list. Screenshots for reading by eye.
//   node scripts/p27/how-upload-looks.mjs <out-dir> <url>...
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [out, ...urls] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const res = [];
for (const url of urls) {
  for (const [kind, opts] of [['desktop', { viewport: { width: 1366, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const ctx = await b.newContext({ ...opts, locale: 'en-US' });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(4000);
    const name = `${new URL(url).hostname.replace(/^www\./, '').split('.')[0]}-${new URL(url).pathname.replace(/\W+/g, '_')}-${kind}`;
    await p.screenshot({ path: path.join(out, `${name}.png`) }).catch(() => {});
    const info = await p.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const input = document.querySelector('input[type=file]');
      let zone = input;
      for (let i = 0; zone && i < 6; i++) { zone = zone.parentElement; if (zone && zone.innerText && zone.innerText.trim().length > 10) break; }
      const buttons = [...document.querySelectorAll('button, a[role=button], [role=button]')].filter(vis).map((x) => (x.innerText || x.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 12);
      const nav = document.querySelector('header nav, nav, header');
      const navItems = nav ? [...nav.querySelectorAll('a, button')].filter(vis).map((x) => (x.innerText || x.getAttribute('aria-label') || '[icon]').trim().replace(/\s+/g, ' ')).slice(0, 18) : [];
      const footer = document.querySelector('footer');
      const footHeads = footer ? [...footer.querySelectorAll('h2,h3,h4,h5,strong,[class*=title],[class*=heading]')].map((x) => x.innerText.trim()).filter((t) => t && t.length < 40).slice(0, 20) : [];
      return { zoneText: zone ? zone.innerText.trim().replace(/\s+/g, ' ').slice(0, 220) : null, inputAccept: input?.accept, inputMultiple: input?.multiple, buttons, navItems, footHeads, footLinks: footer ? footer.querySelectorAll('a').length : 0 };
    }).catch((e) => ({ error: String(e) }));
    res.push({ url, kind, ...info });
    await ctx.close();
  }
}
await b.close();
fs.writeFileSync(path.join(out, 'upload-looks.json'), JSON.stringify(res, null, 1));
for (const r of res) console.log(`== ${r.kind} ${r.url}\n zone: ${r.zoneText}\n buttons: ${(r.buttons || []).join(' | ')}\n nav: ${(r.navItems || []).join(' | ')}\n footer heads: ${(r.footHeads || []).join(' | ')} (${r.footLinks} links)`);
