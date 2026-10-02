// P25 (E3): money and quota logic of whole-PDF translation, without Supabase or Google (in-memory counters, a fake
// Google that checks the request). node scripts/p25/pdf-translate.test.mjs
import assert from 'node:assert';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { reservePdfTranslate, PDF_TRANSLATE_MONTHLY_BUDGET_MICROS, PAGE_COST_MICROS, PDF_TRANSLATE_PAGES_PER_IP_PER_DAY } = require('../../lib/quota/pdfTranslate.js');
const { translatePdf, configured, GoogleTranslateError, resetTokenCacheForTests } = require('../../lib/providers/googleTranslate.js');
let n = 0;

// In-memory counters with the database's semantics: all-or-none, caps, decrement never below 0.
function memCounters() {
  const v = new Map(); const alerts = [];
  const k = (b, p) => `${b}|${p}`;
  return {
    v, alerts,
    async incrementCountersAllOrNone(items) {
      const results = items.map((i) => { const cur = v.get(k(i.bucketKey, i.periodKey)) || 0; return { cur, next: cur + i.amount, over: cur + i.amount > i.cap }; });
      const allowed = results.every((r) => !r.over);
      if (allowed) items.forEach((i, j) => v.set(k(i.bucketKey, i.periodKey), results[j].next));
      return { allowed, results: results.map((r) => ({ newValue: allowed ? r.next : r.cur, overCap: r.over })) };
    },
    async decrementCounter(b, p, amount) { const key = [...v.keys()].find((x) => x.startsWith(b + '|' + p)); if (key) v.set(key, Math.max(0, v.get(key) - amount)); },
    async checkAndAlertThresholds(a) { alerts.push(a.value); },
  };
}
const req = (ip) => ({ headers: { get: (h) => (h === 'x-real-ip' ? ip : null) } });
const env = { VERCEL_ENV: 'production' };

// 1. The visitor's 20 pages a day: 12 + 8 pass, then 1 more is refused with what is left; money reserved = pages × 0.10 $
let c = memCounters();
let r1 = await reservePdfTranslate(req('203.0.113.7'), { pages: 12 }, c, env);
let r2 = await reservePdfTranslate(req('203.0.113.7'), { pages: 8 }, c, env);
let r3 = await reservePdfTranslate(req('203.0.113.7'), { pages: 1 }, c, env);
assert.ok(r1.ok && r2.ok && !r3.ok && r3.status === 429 && /today's 20 free pages/.test(r3.error)); n++;
const spent = () => [...c.v.entries()].find(([key]) => key.startsWith('pdftranslate_spend_micros'))?.[1] || 0;
assert.strictEqual(spent(), 20 * PAGE_COST_MICROS); n++;
// a refused attempt changed nothing (all-or-none)
assert.strictEqual(spent(), 20 * PAGE_COST_MICROS); n++;
// 2. release gives back both, once, even if called twice
await r2.release(); await r2.release();
assert.strictEqual(spent(), 12 * PAGE_COST_MICROS); n++;
assert.ok((await reservePdfTranslate(req('203.0.113.7'), { pages: 8 }, c, env)).ok, 'the released pages are usable again'); n++;
// 3. IPv6: two addresses of the same /64 share one allowance
c = memCounters();
assert.ok((await reservePdfTranslate(req('2001:db8:1:2::a'), { pages: 15 }, c, env)).ok);
const v6 = await reservePdfTranslate(req('2001:db8:1:2:ffff::b'), { pages: 10 }, c, env);
assert.ok(!v6.ok && v6.status === 429, 'same /64'); n++;
// 4. The monthly budget: 30 $ = 300 pages at 0.10 $; the 301st page is refused for everyone, with the reset date
c = memCounters();
let ok = 0;
for (let i = 0; i < 20; i++) { const r = await reservePdfTranslate(req(`198.51.100.${i}`), { pages: 15 }, c, env); if (r.ok) ok++; }
assert.strictEqual(ok, 20); assert.strictEqual(spent(), PDF_TRANSLATE_MONTHLY_BUDGET_MICROS); n++;
const over = await reservePdfTranslate(req('198.51.100.200'), { pages: 1 }, c, env);
assert.ok(!over.ok && over.status === 503 && /monthly budget/.test(over.error) && spent() === PDF_TRANSLATE_MONTHLY_BUDGET_MICROS); n++;
assert.ok(c.alerts.includes(PDF_TRANSLATE_MONTHLY_BUDGET_MICROS), '100 % alert'); n++;
// 5. Bad input never reaches the counters
await assert.rejects(reservePdfTranslate(req('1.2.3.4'), { pages: 0 }, memCounters(), env)); n++;
await assert.rejects(reservePdfTranslate(req('1.2.3.4'), { pages: 21 }, memCounters(), env)); n++;
assert.strictEqual(PDF_TRANSLATE_PAGES_PER_IP_PER_DAY, 20); n++;

// 6. Provider: not configured without the key; with a (test) service account, the OAuth exchange and the request
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const sa = { client_email: 'translator@test-project.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), project_id: 'test-project' };
const testEnv = { GOOGLE_TRANSLATE_SERVICE_ACCOUNT: JSON.stringify(sa) };
assert.ok(!configured({}) && !configured({ GOOGLE_TRANSLATE_SERVICE_ACCOUNT: '{bad' }) && configured(testEnv)); n++;
const calls = [];
const fakeGoogle = (answer) => async (url, init) => {
  calls.push({ url, init });
  if (url === 'https://oauth2.googleapis.com/token') {
    const assertion = new URLSearchParams(init.body).get('assertion');
    const [h, p, s] = assertion.split('.');
    const valid = crypto.createVerify('RSA-SHA256').update(`${h}.${p}`).verify(publicKey, Buffer.from(s, 'base64url'));
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    assert.ok(valid && claims.iss === sa.client_email && claims.scope === 'https://www.googleapis.com/auth/cloud-translation' && claims.exp - claims.iat === 3600, 'signed JWT');
    return new Response(JSON.stringify({ access_token: 'ya29.test', expires_in: 3600 }), { status: 200 });
  }
  return answer(url, init);
};
resetTokenCacheForTests();
const pdf = Buffer.from('%PDF-1.7 source');
const out = await translatePdf(pdf, { target: 'fr' }, { env: testEnv, fetchImpl: fakeGoogle(async (url, init) => {
  const body = JSON.parse(init.body);
  assert.ok(url === 'https://translation.googleapis.com/v3/projects/test-project/locations/global:translateDocument' && init.headers.Authorization === 'Bearer ya29.test');
  assert.ok(body.targetLanguageCode === 'fr' && body.documentInputConfig.mimeType === 'application/pdf' && Buffer.from(body.documentInputConfig.content, 'base64').equals(pdf) && !('sourceLanguageCode' in body));
  return new Response(JSON.stringify({ documentTranslation: { byteStreamOutputs: [Buffer.from('%PDF-1.7 translated').toString('base64')], mimeType: 'application/pdf', detectedLanguageCode: 'en' } }), { status: 200 });
}) });
assert.ok(out.pdf.toString() === '%PDF-1.7 translated' && out.detectedLanguage === 'en'); n++;
// the token is reused (one exchange for two translations)
await translatePdf(pdf, { target: 'de' }, { env: testEnv, fetchImpl: fakeGoogle(async () => new Response(JSON.stringify({ documentTranslation: { byteStreamOutputs: [Buffer.from('%PDF-x').toString('base64')] } }), { status: 200 })) });
assert.strictEqual(calls.filter((x) => x.url.includes('oauth2')).length, 1); n++;
// 7. Failures: refused (not billed) vs answered but unusable (billed)
const fail = async (status, body) => translatePdf(pdf, { target: 'fr' }, { env: testEnv, fetchImpl: fakeGoogle(async () => new Response(body, { status })) }).catch((e) => e);
let e = await fail(429, '{"error":{"status":"RESOURCE_EXHAUSTED"}}'); assert.ok(e instanceof GoogleTranslateError && e.code === 'rate_limited' && !e.billed); n++;
e = await fail(400, '{"error":{"message":"Document has more pages than the limit"}}'); assert.ok(e.code === 'too_large' && !e.billed); n++;
e = await fail(500, 'oops'); assert.ok(e.code === 'upstream_error' && !e.billed); n++;
e = await fail(200, '{"documentTranslation":{"byteStreamOutputs":["bm90IGEgcGRm"]}}'); assert.ok(e.code === 'bad_response' && e.billed, 'a 2xx is billed'); n++;
e = await translatePdf(pdf, { target: 'fr' }, { env: {} }).catch((x) => x); assert.ok(e.code === 'not_configured'); n++;
e = await translatePdf(pdf, { target: 'fr' }, { env: testEnv, fetchImpl: fakeGoogle(async () => { const x = new Error('aborted'); x.name = 'AbortError'; throw x; }) }).catch((x) => x);
assert.ok(e.code === 'timeout' && !e.billed && e.maybeBilled === true, 'no answer: may be billed'); n++;
// releasePagesOnly gives the visitor's pages back and keeps the money
c = memCounters();
const t1 = await reservePdfTranslate(req('192.0.2.50'), { pages: 10 }, c, env);
await t1.releasePagesOnly(); await t1.releasePagesOnly();
assert.strictEqual(spent(), 10 * PAGE_COST_MICROS); n++;
assert.ok((await reservePdfTranslate(req('192.0.2.50'), { pages: 20 }, c, env)).ok, 'pages back'); n++;

// 8. The forged page tree of the review: pdf-lib counts 1 page, an xref reader 25. What the route sends Google
// (pdf-lib's re-save) is read as the SAME number of pages by pdf.js.
const { PDFDocument } = await import('@cantoo/pdf-lib');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const src = await PDFDocument.create();
for (let i = 0; i < 25; i++) src.addPage([200, 200]).drawText(`p${i + 1}`, { x: 20, y: 100 });
let raw = Buffer.from(await src.save({ useObjectStreams: false })).toString('latin1');
const pagesRef = /\/Pages (\d+) 0 R/.exec(raw)[1];
const firstKid = new RegExp(pagesRef + ' 0 obj[\\s\\S]*?/Kids \\[ ?(\\d+) 0 R').exec(raw)[1];
// a stray copy of the page tree root, after the real one, NOT in the xref: 1 kid, Count 1
const stray = `\n${pagesRef} 0 obj\n<< /Type /Pages /Kids [${firstKid} 0 R] /Count 1 >>\nendobj\n`;
const at = raw.lastIndexOf('xref');
raw = raw.slice(0, at) + stray + raw.slice(at).replace(/startxref\s+(\d+)/, (m, off) => `startxref\n${Number(off) + stray.length}`);
const forged = Buffer.from(raw, 'latin1');
const count = async (b) => (await pdfjs.getDocument({ data: new Uint8Array(b), verbosity: 0 }).promise).numPages;
const libCount = (await PDFDocument.load(forged, { ignoreEncryption: true, updateMetadata: false })).getPageCount();
const xrefCount = await count(forged);
const resaved = Buffer.from(await (await PDFDocument.load(forged, { ignoreEncryption: true, updateMetadata: false })).save({ useObjectStreams: false }));
const sentCount = await count(resaved);
console.log(`forged file: pdf-lib ${libCount} page(s), pdf.js ${xrefCount}; re-saved (what Google receives): pdf.js ${sentCount}`);
assert.ok(libCount !== xrefCount || libCount === sentCount, 'the forgery is reproduced or harmless');
assert.strictEqual(sentCount, libCount, 'Google receives the pages that were counted and paid for'); n++;
// 9. Second review: page-tree nodes without /Type (pdf-lib 1, pdf.js 25 even after a re-save). The route REBUILDS
// the document from the pages pdf-lib counted: what Google receives is read as that many pages by pdf.js.
{
  const base = await PDFDocument.create();
  for (let i = 0; i < 25; i++) base.addPage([200, 200]);
  let t = Buffer.from(await base.save({ useObjectStreams: false })).toString('latin1');
  // strip /Type /Page from every page but the first: pdf-lib then counts 1, pdf.js 25
  let seen = 0;
  t = t.replace(/\/Type \/Page(?!s)/g, (m) => (seen++ ? '/Tzpe /Page' : m));
  const odd = Buffer.from(t, 'latin1');
  const lib = (await PDFDocument.load(odd, { updateMetadata: false })).getPageCount();
  const viaPdfjs = await count(odd);
  const doc2 = await PDFDocument.load(odd, { updateMetadata: false });
  const fresh = await PDFDocument.create();
  for (const pg of await fresh.copyPages(doc2, doc2.getPageIndices())) fresh.addPage(pg);
  const sent = Buffer.from(await fresh.save({ useObjectStreams: false }));
  const sentPages = await count(sent);
  console.log(`untyped page nodes: pdf-lib ${lib}, pdf.js ${viaPdfjs}; rebuilt (what Google receives): pdf.js ${sentPages}`);
  assert.strictEqual(sentPages, lib, 'rebuilt document = pages paid for'); n++;
  // and on the first forged file too
  const d1 = await PDFDocument.load(forged, { ignoreEncryption: true, updateMetadata: false });
  const f1 = await PDFDocument.create();
  for (const pg of await f1.copyPages(d1, d1.getPageIndices())) f1.addPage(pg);
  assert.strictEqual(await count(Buffer.from(await f1.save({ useObjectStreams: false }))), d1.getPageCount()); n++;
}
console.log(`pdf-translate: ${n} checks passed`);
