// Bloquant 11, test 7 -- a REAL React render crash, and what app/error.jsx does with it. PREVIEW ONLY: the report is
// written to the real tool_errors table (the sheet's rule).
// The crash: Sticky Notes reloads its notes from localStorage and only checks that they form an array; a note whose
// text is an object (a stored value from another version, an extension, a hand edit) makes React throw "Objects are
// not valid as a React child" while rendering -- no Google Translate needed (that trigger is neutralised since
// ab77de51 by the insertBefore/removeChild patch in layout.tsx).
// Proves: the site's error screen shows (not a blank page, not Vercel's), the report request leaves the browser and
// is accepted by /api/report-error, and what it carries (no file name, no content). Reading the row in tool_errors
// needs the service role, i.e. the owner (Supabase -> Table Editor -> tool_errors, newest first).
// Usage: node scripts/browser-tests/b11-test7-crash.mjs <preview origin> [--browser=firefox]
import { chromium, firefox, webkit } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
if (/onlineconvertools\.com$/.test(new URL(origin).hostname)) { console.error('Test 7 writes to tool_errors: preview only, never www.'); process.exit(2); }
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };

const b = await { chromium, firefox, webkit }[browserName].launch();
const ctx = await b.newContext();
// The stored value the page does not know how to handle -- set before the page's own scripts run.
await ctx.addInitScript(() => { try { localStorage.setItem('sticky-notes', JSON.stringify([{ id: 1, text: { note: 'saved by another version' }, color: 'bg-yellow-300' }])); } catch {} });
// Keep a copy of what sendBeacon sends (Playwright does not expose a beacon's body); the beacon itself goes out unchanged.
await ctx.addInitScript(() => { const orig = navigator.sendBeacon.bind(navigator); window.__beacons = []; navigator.sendBeacon = (url, data) => { try { if (data instanceof Blob) data.text().then((t) => window.__beacons.push(t)); else window.__beacons.push(String(data)); } catch {} return orig(url, data); }; });
const p = await ctx.newPage();
const reports = [];
p.on('request', (r) => { if (r.url().includes('/api/report-error')) reports.push({ req: r, body: (r.postDataBuffer() || Buffer.alloc(0)).toString('utf8') }); });
const pageErrors = []; p.on('pageerror', (e) => pageErrors.push(e.message));
const at = new Date();
console.log(`crash provoked at ${at.toISOString()} (UTC) — ${at.toLocaleString('fr-CA', { timeZone: 'America/Toronto' })} (Montréal)`);
await p.goto(`${origin}/tools/text-tools/sticky-notes`, { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const h1 = await p.locator('h1').allInnerTexts();
check('the site\'s own error screen is shown (navbar kept, "Something went wrong", two buttons)', h1.includes('Something went wrong') && (await p.getByRole('button', { name: 'Try again' }).count()) === 1 && (await p.locator('nav, header').count()) > 0, `h1: ${JSON.stringify(h1)}`);
check('not a blank page, not Vercel\'s screen', !(await p.locator('text=/Application error|This page could not be found|client-side exception/i').count()) && (await p.locator('body').innerText()).length > 200);
check('a report left the browser for /api/report-error', reports.length >= 1, `${reports.length} request(s)`);
const beacons = await p.evaluate(() => window.__beacons || []);
for (const [i, { req, body: seen }] of reports.entries()) {
  const body = seen || beacons[i] || '';
  const res = await req.response().catch(() => null);
  const status = res ? res.status() : '(beacon: no response object)';
  console.log('report payload:', body);
  let j = {}; try { j = JSON.parse(body) || {}; } catch {}
  check('the report is accepted by the route (2xx)', res ? res.status() < 300 : true, `status ${status}`);
  check('the report names the tool and the error type', j.tool === 'sticky-notes' && !!j.errorType && !!j.errorMessage, `${j.tool} / ${j.errorType} / ${j.errorMessage}`);
  check('no file name, no content in it', !/saved by another version|\.(txt|pdf|docx?)\b/i.test(body || ''), `keys: ${Object.keys(j).join(', ')}`);
}
console.log('page errors:', pageErrors.map((m) => m.slice(0, 120)).join(' | ') || '(none)');
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
