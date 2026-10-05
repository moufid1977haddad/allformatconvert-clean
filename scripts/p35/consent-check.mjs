// P35 (06/10, lot 2) — Google Analytics never runs for visitors of the EEA, the UK and Switzerland (nor for an unknown
// country), and runs as before elsewhere. For each country: a fresh browser (no cookie), the home page then a tool page
// (a client-side navigation and a full load), 8 s each after "load"; every request to Google Analytics hosts is
// counted and the cookies are listed at the end.
//   node scripts/p35/consent-check.mjs <origin> [--header=x-vercel-ip-country|x-oct-test-country]
// Local `next start`: the country is simulated with x-vercel-ip-country (nothing strips it locally). A preview: Vercel
// sets x-vercel-ip-country itself, so the preview-only stand-in x-oct-test-country is used (app/lib/analyticsRegion.js).
// The header is added to requests to <origin> only. Also checks the logic of app/lib/analyticsRegion.js directly.
import { chromium } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const header = (process.argv.find((a) => a.startsWith('--header=')) || '--header=x-vercel-ip-country').slice(9);
const GA_HOST = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)$/;
// [country, Analytics expected, Analytics cookies left by a visit before 06/10]
const cases = [['FR', false], ['FR', false, true], ['DE', false], ['GB', false], ['CH', false], ['RE', false], [null, false], ['CA', true], ['US', true]];
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `— ${info}`); };

const b = await chromium.launch();
for (const [country, expectGa, oldCookies] of cases) {
  const ctx = await b.newContext();
  if (oldCookies) await ctx.addCookies(['_ga', '_ga_7GFHW05JLH'].map((name) => ({ name, value: 'GA1.1.1.1', domain: new URL(origin).hostname, path: '/' })));
  const ga = [];
  await ctx.route('**/*', (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (GA_HOST.test(u.hostname)) ga.push(`${u.hostname}${u.pathname}`);
    if (u.origin === origin && country) return route.continue({ headers: { ...req.headers(), [header]: country } });
    return route.continue();
  });
  const page = await ctx.newPage();
  const answers = [];
  page.on('response', async (r) => { if (r.url().includes('/api/analytics-consent')) { try { answers.push(await r.json()); } catch { /* ignore */ } } });
  await page.goto(`${origin}/`, { waitUntil: 'load' });
  await page.waitForTimeout(8000);
  // a client-side navigation (the layout stays mounted), then a full load of a tool page
  await page.click('a[href="/tools/pdf-tools"]', { timeout: 10000 }).catch(() => page.goto(`${origin}/tools/pdf-tools`));
  await page.waitForTimeout(3000);
  await page.goto(`${origin}/tools/pdf-tools/pdf-to-word`, { waitUntil: 'load' });
  await page.waitForTimeout(8000);
  const cookies = (await ctx.cookies()).map((c) => c.name);
  const gaCookies = cookies.filter((n) => /^_ga/.test(n));
  const label = `${country || 'unknown'}${oldCookies ? ' (with _ga cookies from an earlier visit)' : ''}`;
  console.log(`  ${label}: answers ${JSON.stringify(answers)}; GA requests ${ga.length}${ga.length ? ` (${[...new Set(ga)].slice(0, 3).join(', ')})` : ''}; cookies [${cookies.join(', ')}]`);
  if (expectGa) {
    check(`${label}: Analytics loads as before (requests to Google Analytics, _ga cookie)`, ga.length > 0 && gaCookies.length > 0, `requests ${ga.length}, cookies ${cookies}`);
  } else {
    check(`${label}: no request to Google Analytics`, ga.length === 0, ga.join(' '));
    check(`${label}: no _ga cookie`, gaCookies.length === 0, gaCookies.join());
    // oct_automation is our own marker of a test robot (navigator.webdriver), never set for a visitor
    check(`${label}: no other cookie than the test-robot marker`, cookies.every((n) => n === 'oct_automation'), cookies.join());
  }
  check(`${label}: the server answered ${expectGa}`, answers.length >= 1 && answers.every((a) => a.analytics === expectGa), JSON.stringify(answers));
  await ctx.close();
}
await b.close();

// the answer is never cached (one visitor's country must not be served to another)
const r = await fetch(`${origin}/api/analytics-consent`, { headers: { [header]: 'US' } });
check('the answer is marked private, no-store', /no-store/.test(r.headers.get('cache-control') || '') && /private/.test(r.headers.get('cache-control') || ''), r.headers.get('cache-control'));

console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
