// Deployment of qualite-29-09 (P13, 29/09): the atomic rate limit and the visitor-IP source, checked on a live origin.
//  probe   -- POST /api/report-error once: the route reserves its hour/day counters through the NEW SQL function
//             (increment_usage_counters_all_or_none) BEFORE validating the body; a 503 means that function is missing
//             or failing. Expected: 204 (body valid; X-Tool-Error-Recorded says whether a row was written: only
//             production writes, and this probe is marked as a deployment test in its message).
//  limit   -- POST /api/media/ticket (op "compress", 1 MB) until the connection's hourly or daily bucket is full: every
//             answer is 200 until one is 429, and the next one is 429 too. Tickets are signed permissions only: no job
//             is started, nothing is billed. Side effect: this connection's media allowance for the hour/day is used up.
//  spoof   -- once refused: the same request with a forged "x-forwarded-for: 1.2.3.4" (and x-vercel-forwarded-for,
//             forwarded) is STILL refused -- the limit keys on x-real-ip, which Vercel writes itself.
// Usage: node scripts/browser-tests/deploiement-29-09-limits.mjs <origin> [--only=probe|limit]
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

if (!only || only === 'probe') {
  const r = await fetch(origin + '/api/report-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tool: 'json-minifier', source: 'browser', errorMessage: 'deployment probe 29/09 (not a real error)' }),
  });
  check('report-error answers through the new SQL function (not 503)', r.status !== 503 && r.status < 500, `status ${r.status}, recorded=${r.headers.get('x-tool-error-recorded')}`);
}

if (!only || only === 'limit') {
  const ticket = (extra = {}) => fetch(origin + '/api/media/ticket', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extra },
    body: JSON.stringify({ op: 'compress', size: 1048576 }),
  });
  let granted = 0;
  let refused = null;
  for (let i = 0; i < 70 && !refused; i++) {
    const r = await ticket();
    if (r.status === 200) granted++;
    else if (r.status === 429) refused = { status: r.status, body: await r.json(), retry: r.headers.get('retry-after') };
    else { check('ticket answers 200 or 429 only', false, `status ${r.status}: ${await r.text()}`); break; }
  }
  check('limit reached then refused', refused !== null, `${granted} tickets granted, then ${refused ? `429 "${refused.body.message}" (Retry-After ${refused.retry} s)` : 'no refusal'}`);
  if (refused) {
    const again = await ticket();
    check('still refused on the next request', again.status === 429, `status ${again.status}`);
    const spoofed = await ticket({ 'x-forwarded-for': '1.2.3.4', 'x-vercel-forwarded-for': '1.2.3.4', forwarded: 'for=1.2.3.4' });
    check('a forged x-forwarded-for does not reset the limit', spoofed.status === 429, `status ${spoofed.status}`);
  }
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${origin})`);
process.exit(fails ? 1 : 0);
