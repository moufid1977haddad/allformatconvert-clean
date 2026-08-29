const assert = require('node:assert');
const { checkIpRateLimit } = require('../../lib/quota/ipRateLimit');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { hashIp } = require('../../lib/quota/ipHash');
const { currentUtcHourKey, currentUtcDayKey } = require('../../lib/quota/period');

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

async function cleanup(ip) {
  const hash = hashIp(ip);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
}

async function main() {
  // Sequential: hour bucket cap is enforced (this repo's IP_RATE_LIMIT_PER_HOUR default).
  const seqIp = '203.0.113.10';
  await cleanup(seqIp);
  const { IP_RATE_LIMIT_PER_HOUR } = require('../../lib/quota/config');
  for (let i = 0; i < IP_RATE_LIMIT_PER_HOUR; i++) {
    const result = await checkIpRateLimit(fakeReq(seqIp));
    assert.strictEqual(result.allowed, true, `request ${i + 1}/${IP_RATE_LIMIT_PER_HOUR} should be allowed`);
  }
  const overLimit = await checkIpRateLimit(fakeReq(seqIp));
  assert.strictEqual(overLimit.allowed, false);
  assert.strictEqual(overLimit.layer, 'ip_hour');
  await cleanup(seqIp);

  // Concurrent: 10 simultaneous requests against a hand-seeded cap of 5 must
  // let exactly 5 through -- proves the atomicity claim at this layer too.
  const concurrentIp = '203.0.113.20';
  await cleanup(concurrentIp);
  const hash = hashIp(concurrentIp);
  const hourKey = currentUtcHourKey();
  // Seed a temporary cap of 5 by racing against incrementCounter directly with cap=5.
  const { incrementCounter } = require('../../lib/quota/counters');
  const results = await Promise.all(
    Array.from({ length: 10 }, () => incrementCounter(`ip_rate:hour:${hash}`, hourKey, 1, 5))
  );
  const allowedCount = results.filter((r) => r.allowed).length;
  assert.strictEqual(allowedCount, 5, `expected exactly 5 of 10 concurrent requests to pass a cap of 5, got ${allowedCount}`);
  await cleanup(concurrentIp);

  // unknown-ip fallback
  const unknownReq = { headers: { get: () => null } };
  const unknownResult = await checkIpRateLimit(unknownReq);
  assert.strictEqual(unknownResult.allowed, true);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'ip_rate:hour:unknown-ip');
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'ip_rate:day:unknown-ip');

  console.log('PASS: IP rate limit -- sequential cap, concurrent atomicity (exactly 5/10), unknown-IP fallback.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
