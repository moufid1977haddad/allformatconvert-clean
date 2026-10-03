// P27 phase 4: HOW a page loads (the means, not only the score): render-blocking scripts and styles, async/defer,
// preload/preconnect hints, fonts (format, font-display, preloaded or not), images (lazy, sizes, format), JS weight
// first-party vs third-party, what the first paint waits for. Mobile viewport (Moto G Power size), cache empty.
//   node scripts/p27/how-pages-load.mjs <url>... > out.json
import { chromium } from 'playwright';

const urls = process.argv.slice(2);
const b = await chromium.launch();
const results = [];
for (const url of urls) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('requestfinished', async (rq) => {
    try {
      const resp = await rq.response();
      const sizes = await rq.sizes();
      reqs.push({ url: rq.url().slice(0, 140), type: rq.resourceType(), bytes: sizes.responseBodySize + sizes.responseHeadersSize, status: resp?.status(), t: Math.round(rq.timing().responseEnd) });
    } catch { /* ignored */ }
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const host = new URL(url).hostname.split('.').slice(-2).join('.');
  const dom = await page.evaluate(() => {
    const head = [...document.head.children];
    const scripts = [...document.scripts].map((s) => ({ src: (s.src || '(inline ' + s.textContent.length + ' chars)').slice(0, 110), async: s.async, defer: s.defer, module: s.type === 'module', inHead: s.parentElement === document.head }));
    const blockingScripts = scripts.filter((s) => s.inHead && !s.async && !s.defer && !s.module && !s.src.startsWith('(inline'));
    const links = [...document.querySelectorAll('link')].map((l) => ({ rel: l.rel, as: l.getAttribute('as'), href: (l.href || '').slice(0, 110), media: l.media || '' }));
    const fonts = [];
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch { continue; }
      for (const r of rules) if (r.constructor.name === 'CSSFontFaceRule') fonts.push({ family: r.style.getPropertyValue('font-family'), display: r.style.getPropertyValue('font-display') || '(auto)', src: r.style.getPropertyValue('src').slice(0, 90) });
    }
    const imgs = [...document.images].map((i) => ({ src: (i.currentSrc || i.src).slice(0, 90), loading: i.loading, w: i.width, h: i.height, hasDims: i.hasAttribute('width') && i.hasAttribute('height'), fetchpriority: i.getAttribute('fetchpriority') }));
    const lcp = new Promise((res) => { try { new PerformanceObserver((l) => { const e = l.getEntries().at(-1); res(e ? { tag: e.element?.tagName, text: (e.element?.textContent || '').slice(0, 60), url: (e.url || '').slice(0, 90), t: Math.round(e.startTime) } : null); }).observe({ type: 'largest-contentful-paint', buffered: true }); setTimeout(() => res(null), 500); } catch { res(null); } });
    const nav = performance.getEntriesByType('navigation')[0];
    return Promise.resolve(lcp).then((l) => ({
      lcp: l, fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0),
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0), load: Math.round(nav?.loadEventEnd || 0),
      scripts: scripts.length, blockingScripts, stylesheets: links.filter((l) => l.rel === 'stylesheet').map((l) => l.href + (l.media ? ' media=' + l.media : '')),
      hints: links.filter((l) => /preload|preconnect|dns-prefetch|modulepreload|prefetch/.test(l.rel)).map((l) => `${l.rel}${l.as ? '(' + l.as + ')' : ''} ${l.href}`),
      fonts: fonts.slice(0, 12), images: imgs.slice(0, 15), domNodes: document.getElementsByTagName('*').length,
    }));
  });
  const sum = (f) => reqs.filter(f).reduce((s, r) => s + (r.bytes || 0), 0);
  const first = (r) => r.url.includes(host);
  results.push({
    url, ms: Date.now() - t0, ...dom,
    requests: reqs.length,
    jsKB: Math.round(sum((r) => r.type === 'script') / 1024), jsFirstKB: Math.round(sum((r) => r.type === 'script' && first(r)) / 1024),
    cssKB: Math.round(sum((r) => r.type === 'stylesheet') / 1024), fontKB: Math.round(sum((r) => r.type === 'font') / 1024), imgKB: Math.round(sum((r) => r.type === 'image') / 1024),
    thirdParty: [...new Set(reqs.filter((r) => !first(r)).map((r) => new URL(r.url).hostname))],
  });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(results, null, 1));
