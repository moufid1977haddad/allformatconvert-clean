// app/lib/ads.js: absent variable = ads off; a valid pair = on; anything malformed stops the build with a message
// (no silent fallback, interdit n° 3). Each case runs in a fresh Node process with its own environment.
//   node scripts/ads-tests/ads-config.mjs
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const lib = pathToFileURL(path.resolve('app/lib/ads.js')).href;
const probe = `import(${JSON.stringify(lib)}).then((m) => console.log(JSON.stringify({ on: m.adsEnabled(), client: m.adsenseClient() ?? null, slot: m.adSlots.toolFooter ?? null, regions: m.CONSENT_REGIONS.length }))).catch((e) => { console.log(JSON.stringify({ error: e.message })); })`;

function run(env) {
  const clean = { ...process.env };
  delete clean.NEXT_PUBLIC_ADSENSE_CLIENT;
  delete clean.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { env: { ...clean, ...env }, encoding: 'utf8' });
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

let fails = 0;
const check = (n, ok, info) => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : JSON.stringify(info)); };

let r = run({});
check('no variable: ads off', r.on === false && r.client === null, r);
r = run({ NEXT_PUBLIC_ADSENSE_CLIENT: 'ca-pub-1234567890123456', NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER: '1234567890' });
check('valid client + slot: ads on', r.on === true && r.client === 'ca-pub-1234567890123456' && r.slot === '1234567890', r);
check('32 consent regions (EU 27 + IS, LI, NO + UK + CH)', r.regions === 32, r);
r = run({ NEXT_PUBLIC_ADSENSE_CLIENT: '' });
check('empty client: refused', Boolean(r.error), r);
r = run({ NEXT_PUBLIC_ADSENSE_CLIENT: 'pub-1234567890123456', NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER: '1234567890' });
check('client without "ca-": refused', Boolean(r.error), r);
r = run({ NEXT_PUBLIC_ADSENSE_CLIENT: 'ca-pub-1234567890123456' });
check('client without slot: refused', Boolean(r.error) && /SLOT_TOOL_FOOTER/.test(r.error), r);
r = run({ NEXT_PUBLIC_ADSENSE_CLIENT: 'ca-pub-1234567890123456', NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER: 'abc' });
check('malformed slot: refused', Boolean(r.error), r);
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
