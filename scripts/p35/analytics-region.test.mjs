// P35 (06/10, lot 2) — app/lib/analyticsRegion.js: which countries load Google Analytics.
//   node scripts/p35/analytics-region.test.mjs
const { analyticsAllowed, requestCountry } = await import('../../app/lib/analyticsRegion.js');

let fails = 0, passes = 0;
const check = (n, ok) => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n); };

const EEA = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO'];
check('the 30 EEA countries: no Analytics', EEA.every((c) => analyticsAllowed(c) === false));
check('United Kingdom, Switzerland: no Analytics', !analyticsAllowed('GB') && !analyticsAllowed('CH'));
check('EU territories with their own code (Réunion, Guadeloupe, Åland…), French territories outside the EU, Channel Islands, Isle of Man, Gibraltar: no Analytics', ['RE', 'GP', 'MQ', 'GF', 'YT', 'MF', 'AX', 'BL', 'PM', 'NC', 'PF', 'WF', 'TF', 'JE', 'GG', 'IM', 'GI'].every((c) => !analyticsAllowed(c)));
check('unknown country (absent, empty, XX, EU, T1 Tor, junk): no Analytics', [undefined, null, '', 'XX', 'EU', 'T1', 'FRA', '1', 'fr-FR'].every((c) => !analyticsAllowed(c)));
check('lower case is read as the code (fr: no)', !analyticsAllowed('fr'));
check('Canada, United States, Brazil, Japan, India: Analytics as before', ['CA', 'US', 'BR', 'JP', 'IN', 'ca'].every((c) => analyticsAllowed(c)));

const h = (o) => new Headers(o);
check('production reads only Vercel\'s header (the test header is ignored)', requestCountry(h({ 'x-vercel-ip-country': 'FR', 'x-oct-test-country': 'US' }), 'production', true) === 'FR');
check('no VERCEL_ENV (local): Vercel\'s header only', requestCountry(h({ 'x-oct-test-country': 'US' }), undefined, false) === null);
check('VERCEL_ENV=preview from a pulled .env on a local server: test header ignored', requestCountry(h({ 'x-oct-test-country': 'US' }), 'preview', false) === null);
check('a preview on Vercel takes the test header when present', requestCountry(h({ 'x-vercel-ip-country': 'CA', 'x-oct-test-country': 'DE' }), 'preview', true) === 'DE');
check('a preview without it uses Vercel\'s', requestCountry(h({ 'x-vercel-ip-country': 'CA' }), 'preview', true) === 'CA');

console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
