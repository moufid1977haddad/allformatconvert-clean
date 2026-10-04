// P32 (04/10) — unit prices of the fal endpoints of the bench, from fal's own Platform API (free GET, no inference).
// The key is read by ../fal-env.mjs and only ever sent in the Authorization header; never printed.
// Usage: node scripts/p32/bg/fal-pricing.mjs
import { falKey } from '../fal-env.mjs';

const ids = ['fal-ai/bria/background/remove', 'fal-ai/birefnet/v2', 'fal-ai/birefnet'];
const key = falKey();
if (!key) { console.log('FAL_KEY absent'); process.exit(1); }
const url = 'https://api.fal.ai/v1/models/pricing?' + ids.map((i) => 'endpoint_id=' + encodeURIComponent(i)).join('&');
const r = await fetch(url, { headers: { Authorization: `Key ${key}` } });
const txt = await r.text();
console.log('HTTP', r.status);
console.log(txt.split(key).join('[redacted]').slice(0, 3000));
