// P31 (03/10) — unit tests: the ConvertAPI plan baseline and renewal day, what the plan counter adds (real
// ConversionCost, counted failures), the wait queue on ConvertAPI's "busy" answer (one simultaneous conversion on the
// Developer plan), and the file-size constants of the ConvertAPI tools (200 MB plan cap).
// In memory only: no Supabase (the counter and alert modules are replaced in the require cache), no ConvertAPI (fetch
// is stubbed and refuses anything else), no real waiting (the queue runs on a fake clock).
//   node --test scripts/p31/convertapi-queue.test.mjs
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// lib/quota/* create a Supabase client at load time: a syntactically valid, unreachable configuration (never called).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'unit-test-not-a-key';
process.env.IP_RATE_LIMIT_PER_HOUR ||= '10';
process.env.IP_RATE_LIMIT_PER_DAY ||= '30';

// In-memory counter + threshold alerts, swapped into the modules convertApiPlan.js requires at call time.
const counters = require('../../lib/quota/counters.js');
const alerts = require('../../lib/quota/alerts.js');
const mem = { values: new Map(), alerts: [], flags: new Set() };
counters.incrementCounter = async (bucket, period, n) => {
  const k = `${bucket}|${period}`;
  const v = (mem.values.get(k) || 0) + n;
  mem.values.set(k, v);
  return { newValue: v, allowed: true };
};
alerts.checkAndAlertThresholds = async ({ counterName, periodKey, value, cap }) => {
  for (const th of [50, 80, 100]) {
    if ((value / cap) * 100 < th) continue;
    const k = `${counterName}:${th}:${periodKey}`;
    if (!mem.flags.has(k)) { mem.flags.add(k); mem.alerts.push(`${th}pct_of_cap_${value}_of_${cap}`); }
  }
};

const plan = require('../../lib/providers/convertApiPlan.js');
const api = require('../../lib/providers/convertApi.js');
const limits = require('../../lib/quota/limits.js');

const okBody = (cost = 1) => JSON.stringify({ ConversionCost: cost, Files: [{ FileName: 'a.pdf', FileData: Buffer.from('%PDF-1.7 test').toString('base64') }] });
const busyBody = JSON.stringify({ Code: 503, Message: 'No available conversion PODs. Please retry after a few seconds.' });
const planCount = () => [...mem.values.entries()].filter(([k]) => k.startsWith('convertapi_conversions|')).reduce((s, [, v]) => s + v, 0);

// Production at run time (VERCEL_ENV + a runtime marker), with fetch stubbed: nothing can leave the process.
const saved = {};
let realFetch;
let realSleep;
let realNow;
let clock;
let sleeps;
beforeEach(() => {
  for (const k of ['VERCEL_ENV', 'VERCEL_REGION', 'CONVERTAPI_TOKEN']) saved[k] = process.env[k];
  process.env.VERCEL_ENV = 'production';
  process.env.VERCEL_REGION = 'unit-test';
  process.env.CONVERTAPI_TOKEN = 'unit-test-token';
  mem.values.clear(); mem.alerts.length = 0; mem.flags.clear();
  realFetch = globalThis.fetch;
  realSleep = api._timing.sleep;
  realNow = api._timing.now;
  clock = 0;
  sleeps = [];
  api._timing.now = () => clock;
  api._timing.sleep = async (ms) => { sleeps.push(ms); clock += ms; await new Promise((r) => setImmediate(r)); };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  api._timing.sleep = realSleep;
  api._timing.now = realNow;
  for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
});

function stubConvertApi(handler) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    if (!String(url).startsWith('https://v2.convertapi.com/')) throw new Error(`unexpected fetch ${url}`);
    calls.push(String(url));
    return handler(calls.length, init);
  };
  return calls;
}

// ---------- A. plan period and baseline ----------

test('A: renewal on the 3rd, baseline of 6 for the period 2026-10-03 -> 2026-11-03 only', async () => {
  assert.equal(plan.CONVERTAPI_PLAN_RENEWAL_DAY, 3);
  assert.equal(plan.CONVERTAPI_PLAN_CONVERSIONS, 1000);
  assert.equal(plan.planPeriodKey(new Date('2026-10-03T23:08:00Z')), 'plan-2026-10');
  assert.equal(plan.planPeriodKey(new Date('2026-10-02T23:59:59Z')), 'plan-2026-09');
  assert.equal(plan.planPeriodKey(new Date('2026-11-03T00:00:00Z')), 'plan-2026-11');
  assert.equal(plan.planBaseline('plan-2026-10'), 6);
  assert.equal(plan.planBaseline('plan-2026-09'), 0);
  assert.equal(plan.planBaseline('plan-2026-11'), 0);
  assert.equal(plan.planBaseline('toString'), 0); // no prototype key leaks in

  const at = (iso) => ({ now: () => new Date(iso), incrementCounter: counters.incrementCounter, checkAndAlertThresholds: alerts.checkAndAlertThresholds });
  // First conversion counted by the site in the current period: 6 already used + 1.
  assert.equal(await plan.recordConvertApiConversions(1, at('2026-10-05T10:00:00Z')), 7);
  assert.equal(mem.values.get('convertapi_conversions|plan-2026-10'), 1, 'the stored counter holds the site\'s own count only');
  // Thresholds unchanged (50/80/100 %), checked on baseline + site count: 494 more site conversions reach 500.
  let v;
  for (let i = 0; i < 492; i++) v = await plan.recordConvertApiConversions(1, at('2026-10-20T10:00:00Z'));
  assert.equal(v, 499);
  assert.equal(mem.alerts.length, 0);
  assert.equal(await plan.recordConvertApiConversions(1, at('2026-10-20T10:00:00Z')), 500);
  assert.deepEqual(mem.alerts, ['50pct_of_cap_500_of_1000']);
  // The next period starts from 0: no baseline carried over.
  assert.equal(await plan.recordConvertApiConversions(1, at('2026-11-04T10:00:00Z')), 1);
});

// ---------- B. what the counter adds ----------

test('B: a 2xx adds its real ConversionCost; a processed failure adds 1; refusals add nothing', async () => {
  stubConvertApi(() => new Response(okBody(3), { status: 200 }));
  const r = await api.convertDocxToPdf(Buffer.from('docx'), 'a.docx');
  assert.equal(r.costMicros, 3 * 10_000);
  assert.equal(planCount(), 3);

  for (const [status, counted] of [[500, 1], [400, 1], [415, 1], [401, 0], [402, 0], [403, 0]]) {
    mem.values.clear();
    stubConvertApi(() => new Response(JSON.stringify({ Code: status * 10, Message: 'x' }), { status }));
    await assert.rejects(api.convertDocxToPdf(Buffer.from('docx'), 'a.docx'), (e) => e instanceof api.ConvertApiError && e.httpStatus === status && e.billed === false);
    assert.equal(planCount(), counted, `HTTP ${status}`);
  }
  assert.equal(api.countedFailure(503), false);
  assert.equal(api.countedFailure(429), false);
  assert.equal(api.countedFailure(500), true);
});

// ---------- D. the wait queue ----------

test('D: budget keeps the conversion inside maxDuration (60 s small file, less for a big one)', () => {
  const MiB = 1024 * 1024;
  assert.equal(api.convertApiQueueBudgetMs(100 * 1024), 60_000);
  assert.equal(api.convertApiQueueBudgetMs(20 * MiB), 60_000); // 90 s conversion timeout + 60 s wait
  assert.equal(api.convertApiQueueBudgetMs(100 * MiB), 10_000); // 240 s timeout + 10 s wait
  for (const mb of [0, 1, 10, 50, 70, 99, 100, 150]) {
    const bytes = mb * MiB;
    const timeout = Math.min(240_000, 30_000 + Math.ceil(bytes / MiB) * 3_000);
    assert.ok(api.convertApiQueueBudgetMs(bytes) + timeout <= 250_000, `${mb} MiB stays under 250 s`);
  }
  assert.deepEqual([1, 2, 3, 4, 5, 9].map((n) => api.convertApiRetryDelayMs(n, null)), [3_000, 5_000, 10_000, 15_000, 15_000, 15_000]);
  assert.equal(api.convertApiRetryDelayMs(1, '7'), 7_000); // Retry-After honoured
  assert.equal(api.convertApiRetryDelayMs(1, '0'), 1_000);
  assert.equal(api.convertApiRetryDelayMs(1, '120'), 15_000);
  assert.equal(api.convertApiRetryDelayMs(2, 'Wed, 21 Oct 2026 07:28:00 GMT'), 5_000); // an HTTP date: schedule
  assert.equal(api.classifyFailure(503), 'rate_limited');
  assert.equal(api.classifyFailure(429), 'rate_limited');
});

test('D: "busy" twice, then converted: the visitor gets the file, one conversion counted', async () => {
  const calls = stubConvertApi((n) => (n <= 2 ? new Response(busyBody, { status: 503 }) : new Response(okBody(1), { status: 200 })));
  const r = await api.convertPdfToDocx(Buffer.from('%PDF-1.4 no actualtext'), 'a.pdf');
  assert.ok(r.docxBuffer.length > 0);
  assert.equal(calls.length, 3);
  assert.deepEqual(sleeps, [3_000, 5_000]);
  assert.equal(planCount(), 1, 'the refused 503s are not counted');
});

test('D: Retry-After from ConvertAPI is followed', async () => {
  stubConvertApi((n) => (n === 1 ? new Response(busyBody, { status: 503, headers: { 'Retry-After': '2' } }) : new Response(okBody(), { status: 200 })));
  await api.convertDocxToPdf(Buffer.from('docx'), 'a.docx');
  assert.deepEqual(sleeps, [2_000]);
});

test('D: busy for the whole budget: gives up inside it with rate_limited, nothing counted', async () => {
  const calls = stubConvertApi(() => new Response(busyBody, { status: 503 }));
  await assert.rejects(api.convertDocxToPdf(Buffer.from('docx'), 'a.docx'), (e) => e instanceof api.ConvertApiError && e.code === 'rate_limited' && e.httpStatus === 503 && !e.billed);
  const waited = sleeps.reduce((a, b) => a + b, 0);
  assert.deepEqual(sleeps, [3_000, 5_000, 10_000, 15_000, 15_000]); // 48 s; one more 15 s would pass 60 s
  assert.ok(waited <= 60_000);
  assert.equal(calls.length, 6);
  assert.equal(planCount(), 0);
});

test('D: a big file waits less (10 s budget at 100 MiB)', async () => {
  stubConvertApi(() => new Response(busyBody, { status: 503 }));
  await assert.rejects(api.convertDocxToPdf(Buffer.alloc(100 * 1024 * 1024), 'big.docx'), (e) => e.code === 'rate_limited');
  assert.deepEqual(sleeps, [3_000, 5_000]);
});

test('D: a non-busy failure is never retried', async () => {
  for (const status of [500, 403, 401, 415]) {
    sleeps.length = 0;
    const calls = stubConvertApi(() => new Response('{"Code":5001}', { status }));
    await assert.rejects(api.convertDocxToPdf(Buffer.from('docx'), 'a.docx'));
    assert.equal(calls.length, 1, `HTTP ${status}`);
    assert.equal(sleeps.length, 0);
  }
});

test('D: two visitors at once on a one-conversion plan: both get their file', async () => {
  // A mock ConvertAPI that runs ONE conversion at a time and answers 503 to anything arriving meanwhile.
  let busy = false;
  let refused = 0;
  stubConvertApi(async () => {
    if (busy) { refused += 1; return new Response(busyBody, { status: 503 }); }
    busy = true;
    await new Promise((r) => setTimeout(r, 30)); // the conversion runs (real time, short)
    busy = false;
    return new Response(okBody(1), { status: 200 });
  });
  // Real (scaled) waiting so the first conversion can finish while the second waits.
  api._timing.sleep = async (ms) => { sleeps.push(ms); clock += ms; await new Promise((r) => setTimeout(r, 50)); };
  const [a, b] = await Promise.all([
    api.convertDocxToPdf(Buffer.from('one'), 'one.docx'),
    api.convertDocxToPdf(Buffer.from('two'), 'two.docx'),
  ]);
  assert.ok(a.pdfBuffer.length > 0 && b.pdfBuffer.length > 0);
  assert.ok(refused >= 1, 'the second request was refused at least once, then served');
  assert.equal(planCount(), 2);
});

// ---------- E. file-size constants of the ConvertAPI tools ----------

test('E: no ConvertAPI tool accepts or announces more than the plan\'s 200 MB', () => {
  const PLAN_MAX = 200 * 1000 * 1000; // ConvertAPI "200 MB Maximum file size" (Developer); read as decimal MB, the stricter reading
  const MiB = 1024 * 1024;
  assert.ok(limits.MAX_CONVERTAPI_FILE_BYTES <= PLAN_MAX);
  assert.ok(limits.MAX_OFFICE_STAGED_BYTES <= PLAN_MAX); // Word to PDF (.docx), and Office files added to Merge PDF
  assert.ok(limits.MAX_PDF_TO_WORD_STAGED_BYTES <= PLAN_MAX); // PDF to Word, Excel, PowerPoint
  assert.ok(limits.MAX_SPREADSHEET_STAGED_BYTES <= limits.MAX_OFFICE_STAGED_BYTES);
  // The values the pages show (officeMaxLabel rounds MiB).
  assert.equal(Math.round(limits.MAX_OFFICE_STAGED_BYTES / MiB), 100);
  assert.equal(Math.round(limits.MAX_PDF_TO_WORD_STAGED_BYTES / MiB), 99);

  // Every size written in the five tools' pages, metadata and FAQ stays at or under what the server accepts for them.
  const files = [
    'app/tools/pdf-tools/word-to-pdf/page.jsx', 'app/tools/pdf-tools/word-to-pdf/layout.tsx',
    'app/tools/pdf-tools/pdf-to-word/page.jsx', 'app/tools/pdf-tools/pdf-to-word/layout.tsx',
    'app/tools/pdf-tools/pdf-to-excel/page.jsx', 'app/tools/pdf-tools/pdf-to-excel/layout.tsx',
    'app/tools/pdf-tools/pdf-to-ppt/page.jsx', 'app/tools/pdf-tools/pdf-to-ppt/layout.tsx',
  ];
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s?(MB|GB|Mo|Go)\b/g)) {
      const mb = Number(m[1]) * (m[2] === 'GB' || m[2] === 'Go' ? 1000 : 1);
      assert.ok(mb <= 100, `${f} announces ${m[0]}`);
    }
  }
  // Merge PDF: its 700 MB is the in-browser merge of PDFs and images (never uploaded); Office files are checked one by
  // one against the server's caps before any upload (officeCapFor + checkOfficeSize), and the page says so.
  const merge = fs.readFileSync(path.join(ROOT, 'app/tools/pdf-tools/pdf-merge/page.jsx'), 'utf8');
  assert.match(merge, /checkOfficeSize\(/);
  assert.match(merge, /officeCapFor\(/);
  // The PDF Tools category FAQ: the ConvertAPI tools' limits as the pages show them.
  const cat = fs.readFileSync(path.join(ROOT, 'app/tools/pdf-tools/page.jsx'), 'utf8');
  assert.match(cat, /PDF to Word, Excel and PowerPoint up to 99 MB/);
});
