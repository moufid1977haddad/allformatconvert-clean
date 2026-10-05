// P34 (05/10) — LOCAL BENCH ONLY, loaded into `next start` with NODE_OPTIONS=--import: the non-regression lot B must make
// no paid call and write nothing anywhere real (owner's rule, P33 addendum c). On top of scripts/p26/e1/fake-providers.mjs
// (ConvertAPI → an earlier real output, Supabase → neutral "allowed"), this answers in place of:
//   - OpenAI, Pangram, Google Translate (+ its OAuth token): 503 with a JSON error (the tools must show their message);
//   - ntfy.sh and Resend (alerts to the owner's phone and mail): 200, nothing sent.
// Every interception is appended to FAKE_LOG (host + path only, never a header or a body).
import fs from 'node:fs';
import '../p26/e1/fake-providers.mjs';

const inner = globalThis.fetch;
const log = (line) => { if (process.env.FAKE_LOG) fs.appendFileSync(process.env.FAKE_LOG, `${new Date().toISOString()} ${line}\n`); };
const PAID = ['api.openai.com', 'text.external-api.pangram.com', 'translation.googleapis.com', 'oauth2.googleapis.com', 'fal.run', 'queue.fal.run'];
const ALERTS = ['ntfy.sh', 'api.resend.com'];

globalThis.fetch = async function benchFetch(input, init) {
  let host = '', path = '';
  try { const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url); host = u.hostname; path = u.pathname; } catch { /* relative */ }
  if (PAID.includes(host)) {
    log(`paid-blocked ${host}${path}`);
    return new Response(JSON.stringify({ error: { message: 'bench: paid provider not called' } }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  if (ALERTS.includes(host)) {
    log(`alert-swallowed ${host}${path}`);
    return new Response(JSON.stringify({ id: 'bench' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return inner(input, init);
};
log('fake-all-providers loaded');
