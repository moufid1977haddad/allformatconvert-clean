// Category names (28/09, owner): ONE name per category, identical on the home card, the /tools card, the category
// page's title (h1), its title for Google (<title>, "<name> — …"), and the menu (link tooltip, screen-reader name,
// mobile menu). The site has no breadcrumb. Also the cards' "+N more tools": never "+0", "+1 more tool" singular.
// Usage: node scripts/browser-tests/category-names.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const NAMES = {
  'pdf-tools': 'PDF Tools', 'image-tools': 'Image Tools', 'gif-tools': 'GIF Tools', 'text-tools': 'Text Tools',
  'audio-tools': 'Audio Tools', 'video-tools': 'Video Tools', 'file-tools': 'File Tools', 'qr-barcodes-tools': 'QR & Barcode Tools',
  'converter-tools': 'Converter Tools', 'developer-tools': 'Developer Tools', 'math-tools': 'Math Tools', 'ai-tools': 'AI Tools',
};
const b = await { chromium, firefox, webkit }[name].launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

const cards = async (url) => {
  await p.goto(origin + url, { waitUntil: 'networkidle' });
  return p.evaluate(() => Object.fromEntries([...document.querySelectorAll('a[href^="/tools/"]')].filter((a) => a.querySelector('h2')).map((a) => [
    a.getAttribute('href').split('/').pop(), { title: a.querySelector('h2').textContent.trim(), more: a.querySelector('[data-more-tools]')?.textContent.trim() ?? null, listed: a.querySelectorAll('div.space-y-1 > div:not([data-more-tools])').length, count: Number((a.textContent.match(/(\d+) tools/) || [])[1]) },
  ])));
};
for (const [url, label] of [['/', 'home card'], ['/tools', '/tools card']]) {
  const c = await cards(url);
  for (const [slug, n] of Object.entries(NAMES)) {
    const k = c[slug];
    check(`${label} ${slug}: "${n}"`, k?.title === n, k?.title);
    const extra = k ? k.count - k.listed : NaN;
    const want = extra > 0 ? `+${extra} more tool${extra === 1 ? '' : 's'}` : null;
    check(`${label} ${slug}: ${want ?? 'no "+N more" line'}`, k && k.more === want, `${k?.more} (count ${k?.count}, listed ${k?.listed})`);
  }
}
// the menu: tooltip and accessible name of each category link
await p.goto(origin + '/', { waitUntil: 'networkidle' });
const menu = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('header a[title][href^="/tools/"]')].map((a) => [a.getAttribute('href').split('/').pop(), { title: a.title, sr: a.querySelector('.sr-only')?.textContent }])));
for (const [slug, n] of Object.entries(NAMES)) check(`menu ${slug}: tooltip and screen-reader name "${n}"`, menu[slug]?.title === n && menu[slug]?.sr === n, JSON.stringify(menu[slug]));
for (const [slug, n] of Object.entries(NAMES)) {
  await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'domcontentloaded' });
  const h1 = (await p.locator('main h1, h1').first().innerText()).trim();
  const title = await p.title();
  check(`page ${slug}: h1 "${n}", Google title starts "${n} —"`, h1 === n && title.startsWith(`${n} — `), `h1 "${h1}" · title "${title}"`);
}
// mobile menu (390 px): full names
const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await m.goto(origin + '/', { waitUntil: 'networkidle' });
await m.locator('header button[aria-label*="menu" i]').first().click();
await m.waitForTimeout(500);
const mob = await m.evaluate(() => [...document.querySelectorAll('a[href^="/tools/"] span.truncate')].map((s) => s.textContent.trim()));
check('mobile menu: the 12 full names', Object.values(NAMES).every((n) => mob.includes(n)), mob.slice(0, 12).join(' | '));
const overflow = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth);
check('mobile menu: no horizontal overflow at 390 px', overflow <= 0, `${overflow} px`);
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${name})`);
process.exit(fails ? 1 : 0);
