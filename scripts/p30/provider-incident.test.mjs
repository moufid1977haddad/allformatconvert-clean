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
    checkStateTransition: async (key, isProblem) => {
      const was = state.get(key) === 1;
      if (was === isProblem) return { alert: false };
      state.set(key, isProblem ? 1 : 0);
      return { alert: true, recovered: !isProblem };
    },
    sendAlert: async (service, status) => { sent.push({ service, status }); return { ntfy: 'sent', email: 'sent' }; },
  };
}

test('classification: outage now, transient when repeated, file errors never', () => {
  const c = inc.classifyProviderFailure;
  assert.equal(c({ httpStatus: 403, code: 'quota_exceeded' }), 'outage');
  assert.equal(c({ httpStatus: 402 }), 'outage');
  assert.equal(c({ httpStatus: 401, code: 'invalid_token' }), 'outage');
  assert.equal(c({ httpStatus: 429, code: 'insufficient_quota' }), 'outage');
  assert.equal(c({ httpStatus: 429, code: 'rate_limit_exceeded' }), 'transient');
  assert.equal(c({ httpStatus: 503, code: 'rate_limited' }), 'transient');
  assert.equal(c({ httpStatus: 502 }), 'transient');
  assert.equal(c({}), 'transient'); // no answer at all
  assert.equal(c({ httpStatus: 500, code: 'corrupted_file' }), null);
  assert.equal(c({ httpStatus: 415, code: 'unsupported_format' }), null);
  assert.equal(c({ code: 'not_production' }), null);
  assert.equal(c({ httpStatus: 400 }), null);
});

test('quota refusal: one alert per incident, then one recovery', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d), 'opened');
  for (let i = 0; i < 5; i++) assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d), 'already-open');
  assert.equal(d.sent.length, 1);
  assert.equal(d.sent[0].service, 'convertapi');
  assert.match(d.sent[0].status, /^down \(quota_exceeded, HTTP 403\)/);
  assert.equal(await inc.reportProviderSuccess('convertapi', d), 'recovered');
  assert.deepEqual(d.sent[1], { service: 'convertapi', status: 'recovered' });
  // later successes inside the recheck interval do not even read the state
  assert.equal(await inc.reportProviderSuccess('convertapi', d), 'skipped');
  d.setNow(d.now() + inc.SUCCESS_RECHECK_MS + 1);
  assert.equal(await inc.reportProviderSuccess('convertapi', d), 'fine');
  assert.equal(d.sent.length, 2);
  // a new incident after recovery alerts again
  assert.equal(await inc.reportProviderFailure('convertapi', { httpStatus: 403, code: 'quota_exceeded' }, d), 'opened');
  assert.equal(d.sent.length, 3);
});

test('transient failures open an incident only on the third inside the window', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 502 }, d), 'counted');
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 503 }, d), 'counted');
  assert.equal(d.sent.length, 0);
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 500 }, d), 'opened');
  assert.equal(d.sent.length, 1);
  // two failures in one window and one in the next do not add up
  const d2 = memoryDeps(Date.UTC(2026, 9, 4, 12, 8, 0));
  await inc.reportProviderFailure('pangram', { httpStatus: 500 }, d2);
  await inc.reportProviderFailure('pangram', { httpStatus: 500 }, d2);
  d2.setNow(Date.UTC(2026, 9, 4, 12, 11, 0));
  assert.equal(await inc.reportProviderFailure('pangram', { httpStatus: 500 }, d2), 'counted');
  assert.equal(d2.sent.length, 0);
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

test('a broken counter or state store never throws and never hides an outage', async () => {
  inc._resetForTests();
  const d = memoryDeps();
  d.incrementCounter = async () => { throw new Error('db down'); };
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 502 }, d), 'opened');
  const e = memoryDeps();
  e.checkStateTransition = async () => { throw new Error('db down'); };
  assert.equal(await inc.reportProviderFailure('openai', { httpStatus: 403 }, e), 'ignored');
  assert.equal(await inc.reportProviderSuccess('openai', e), 'skipped');
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
    for (const env of [undefined, 'preview', 'development']) {
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
