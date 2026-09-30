// A build made WITH test AdSense values (never deployed), read as served HTML only — no browser, so nothing is
// requested from Google with a fake publisher id:
//   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000 NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER=0000000000 npm run build
//   npx next start -p 3100 ; node scripts/ads-tests/ads-on-build.mjs http://localhost:3100
// Checks: consent defaults before any Google script, AdSense tag lazy, one reserved slot on a tool page and none on the
// homepage, "Privacy choices" link, Advertising section with Google's required disclosures, /ads.txt line.
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const PUB = 'pub-0000000000000000';
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : info); };
const get = async (p) => { const r = await fetch(origin + p); return { status: r.status, text: await r.text() }; };

const tool = await get('/tools/developer-tools/json-formatter');
const home = await get('/');
const privacy = await get('/privacy');
const ads = await get('/ads.txt');

check('consent defaults present (denied in EEA/UK/CH)', /gtag\('consent', 'default', \{ ad_storage: 'denied'[^}]*region: \[[^\]]*"FR"[^\]]*"GB"[^\]]*"CH"/.test(tool.text));
const iConsent = tool.text.indexOf("gtag('consent', 'default'");
const iGtag = tool.text.indexOf('googletagmanager.com/gtag/js');
check('consent defaults come before the Analytics tag in the HTML', iConsent >= 0 && (iGtag < 0 || iConsent < iGtag), `${iConsent} vs ${iGtag}`);
check('AdSense tag declared with the client id (loaded lazily by Next)', tool.text.includes(`adsbygoogle.js?client=ca-${PUB}`));
check('one ad slot with reserved height on a tool page', (tool.text.match(/class="adsbygoogle"/g) || []).length === 1 && /min-height:280px/.test(tool.text));
check('slot labelled "Advertisement"', tool.text.includes('>Advertisement<'));
check('no ad slot on the homepage', !home.text.includes('class="adsbygoogle"'));
check('"Privacy choices" link in the footer', tool.text.includes('>Privacy choices<'));
check('privacy policy has the Advertising section', /\d+\. Advertising/.test(privacy.text));
for (const s of ['Third-party vendors, including Google, use cookies', 'google.com/settings/ads', 'aboutads.info', 'Transparency &amp; Consent Framework']) check(`privacy: ${s}`, privacy.text.includes(s));
check('/ads.txt serves the Google line', ads.status === 200 && ads.text.trim() === `google.com, ${PUB}, DIRECT, f08c47fec0942fa0`, `${ads.status} ${ads.text.slice(0, 80)}`);
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
