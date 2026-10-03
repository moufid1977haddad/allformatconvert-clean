// P30 — unit tests of the provider incident tracker, the ConvertAPI plan counter, the production-only gate, the ntfy
// message and the Word to PDF backup rule. In memory only: no Supabase, no ntfy, no ConvertAPI (fetch is stubbed).
//   node --test scripts/p30/provider-incident.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// lib/quota/* create a Supabase client at load time: give it a syntactically valid, unreachable configuration.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'unit-test-not-a-key';
process.env.IP_RATE_LIMIT_PER_HOUR ||= '10';
process.env.IP_RATE_LIMIT_PER_DAY ||= '30';

const inc = require('../../lib/providerIncident.js');
const plan = require('../../lib/providers/convertApiPlan.js');

function memoryDeps(t0 = Date.UTC(2026, 9, 4, 12, 0, 0)) {
  const counters = new Map();
  const state = new Map();
  const sent = [];
  let now = t0;
  return {
    sent, state, counters,
    setNow: (t) => { now = t; },
    enabled: true,
    now: () => now,
    incrementCounter: async (b, p, amount) => {
      const k = `${b}|${p}`;
      const v = (counters.get(k) || 0) + amount;
      counters.set(k, v);
      return { newValue: v, allowed: true };
    },
    readCounter: async (b, p) => counters.get(`${b}|${p}`) || 0,
    openIncident: async (prov) => { if (state.get(prov) === 1) return false; state.set(prov, 1); return true; },
    closeIncident: async (prov) => { if (state.get(prov) !== 1) return false; state.set(prov, 0); return true; },
    incidentOpen: async (prov) => state.get(prov) === 1,
    sendAlert: async (service, status) => { sent.push({ service, status }); return { ntfy: 'sent', email: 'sent' }; },
  };
}
const MIN = 60_000;

test('classification: outage now, transient when repeated, file and request errors never', () => {
  const c = inc.classifyProviderFailure;
  assert.equal(c({ httpStatus: 403, code: 'quota_exceeded' }), 'outage');
  assert.equal(c({ httpStatus: 402 }), 'outage');
  assert.equal(c({ httpStatus: 401, code: 'invalid_token' }), 'outage');
  assert.equal(c({ httpStatus: 429, code: 'insufficient_quota' }), 'outage');
  assert.equal(c({ httpStatus: 429, code: 'rate_limit_exceeded' }), 'transient');
  assert.equal(c({ httpStatus: 503, code: 'rate_limited' }), 'transient');
  assert.equal(c({ httpStatus: 502, code: 'upstream_error' }), 'transient');
  assert.equal(c({ code: 'upstream_error' }), 'transient'); // network: no answer
  assert.equal(c({ code: 'timeout' }), 'transient'); // our own timeout
  assert.equal(c({}), 'transient');
  assert.equal(c({ httpStatus: 500, code: 'timeout' }), null); // ConvertAPI's per-file conversion timeout
  assert.equal(c({ httpStatus: 400, code: 'upstream_error' }), null); // a 4xx about the request or the file
  assert.equal(c({ httpStatus: 422, code: 'upstream_error' }), null);
  assert.equal(c({ httpStatus: 500, code: 'corrupted_file' }), null);
  assert.equal(c({ httpStatus: 415, code: 'unsupported_format' }), null);
  assert.equal(c({ code: 'not_production' }), null);
  assert.equal(c({ httpStatus: 400 }), null);
});

test('quota refusal: one alert per incident, recovery only after a quiet window', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d), 'opened');
  for (let i = 0; i < 5; i++) assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d), 'already-open');
  assert.equal(d.sent.length, 1);
  assert.equal(d.sent[0].service, 'convertapi');
  assert.match(d.sent[0].status, /^down \(quota_exceeded, HTTP 403\)/);
  assert.equal(await inc.reportProviderSuccess('convertapi', d), 'holding'); // failures still in the window
  d.setNow(d.now() + 25 * MIN);
  assert.equal(await inc.reportProviderSuccess('convertapi', d), 'recovered');
  assert.deepEqual(d.sent[1], { service: 'convertapi', status: 'recovered' });
  assert.equal(await inc.reportProviderSuccess('convertapi', d), 'skipped'); // cached on this instance
  d.setNow(d.now() + inc.SUCCESS_RECHECK_MS + 1);
  assert.equal(await inc.reportProviderSuccess('convertapi', d), 'fine');
  assert.equal(d.sent.length, 2);
  assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d), 'opened');
  assert.equal(d.sent.length, 3);
});

test('transient failures: three within a sliding 10-20 min window, across a bucket boundary too', async () => {
  inc._resetForTests();
  const d = memoryDeps(Date.UTC(2026, 9, 4, 12, 8, 0));
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 502 }, d), 'counted');
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 503 }, d), 'counted');
  d.setNow(Date.UTC(2026, 9, 4, 12, 11, 0)); // next bucket
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 500 }, d), 'opened');
  assert.equal(d.sent.length, 1);
  // one failure every 6 minutes (the reviewer's case) is still seen
  inc._resetForTests();
  const e = memoryDeps(Date.UTC(2026, 9, 4, 13, 0, 0));
  const r = [];
  for (let i = 0; i < 4; i++) { e.setNow(Date.UTC(2026, 9, 4, 13, 0, 0) + i * 6 * MIN); r.push(await inc.reportProviderFailure('pangram', { httpStatus: 500 }, e)); }
  assert.ok(r.includes('opened'), r.join(','));
  // failures far apart never open
  inc._resetForTests();
  const f = memoryDeps(Date.UTC(2026, 9, 4, 14, 0, 0));
  for (let i = 0; i < 5; i++) { f.setNow(Date.UTC(2026, 9, 4, 14, 0, 0) + i * 25 * MIN); assert.equal(await inc.reportProviderFailure('pangram', { httpStatus: 500 }, f), 'counted'); }
});

test('partial outage does not flap: no recovery while failures continue', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  for (let i = 0; i < 3; i++) await inc.reportProviderFailure('convertapi', { httpStatus: 502, code: 'upstream_error' }, d);
  assert.equal(d.sent.length, 1);
  for (let i = 0; i < 20; i++) {
    d.setNow(d.now() + 2 * MIN);
    await inc.reportProviderSuccess('convertapi', d);
    await inc.reportProviderFailure('convertapi', { httpStatus: 502, code: 'upstream_error' }, d);
  }
  assert.equal(d.sent.length, 1, 'one "down", no recovered/down pairs');
});

test('providers are tracked separately; file errors and non-production never alert', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d);
  await inc.reportProviderFailure('openai', { httpStatus: 429, code: 'insufficient_quota' }, d);
  assert.deepEqual(d.sent.map((x) => x.service), ['convertapi', 'openai']);
  assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 500, code: 'corrupted_file' }, d), 'ignored');
  const off = { ...memoryDeps(), enabled: false };
  assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, off), 'ignored');
  assert.equal(await inc.reportProviderSuccess('convertapi', off), 'skipped');
  assert.equal(off.sent.length, 0);
});

test('concurrent openings send one alert (atomic open)', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  const r = await Promise.all(Array.from({ length: 10 }, () => inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d)));
  assert.equal(r.filter((x) => x === 'opened').length, 1);
  assert.equal(d.sent.length, 1);
});

test('a broken store never throws, never hides an outage, and does not spam', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  d.incrementCounter = async () => { throw new Error('db down'); };
  d.readCounter = async () => { throw new Error('db down'); };
  d.openIncident = async () => { throw new Error('db down'); };
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 502 }, d), 'opened');
  for (let i = 0; i < 5; i++) assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 502 }, d), 'already-open');
  d.setNow(d.now() + 31 * MIN);
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 502 }, d), 'opened');
  assert.equal(d.sent.length, 2);
  d.incidentOpen = async () => { throw new Error('db down'); };
  assert.equal(await inc.reportProviderSuccess('openai', d), 'skipped');
});

test('runtime production check needs more than VERCEL_ENV', () => {
  const saved = { e: process.env.VERCEL_ENV, r: process.env.VERCEL_REGION, l: process.env.AWS_LAMBDA_FUNCTION_NAME };
  try {
    process.env.VERCEL_ENV = 'production'; delete process.env.VERCEL_REGION; delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    assert.equal(inc.isVercelProduction(), false);
    process.env.VERCEL_REGION = 'iad1';
    assert.equal(inc.isVercelProduction(), true);
    process.env.VERCEL_ENV = 'preview';
    assert.equal(inc.isVercelProduction(), false);
  } finally {
    for (const [k, v] of [['VERCEL_ENV', saved.e], ['VERCEL_REGION', saved.r], ['AWS_LAMBDA_FUNCTION_NAME', saved.l]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

test('ConvertAPI plan period starts on the renewal day', () => {
  assert.equal(plan.planPeriodKey(new Date(Date.UTC(2026, 9, 4, 0, 0, 1))), 'plan-2026-10');
  assert.equal(plan.planPeriodKey(new Date(Date.UTC(2026, 10, 3, 23, 59))), 'plan-2026-10');
  assert.equal(plan.planPeriodKey(new Date(Date.UTC(2026, 10, 4, 0, 0))), 'plan-2026-11');
  assert.equal(plan.planPeriodKey(new Date(Date.UTC(2027, 0, 2))), 'plan-2026-12');
});

test('ConvertAPI plan counter: thresholds at 50/80/100 % of 1,000, counted by credits', async () => {
  const counters = new Map();
  const alerts = [];
  const flags = new Set();
  const deps = {
    now: () => new Date(Date.UTC(2026, 9, 10)),
    incrementCounter: async (b, p, n) => { const k = `${b}|${p}`; const v = (counters.get(k) || 0) + n; counters.set(k, v); return { newValue: v }; },
    checkAndAlertThresholds: async ({ counterName, periodKey, value, cap }) => {
      for (const th of [50, 80, 100]) {
        if ((value / cap) * 100 < th) continue;
        const k = `${counterName}:${th}:${periodKey}`;
        if (!flags.has(k)) { flags.add(k); alerts.push(`${th}pct_of_cap_${value}_of_${cap}`); }
      }
    },
  };
  assert.equal(plan.CONVERTAPI_PLAN_CONVERSIONS, 1000);
  let v;
  for (let i = 0; i < 499; i++) v = await plan.recordConvertApiConversions(1, deps);
  assert.equal(v, 499);
  assert.equal(alerts.length, 0);
  await plan.recordConvertApiConversions(2, deps); // 501: one call worth two credits
  assert.deepEqual(alerts, ['50pct_of_cap_501_of_1000']);
  for (let i = 0; i < 500; i++) await plan.recordConvertApiConversions(1, deps);
  assert.deepEqual(alerts.map((a) => a.split('pct')[0]), ['50', '80', '100']);
  const broken = { ...deps, incrementCounter: async () => { throw new Error('db down'); } };
  assert.equal(await plan.recordConvertApiConversions(1, broken), null);
});

test('ConvertAPI: no real call outside Vercel production (bench placeholder excepted)', async () => {
  const { convertDocxToPdf, ConvertApiError } = require('../../lib/providers/convertApi.js');
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => { calls.push(String(url)); return new Response(JSON.stringify({ ConversionCost: 1, Files: [{ FileData: Buffer.from('%PDF-1.7').toString('base64') }] }), { status: 200 }); };
  const saved = { env: process.env.VERCEL_ENV, token: process.env.CONVERTAPI_TOKEN };
  try {
    process.env.CONVERTAPI_TOKEN = 'a-real-looking-token';
    for (const env of [undefined, 'preview', 'development', 'production']) { // 'production' alone: as from a pulled .env file
      if (env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = env;
      await assert.rejects(convertDocxToPdf(Buffer.from('x'), 'a.docx'), (e) => e instanceof ConvertApiError && e.code === 'not_production');
    }
    delete process.env.CONVERTAPI_TOKEN;
    process.env.VERCEL_ENV = 'preview';
    await assert.rejects(convertDocxToPdf(Buffer.from('x'), 'a.docx'), (e) => e.code === 'not_production');
    assert.equal(calls.length, 0, 'nothing may leave the machine');
    process.env.CONVERTAPI_TOKEN = 'local-bench-fake';
    const r = await convertDocxToPdf(Buffer.from('x'), 'a.docx');
    assert.equal(r.pdfBuffer.subarray(0, 5).toString(), '%PDF-');
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = realFetch;
    if (saved.env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = saved.env;
    if (saved.token === undefined) delete process.env.CONVERTAPI_TOKEN; else process.env.CONVERTAPI_TOKEN = saved.token;
  }
});

test('ntfy: JSON publish with a readable title and priority; the topic never in a log', async () => {
  const { sendAlert } = await import('../../lib/alert.js');
  const realFetch = globalThis.fetch;
  const realErr = console.error;
  const logs = [];
  console.error = (...a) => logs.push(a.join(' '));
  const posts = [];
  globalThis.fetch = async (url, init) => { posts.push({ url: String(url), body: JSON.parse(init.body) }); return new Response('{}', { status: 200 }); };
  const saved = { ...process.env };
  try {
    process.env.NTFY_TOPIC = 'unit-test-topic-xyz';
    delete process.env.RESEND_API_KEY;
    const r = await sendAlert('convertapi', 'down (quota_exceeded, HTTP 403). Word to PDF falls back.');
    assert.equal(r.ntfy, 'sent');
    assert.equal(r.email, 'not_configured');
    assert.equal(posts[0].url, 'https://ntfy.sh/');
    assert.equal(posts[0].body.topic, 'unit-test-topic-xyz');
    assert.equal(posts[0].body.priority, 5);
    assert.match(posts[0].body.title, /^🔴 OnlineConverTools — ConvertAPI: down/);
    await sendAlert('convertapi', 'recovered');
    assert.equal(posts[1].body.priority, 3);
    assert.match(posts[1].body.title, /ConvertAPI back to normal/);
    await sendAlert('convertapi_plan', '80pct_of_cap_800_of_1000');
    assert.equal(posts[2].body.priority, 4);
    assert.match(posts[2].body.message, /800 \/ 1000/);
    globalThis.fetch = async () => new Response('no', { status: 500 });
    assert.equal((await sendAlert('test', 'manual_trigger')).ntfy, 'http_500');
    assert.ok(!logs.join('\n').includes('unit-test-topic-xyz'), 'the topic must never be logged');
  } finally {
    globalThis.fetch = realFetch;
    console.error = realErr;
    for (const k of ['NTFY_TOPIC', 'RESEND_API_KEY']) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  }
});
