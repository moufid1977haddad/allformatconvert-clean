// P35 (06/10, lot 2 — audit A1): Google Analytics is NOT loaded for visitors in the EEA, the United Kingdom and
// Switzerland, where a cookie that is not strictly necessary needs prior consent (ePrivacy directive art. 5(3), UK PECR,
// Swiss law) and the site has no consent message yet (the certified CMP is the owner's decision, at the AdSense request).
// Until then, no _ga cookie and no request to Google Analytics there; elsewhere nothing changes.
//
// The country is the one Vercel's edge gives every request (x-vercel-ip-country, from the visitor's IP). An unknown
// country (header absent or not two letters: local `next start`, a proxy, "XX") counts as Europe: the careful side.
// The decision is made on the server (app/api/analytics-consent/route.js) and the page only loads Analytics when the
// answer says so (app/components/Analytics.jsx) — a failed request loads nothing.
import { CONSENT_REGIONS } from './ads.js';

// + the parts of the EU that have their own ISO code (Åland; French outermost regions and Saint-Martin), the French
// territories outside the EU where French cookie law applies (Saint-Barthélemy, Saint-Pierre-et-Miquelon, New
// Caledonia, French Polynesia, Wallis-et-Futuna, French Southern Territories — review 06/10), and the Channel Islands,
// the Isle of Man and Gibraltar (UK-style data laws): treated as Europe too, the careful side
const REGIONS = new Set([...CONSENT_REGIONS, 'AX', 'GF', 'GP', 'MQ', 'RE', 'YT', 'MF', 'BL', 'PM', 'NC', 'PF', 'WF', 'TF', 'JE', 'GG', 'IM', 'GI']);

/** true only when the country is known AND outside the EEA, the UK and Switzerland */
export function analyticsAllowed(country) {
  const c = String(country || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c) || c === 'XX' || c === 'EU' || c === 'T1') return false;
  return !REGIONS.has(c);
}

// A preview deployment can be tested from one place for several countries: there (and only there — VERCEL_ENV is
// "preview" AND the code runs on Vercel: VERCEL_ENV alone can come from a pulled .env file on a local server), the
// header x-oct-test-country stands in for Vercel's. Production never reads it.
const onVercel = () => !!(process.env.VERCEL_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
export function requestCountry(headers, vercelEnv = process.env.VERCEL_ENV, runsOnVercel = onVercel()) {
  if (vercelEnv === 'preview' && runsOnVercel) {
    const test = headers.get('x-oct-test-country');
    if (test) return test;
  }
  return headers.get('x-vercel-ip-country');
}
