// P27 phase 6: the category bar with a word under each icon -- at every desktop width, nothing overflows the header and
// no word is cut (English), and the header height. node scripts/p27/navbar-width.mjs <origin>
import { chromium } from '@playwright/test';
const origin = new URL(process.argv[2]).origin;
const b = await chromium.launch();
let fails = 0;
for (const w of [1024, 1100, 1180, 1280, 1366, 1440, 1536, 1680, 1920, 2560]) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } });
  await p.goto(origin + '/tools/pdf-tools/pdf-merge', { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const header = document.querySelector('header');
    const nav = header.querySelector('nav');
    const cut = [...nav.querySelectorAll('a span.truncate')].filter((s) => s.scrollWidth > s.clientWidth + 1).map((s) => s.textContent);
    const items = [...nav.querySelectorAll(':scope > div > a')].map((a) => a.getBoundingClientRect());
    const overlap = items.some((r, i) => i && r.left < items[i - 1].right - 0.5);
    const right = [...header.querySelectorAll('button, a')].reduce((m, el) => Math.max(m, el.getBoundingClientRect().right), 0);
    return { docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, headerH: Math.round(header.getBoundingClientRect().height), cut, overlap, rightEdge: Math.round(right), vw: window.innerWidth, labels: [...nav.querySelectorAll('a span.truncate')].map((s) => s.textContent).join(' ') };
  });
  const ok = r.docOverflow <= 0 && !r.cut.length && !r.overlap && r.rightEdge <= r.vw;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${w}px: header ${r.headerH}px, page overflow ${r.docOverflow}px, words cut [${r.cut.join(',')}], overlap ${r.overlap}, right edge ${r.rightEdge}/${r.vw}${w === 1024 ? ' | ' + r.labels : ''}`);
  await p.close();
}
await b.close();
console.log(`navbar-width: ${fails} fail(s)`);
