const assert = require('node:assert');
const { reserveUserQuota, releaseUserQuota, getUserQuotaRemaining } = require('../../lib/quota/userQuota');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');

async function main() {
  const userId = 'test-user-' + Date.now();
  const bucketKey = `user_quota:pdf_conversions:${userId}`;
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucketKey);

  const before = await getUserQuotaRemaining(userId, 'pdf_conversions');
  assert.strictEqual(before.remaining, before.cap, 'a brand-new account should start at full balance');

  const r1 = await reserveUserQuota(userId, 'pdf_conversions');
  assert.strictEqual(r1.allowed, true);
  assert.strictEqual(r1.remaining, before.cap - 1);

  await releaseUserQuota(userId, 'pdf_conversions'); // simulates a provider failure after reservation
  const afterRelease = await getUserQuotaRemaining(userId, 'pdf_conversions');
  assert.strictEqual(afterRelease.remaining, before.cap, 'a released reservation must restore the full balance -- verification #4');

  // 10 concurrent reservations against this account's quota-of-5 default must let exactly 5 through.
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucketKey);
  const { incrementCounter } = require('../../lib/quota/counters');
  const period = currentUtcMonthKey();
  const results = await Promise.all(Array.from({ length: 10 }, () => incrementCounter(bucketKey, period, 1, 5)));
  const allowedCount = results.filter((r) => r.allowed).length;
  assert.strictEqual(allowedCount, 5, `expected exactly 5 of 10 concurrent reservations against a quota of 5, got ${allowedCount}`);

  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucketKey);
  console.log('PASS: user quota reserve/release, balance read, and 10-concurrent-vs-5 atomicity.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
