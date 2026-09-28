// node scripts/quota-tests/20-atomic-pair-concurrency.js
//
// No Supabase, no SUPABASE_SERVICE_ROLE_KEY: the REAL supabase/usage_counters.sql
// (increment_usage_counters_all_or_none included) runs in an in-process Postgres
// (PGlite, a devDependency). lib/quota/supabaseAdmin.js is replaced in require.cache
// by a stub whose .rpc() executes the SQL function in PGlite and records every call,
// so the production JS (counters.js, hourDayRateLimit.js, ipRateLimit.js, imageGen.js)
// runs unmodified against the real SQL.
//
// Limitation, stated plainly: PGlite is a single-connection Postgres, so the
// "concurrent" Promise.all calls below are queued, not truly parallel. What this
// proves is the all-or-none contract under heavy interleaving of calls near the
// caps. Cross-session row locking relies on the same INSERT ... ON CONFLICT DO
// UPDATE ... WHERE guard as the existing increment_usage_counter, plus a fixed
// (bucket_key, period_key) lock order -- by construction, not by this test.
process.env.IP_RATE_LIMIT_PER_HOUR = '3';
process.env.IP_RATE_LIMIT_PER_DAY = '5';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
let db;
const calls = [];

const stub = {
  async rpc(name, params) {
    calls.push({ name, params });
    try {
      let res;
      if (name === 'increment_usage_counters_all_or_none') {
        res = await db.query('select * from increment_usage_counters_all_or_none($1::text[], $2::text[], $3::bigint[], $4::bigint[])',
          [params.p_buckets, params.p_periods, params.p_amounts, params.p_caps]);
      } else if (name === 'increment_usage_counter') {
        res = await db.query('select * from increment_usage_counter($1, $2, $3, $4)', [params.p_bucket_key, params.p_period_key, params.p_amount, params.p_cap]);
      } else if (name === 'decrement_usage_counter') {
        res = await db.query('select decrement_usage_counter($1, $2, $3)', [params.p_bucket_key, params.p_period_key, params.p_amount]);
      } else if (name === 'adjust_usage_counter') {
        res = await db.query('select adjust_usage_counter($1, $2, $3) as v', [params.p_bucket_key, params.p_period_key, params.p_delta]);
        return { data: res.rows[0].v, error: null };
      } else {
        throw new Error(`unexpected rpc ${name}`);
      }
      return { data: res.rows, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  },
};
require.cache[require.resolve(path.join(ROOT, 'lib/quota/supabaseAdmin.js'))] = {
  id: 'supabaseAdmin-stub', loaded: true, exports: { supabaseAdmin: stub },
};

const { incrementCountersAllOrNone } = require('../../lib/quota/counters');
const { checkIpRateLimit } = require('../../lib/quota/ipRateLimit');
const { reserveImageGen, IMAGE_GEN_PER_IP_PER_DAY } = require('../../lib/quota/imageGen');
const { hashIp } = require('../../lib/quota/ipHash');
const { currentUtcHourKey, currentUtcDayKey } = require('../../lib/quota/period');

async function value(b, p) {
  const r = await db.query('select value from usage_counters where bucket_key = $1 and period_key = $2', [b, p]);
  return r.rows.length ? Number(r.rows[0].value) : null; // null = no row at all
}
async function rowCount() { return Number((await db.query('select count(*)::int as n from usage_counters')).rows[0].n); }
const sqlCall = (items) => db.query('select * from increment_usage_counters_all_or_none($1::text[], $2::text[], $3::bigint[], $4::bigint[]) order by idx',
  [items.map((i) => i[0]), items.map((i) => i[1]), items.map((i) => i[2]), items.map((i) => i[3])]);

let pass = 0;
async function t(name, fn) {
  await db.exec('truncate usage_counters');
  calls.length = 0;
  await fn();
  pass++;
  console.log('PASS', name);
}

(async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  db = new PGlite();
  // Supabase's roles, so the file's REVOKE statements run exactly as written.
  await db.exec('create role anon; create role authenticated;');
  await db.exec(fs.readFileSync(path.join(ROOT, 'supabase/usage_counters.sql'), 'utf8'));

  await t('the migration file creates the function and revokes it from public/anon/authenticated', async () => {
    const migration = fs.readFileSync(path.join(ROOT, 'docs/audit/migration-quota-atomique-29-09.sql'), 'utf8');
    // Re-applying the standalone migration on top must be a no-op (create or replace).
    const body = migration.split('-- ==== MIGRATION ====')[1].split('-- ==== AFTER ====')[0];
    await db.exec(body);
    const r = await db.query(`select has_function_privilege('anon', 'increment_usage_counters_all_or_none(text[],text[],bigint[],bigint[])', 'execute') as anon,
                                     has_function_privilege('authenticated', 'increment_usage_counters_all_or_none(text[],text[],bigint[],bigint[])', 'execute') as auth`);
    assert.deepStrictEqual(r.rows[0], { anon: false, auth: false });
  });

  await t('both under cap: both incremented, one row per input in input order', async () => {
    const r = await sqlCall([['z:hour', 'P', 1, 3], ['a:day', 'P', 2, 5]]);
    assert.deepStrictEqual(r.rows.map((x) => [x.idx, Number(x.new_value), x.over_cap, x.allowed]), [[1, 1, false, true], [2, 2, false, true]]);
  });

  await t('second counter over cap: the first is left EXACTLY as it was (existing row)', async () => {
    await sqlCall([['h', 'P', 2, 10], ['d', 'P', 4, 10]]);
    const r = await sqlCall([['h', 'P', 1, 10], ['d', 'P', 7, 10]]);
    assert.deepStrictEqual(r.rows.map((x) => [Number(x.new_value), x.over_cap, x.allowed]), [[2, false, false], [4, true, false]]);
    assert.strictEqual(await value('h', 'P'), 2);
    assert.strictEqual(await value('d', 'P'), 4);
  });

  await t('denied on a counter sorted LAST: earlier-applied increments are rolled back, no row created', async () => {
    // 'aaa' is applied first (lock order), then 'zzz' fails: 'aaa' must not exist afterwards.
    const r = await sqlCall([['zzz', 'P', 6, 5], ['aaa', 'P', 1, 5]]);
    assert.strictEqual(r.rows[0].allowed, false);
    assert.strictEqual(r.rows[0].over_cap, true);
    assert.strictEqual(r.rows[1].over_cap, false);
    assert.strictEqual(await rowCount(), 0);
  });

  await t('bad input is an error, not a silent allow', async () => {
    await assert.rejects(sqlCall([]), /non-empty/);
    await assert.rejects(db.query("select * from increment_usage_counters_all_or_none(array['a'], array['p','q'], array[1]::bigint[], array[1]::bigint[])"), /equal length/);
    await assert.rejects(sqlCall([['a', 'P', -1, 5]]), />= 0/);
    await assert.rejects(db.query("select * from increment_usage_counters_all_or_none(array['a', null], array['p','q'], array[1,1]::bigint[], array[1,1]::bigint[])"), /null element/);
  });

  await t('400 interleaved calls near the caps: no counter exceeds its cap; each counter == sum of ALLOWED calls (denied changed nothing)', async () => {
    // 20 visitors share one "day" counter each and 4 "hour" counters; plus one global budget.
    const HOUR_CAP = 3, DAY_CAP = 7, BUDGET_CAP = 250; // budget cost varies below
    const jobs = [];
    for (let n = 0; n < 400; n++) {
      const v = n % 20;
      const cost = 1 + (n % 3);
      jobs.push([
        [`hour:${v}:${n % 4}`, 'P', 1, HOUR_CAP],
        [`day:${v}`, 'P', 1, DAY_CAP],
        ['budget', 'P', cost, BUDGET_CAP],
      ]);
    }
    const out = await Promise.all(jobs.map((j) => sqlCall(j)));
    const expected = new Map();
    let allowedCount = 0;
    out.forEach((r, n) => {
      const allowed = r.rows[0].allowed;
      assert.ok(r.rows.every((x) => x.allowed === allowed), 'one verdict for all rows of a call');
      if (!allowed) assert.ok(r.rows.some((x) => x.over_cap), 'a denial names at least one counter');
      if (allowed) {
        allowedCount++;
        for (const [b, , a] of jobs[n]) expected.set(b, (expected.get(b) || 0) + a);
      }
    });
    const rows = (await db.query('select bucket_key, value from usage_counters')).rows;
    for (const { bucket_key: b, value: v } of rows) {
      const cap = b.startsWith('hour') ? HOUR_CAP : b.startsWith('day') ? DAY_CAP : BUDGET_CAP;
      assert.ok(Number(v) <= cap, `${b}=${v} exceeds cap ${cap}`);
      assert.strictEqual(Number(v), expected.get(b) || 0, `${b}: stored ${v} != sum of allowed calls ${expected.get(b) || 0}`);
    }
    assert.ok(allowedCount > 0 && allowedCount < 400, `both outcomes exercised (allowed ${allowedCount}/400)`);
  });

  await t('checkIpRateLimit makes exactly ONE rpc per check and never a separate decrement', async () => {
    const req = { headers: { get: (h) => (h === 'x-real-ip' ? '203.0.113.50' : null) } };
    for (let i = 0; i < 5; i++) await checkIpRateLimit(req);
    assert.strictEqual(calls.length, 5);
    assert.ok(calls.every((c) => c.name === 'increment_usage_counters_all_or_none'), calls.map((c) => c.name).join(','));
  });

  await t('checkIpRateLimit: day denial reports ip_day and leaves the hour counter untouched', async () => {
    const ip = '203.0.113.51';
    const req = { headers: { get: (h) => (h === 'x-real-ip' ? ip : null) } };
    const h = hashIp(ip);
    // Day already at its cap (5), hour empty.
    await db.query('insert into usage_counters (bucket_key, period_key, value) values ($1, $2, 5)', [`ip_rate:day:${h}`, currentUtcDayKey()]);
    const r = await checkIpRateLimit(req);
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.layer, 'ip_day');
    assert.strictEqual(await value(`ip_rate:hour:${h}`, currentUtcHourKey()), null, 'hour counter never created');
    assert.strictEqual(await value(`ip_rate:day:${h}`, currentUtcDayKey()), 5);
    assert.strictEqual(calls.length, 1);
  });

  await t('checkIpRateLimit: hour cap reports ip_hour, and the denied attempt does not count against the day', async () => {
    const ip = '203.0.113.52';
    const req = { headers: { get: (h) => (h === 'x-real-ip' ? ip : null) } };
    for (let i = 0; i < 3; i++) assert.strictEqual((await checkIpRateLimit(req)).allowed, true);
    const r = await checkIpRateLimit(req);
    assert.strictEqual(r.layer, 'ip_hour');
    assert.strictEqual(await value(`ip_rate:day:${hashIp(ip)}`, currentUtcDayKey()), 3);
  });

  await t('a failed RPC throws (route answers 503) and no second call is attempted -- nothing to desync', async () => {
    const saved = stub.rpc;
    stub.rpc = async (name, params) => { calls.push({ name, params }); return { data: null, error: { message: 'network down' } }; };
    try {
      const req = { headers: { get: () => null } };
      await assert.rejects(checkIpRateLimit(req), /network down/);
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(await rowCount(), 0);
    } finally { stub.rpc = saved; }
  });

  await t('imageGen (default deps = real counters.js): one atomic RPC; a budget refusal leaves the visitor\'s day count untouched', async () => {
    const req = { headers: { get: (h) => (h === 'x-real-ip' ? '198.51.100.60' : null) } };
    const ok = await reserveImageGen(req);
    assert.strictEqual(ok.ok, true);
    assert.deepStrictEqual(calls.map((c) => c.name), ['increment_usage_counters_all_or_none']);
    await db.query("update usage_counters set value = 4999999 where bucket_key = 'imagegen_spend_micros'");
    const ipKey = `imagegen_ip:day:${hashIp('198.51.100.60')}`;
    const refused = await reserveImageGen(req);
    assert.strictEqual(refused.status, 503);
    assert.strictEqual(await value(ipKey, currentUtcDayKey()), 1, 'still 1: the refused image was never counted');
    assert.ok(IMAGE_GEN_PER_IP_PER_DAY > 1);
    assert.strictEqual(calls.filter((c) => c.name === 'decrement_usage_counter').length, 0);
  });

  await t('incrementCountersAllOrNone rejects an empty list before any call', async () => {
    await assert.rejects(incrementCountersAllOrNone([]), /non-empty/);
    assert.strictEqual(calls.length, 0);
  });

  console.log(`\n${pass} passed`);
  await db.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
