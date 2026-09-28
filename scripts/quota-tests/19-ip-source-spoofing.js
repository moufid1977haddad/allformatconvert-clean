// node scripts/quota-tests/19-ip-source-spoofing.js
//
// No Supabase, no SUPABASE_SERVICE_ROLE_KEY: lib/quota/supabaseAdmin.js is replaced in
// require.cache by a stub that only records the RPC calls (bucket keys) it receives.
//
// The visitor IP used for every limit must come from `x-real-ip` (set by Vercel's proxy,
// https://vercel.com/docs/headers/request-headers), never from a client-controllable
// value such as the first element of a forged X-Forwarded-For list.
process.env.IP_RATE_LIMIT_PER_HOUR = '30';
process.env.IP_RATE_LIMIT_PER_DAY = '100';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const calls = [];
require.cache[require.resolve(path.join(ROOT, 'lib/quota/supabaseAdmin.js'))] = {
  id: 'supabaseAdmin-stub', loaded: true,
  exports: {
    supabaseAdmin: {
      async rpc(name, params) {
        calls.push({ name, params });
        return { data: params.p_buckets.map((_, i) => ({ idx: i + 1, new_value: 1, over_cap: false, allowed: true })), error: null };
      },
    },
  },
};

const { getClientIp, clientIpBucketId, hashIp } = require('../../lib/quota/ipHash');
const { checkIpRateLimit } = require('../../lib/quota/ipRateLimit');
const { checkContactRateLimit } = require('../../lib/quota/contactRateLimit');
const { checkToolErrorRateLimit } = require('../../lib/quota/toolErrorRateLimit');
const { checkHourDayRateLimit } = require('../../lib/quota/hourDayRateLimit');
const { reserveImageGen } = require('../../lib/quota/imageGen');

const REAL = '198.51.100.23';
// A real Fetch API Request (as Next.js route handlers receive), with every forged header an attacker can send.
const forged = () => new Request('https://example.test/api/x', {
  method: 'POST',
  headers: {
    'X-Forwarded-For': `1.2.3.4, ${REAL}`,
    'X-Vercel-Forwarded-For': '5.6.7.8',
    'Forwarded': 'for=9.9.9.9',
    'CF-Connecting-IP': '10.0.0.1',
    'True-Client-IP': '10.0.0.2',
    'X-Real-IP': REAL, // on Vercel, this value is the proxy's, not the client's
  },
});

let pass = 0;
async function t(name, fn) { calls.length = 0; await fn(); pass++; console.log('PASS', name); }

(async () => {
  await t('forged X-Forwarded-For "1.2.3.4, <real>" maps to the real IP (x-real-ip), not 1.2.3.4', async () => {
    assert.strictEqual(getClientIp(forged()), REAL);
    assert.strictEqual(clientIpBucketId(forged()), hashIp(REAL));
  });

  await t('X-Forwarded-For alone (no x-real-ip) is ignored: shared unknown-ip bucket, never the forged value', async () => {
    const req = new Request('https://example.test/', { headers: { 'X-Forwarded-For': '1.2.3.4' } });
    assert.strictEqual(getClientIp(req), null);
    assert.strictEqual(clientIpBucketId(req), 'unknown-ip');
  });

  await t('x-real-ip must be ONE well-formed IP: a list, junk or empty value is treated as absent', async () => {
    for (const v of ['1.2.3.4, 5.6.7.8', 'not-an-ip', '1.2.3.4:443', '999.1.1.1', ' ', 'unknown-ip']) {
      const req = new Request('https://example.test/', { headers: { 'X-Real-IP': v } });
      assert.strictEqual(getClientIp(req), null, `accepted ${JSON.stringify(v)}`);
    }
    const v6 = new Request('https://example.test/', { headers: { 'X-Real-IP': ' 2001:db8::1 ' } });
    assert.strictEqual(getClientIp(v6), '2001:db8::1', 'IPv6 accepted, whitespace trimmed');
  });

  await t('every limit (ip_rate, contact_rate, tool_error_rate, media/office hour+day, imagegen_ip) keys on the real IP', async () => {
    const h = hashIp(REAL);
    await checkIpRateLimit(forged());
    await checkContactRateLimit(forged());
    await checkToolErrorRateLimit(forged());
    await checkHourDayRateLimit(forged(), { prefix: 'media_rate', perHour: 5, perDay: 20 }); // what app/api/media/ticket calls
    await reserveImageGen(forged());
    const keys = calls.flatMap((c) => c.params.p_buckets);
    assert.deepStrictEqual(keys, [
      `ip_rate:hour:${h}`, `ip_rate:day:${h}`,
      `contact_rate:hour:${h}`, `contact_rate:day:${h}`,
      `tool_error_rate:hour:${h}`, `tool_error_rate:day:${h}`,
      `media_rate:hour:${h}`, `media_rate:day:${h}`,
      `imagegen_ip:day:${h}`, 'imagegen_spend_micros',
    ]);
    assert.ok(!keys.some((k) => k.includes(hashIp('1.2.3.4'))), 'the forged IP never reaches a bucket');
  });

  await t('no server code reads x-forwarded-for (or other client-settable IP headers) any more', async () => {
    const offenders = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(c|m)?[jt]sx?$/.test(e.name)) {
          const s = fs.readFileSync(p, 'utf8');
          if (/['"`](x-forwarded-for|x-vercel-forwarded-for|cf-connecting-ip|true-client-ip|forwarded)['"`]/i.test(s)) offenders.push(path.relative(ROOT, p));
        }
      }
    };
    walk(path.join(ROOT, 'lib'));
    walk(path.join(ROOT, 'app', 'api'));
    assert.deepStrictEqual(offenders, []);
  });

  console.log(`\n${pass} passed`);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
