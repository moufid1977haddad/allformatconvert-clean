// PDF Translate, whole document (Google Cloud Translation, P25 / E3): its own two limits, on the model of the AI
// Detector's (lib/quota/aiDetect.js), and NOT the shared guard.
//
//   1. per visitor (hashed IP, IPv6 by /64): PDF_TRANSLATE_PAGES_PER_IP_PER_DAY pages per UTC day. The reference
//      free offers, read on 03/10/2026: DeepL's free web translator, 3 documents a month (read-only); Google
//      Translate's web page, free but without the layout of a PDF guaranteed; iLovePDF, behind its own credits.
//      20 pages a day without an account is above DeepL's free allowance and fits Google's online limit for a
//      scanned PDF (20 pages per document).
//   2. a monthly budget of its own, PDF_TRANSLATE_MONTHLY_BUDGET_MICROS (30 $), set by the owner on 03/10/2026 and
//      SEPARATE from the site-wide cap and from the AI Detector's: it can never use up theirs, nor they its.
// Each translation reserves its price before Google is called, in ONE atomic call with the visitor's pages: both or
// neither. Price: Google bills 0.08 $ a page; PAGE_COST_MICROS reserves 0.10 $, because Google may count a very dense
// page as more than one (its billing does not come back in the answer): the 30 $ hold whatever the pages.
const { isIPv6 } = require('node:net');
const { clientIpBucketId, getClientIp, hashIp } = require('./ipHash');
const { currentUtcDayKey, currentUtcMonthKey, secondsUntilNextUtcDay, nextUtcMonthLabel, secondsUntilNextUtcMonth } = require('./period');

const PDF_TRANSLATE_PAGES_PER_IP_PER_DAY = 20;
const PDF_TRANSLATE_MAX_PAGES = 20; // per document
const PDF_TRANSLATE_MONTHLY_BUDGET_MICROS = 30_000_000; // 30 $ a month, its own cap
const PAGE_COST_MICROS = 100_000; // 0.10 $ reserved for Google's 0.08 $ a page
const BUDGET_KEY = 'pdftranslate_spend_micros';
// Vercel PREVIEWS only (behind deployment protection): the test bench runs from one machine. The budget is the same.
const PDF_TRANSLATE_PREVIEW_PAGES_PER_IP_PER_DAY = 60;

function expandV6(ip) {
  const [head, tail = ''] = ip.toLowerCase().split('%')[0].split('::');
  const h = head ? head.split(':') : [], t = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h;
  return groups.map((g) => g.replace(/^0+(?=.)/, ''));
}
function visitorBucketId(req) {
  const ip = getClientIp(req);
  if (ip && isIPv6(ip) && !/^::ffff:/i.test(ip)) return hashIp('v6/64:' + expandV6(ip).slice(0, 4).join(':'));
  return clientIpBucketId(req);
}
const pagesPerIpPerDay = (env = process.env) => (env.VERCEL_ENV === 'preview' ? PDF_TRANSLATE_PREVIEW_PAGES_PER_IP_PER_DAY : PDF_TRANSLATE_PAGES_PER_IP_PER_DAY);

/**
 * @param {{ headers: { get(name: string): string | null } }} req
 * @param {{ pages: number }} job
 * @param {any} [deps]  counters (tests pass in-memory ones)
 * @param {Record<string, string | undefined>} [env]
 * @returns {Promise<{ok:false,status:number,error:string,retryAfter:number}|{ok:true,costMicros:number,pagesPerDay:number,release:()=>Promise<void>,releasePagesOnly:()=>Promise<void>}>}
 */
async function reservePdfTranslate(req, { pages }, deps, env = process.env) {
  if (!Number.isInteger(pages) || pages <= 0 || pages > PDF_TRANSLATE_MAX_PAGES) throw new Error(`reservePdfTranslate: invalid pages ${pages}`);
  deps = deps || require('./counters'); // lazily: counters.js opens Supabase at import, which tests must never do
  const costMicros = pages * PAGE_COST_MICROS;
  const ipKey = `pdftranslate_ip:day:${visitorBucketId(req)}`;
  const dayKey = currentUtcDayKey();
  const monthKey = currentUtcMonthKey();
  const perDay = pagesPerIpPerDay(env);

  const r = await deps.incrementCountersAllOrNone([
    { bucketKey: ipKey, periodKey: dayKey, amount: pages, cap: perDay },
    { bucketKey: BUDGET_KEY, periodKey: monthKey, amount: costMicros, cap: PDF_TRANSLATE_MONTHLY_BUDGET_MICROS },
  ]);
  // The visitor's own limit first: the one they can act on.
  if (!r.allowed && (r.results[0].overCap || !r.results[1].overCap)) {
    const left = Math.max(0, perDay - r.results[0].newValue);
    return {
      ok: false, status: 429, retryAfter: secondsUntilNextUtcDay(),
      error: left > 0
        ? `This PDF has ${pages} pages and ${left} of today's ${perDay} free pages are left. Translate a shorter PDF (split it with our Split PDF), or come back tomorrow (the count resets at midnight UTC).`
        : `You have used today's ${perDay} free pages. More tomorrow (the count resets at midnight UTC).`,
    };
  }
  const alert = async (value) => {
    try {
      const checkAndAlertThresholds = deps.checkAndAlertThresholds || require('./alerts').checkAndAlertThresholds;
      await checkAndAlertThresholds({ counterName: 'pdf_translate_spend', periodKey: monthKey, value, cap: PDF_TRANSLATE_MONTHLY_BUDGET_MICROS });
    } catch (err) {
      console.error('pdf-translate budget alert check failed (non-fatal):', err.message);
    }
  };
  if (!r.allowed) {
    await alert(PDF_TRANSLATE_MONTHLY_BUDGET_MICROS);
    return { ok: false, status: 503, retryAfter: secondsUntilNextUtcMonth(), error: `Whole-document translation has reached its monthly budget — a site-wide limit, not something on your end. It resets on ${nextUtcMonthLabel()}. The text translation below still works.` };
  }
  await alert(r.results[1].newValue); // best-effort: never undoes a reservation that succeeded

  let budgetBack = false, pagesBack = false;
  return {
    ok: true,
    costMicros,
    pagesPerDay: perDay,
    // Only when Google clearly refused (nothing billed). Two calls, on purpose: a failure part-way leaves a counter too
    // high (an over-count), never too low.
    async release() {
      if (!budgetBack) { await deps.decrementCounter(BUDGET_KEY, monthKey, costMicros); budgetBack = true; }
      if (!pagesBack) { await deps.decrementCounter(ipKey, dayKey, pages); pagesBack = true; }
    },
    // When Google may have billed without answering (timeout): the visitor gets the pages back, the budget keeps them.
    async releasePagesOnly() {
      if (!pagesBack) { await deps.decrementCounter(ipKey, dayKey, pages); pagesBack = true; }
    },
  };
}

module.exports = { reservePdfTranslate, visitorBucketId, pagesPerIpPerDay, PDF_TRANSLATE_PAGES_PER_IP_PER_DAY, PDF_TRANSLATE_MAX_PAGES, PDF_TRANSLATE_MONTHLY_BUDGET_MICROS, PAGE_COST_MICROS };
