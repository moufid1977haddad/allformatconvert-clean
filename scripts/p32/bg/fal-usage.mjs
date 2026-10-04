// P32 (04/10) — what fal itself counted for the bench endpoints today (Platform API usage, free GET, no inference).
// The key comes from ../fal-env.mjs, only in the Authorization header, never printed (any echo is redacted).
// Usage: node scripts/p32/bg/fal-usage.mjs [startISO]
import { falKey } from '../fal-env.mjs';

const key = falKey();
if (!key) { console.log('FAL_KEY absent'); process.exit(1); }
const start = process.argv[2] || new Date(Date.now() - 24 * 3600e3).toISOString();
const ids = ['fal-ai/bria/background/remove', 'fal-ai/birefnet/v2'];
const q = new URLSearchParams({ start, end: new Date().toISOString(), timeframe: 'day' });
for (const i of ids) q.append('endpoint_id', i);
q.append('expand', 'summary');
const r = await fetch('https://api.fal.ai/v1/models/usage?' + q, { headers: { Authorization: `Key ${key}` } });
const t = await r.text();
console.log('HTTP', r.status);
console.log(t.split(key).join('[redacted]').slice(0, 4000));
