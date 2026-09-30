// AI Detector (Pangram): its own two limits, and NOT the shared guard (guard.js is not called by /api/ai-detect).
//
//   1. per visitor (hashed IP): AI_DETECT_WORDS_PER_IP_PER_DAY billed words per UTC day. The free tiers of the
//      reference detectors, read on 30/09/2026: Pangram 20 credits = 2,000 words a day (free account,
//      pangram.com/knowledge-hub/what-do-i-get-with-a-free-account); GPTZero 10,000 words a month (~330 a day,
//      account); Originality.ai 3 scans a day; ZeroGPT 15,000 characters per check without an account. We match the
//      most generous per-day allowance of a trained detector (Pangram's), without asking for an account.
//   2. a monthly budget of its own, AI_DETECT_MONTHLY_BUDGET_MICROS ($50), set by the owner on 30/09/2026 and
//      SEPARATE from the site-wide $20 cap (GLOBAL_SPEND_CAP_USD) that the other paid tools share: the detector can
//      never use up their budget, and they can never use up its.
// Each analysis reserves its exact price before Pangram is called (Pangram bills $0.05 per started 100 words; the
// price is known from the text), in ONE atomic call with the visitor's words: both or neither.
const { isIPv6 } = require('node:net');
const { clientIpBucketId, getClientIp, hashIp } = require('./ipHash');
const { currentUtcDayKey, currentUtcMonthKey, secondsUntilNextUtcDay, nextUtcMonthLabel, secondsUntilNextUtcMonth } = require('./period');

const AI_DETECT_WORDS_PER_IP_PER_DAY = 2000;
const AI_DETECT_MONTHLY_BUDGET_MICROS = 50_000_000; // $50 a month, the detector's own cap
const BUDGET_KEY = 'aidetect_spend_micros';
// Vercel PREVIEWS only (behind Vercel's deployment protection, never reachable by visitors): the 97-text measurement
// corpus (~19,000 billed words, P17) is run from one machine, so the per-visitor allowance is raised there. The
// monthly $50 budget is the same everywhere: it is real money.
const AI_DETECT_PREVIEW_WORDS_PER_IP_PER_DAY = 30000;
// One IPv6 subscriber usually holds a whole /64 (RFC 6177 advises /48 to /64 per site): counting each of its 2^64
// addresses apart would let one visitor rotate addresses and use up the month's budget (review P17). IPv4: the address.
function visitorBucketId(req) {
  const ip = getClientIp(req);
  if (ip && isIPv6(ip) && !/^::ffff:\d/i.test(ip)) return hashIp('v6/64:' + expandV6(ip).slice(0, 4).join(':'));
  return clientIpBucketId(req);
}
function expandV6(ip) {
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const h = head ? head.split(':') : [], t = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...h, ...Array(8 - h.length - t.length).fill('0'), ...t] : h;
  return groups.map((g) => g.replace(/^0+(?=.)/, ''));
}

function wordsPerIpPerDay(env = process.env) {
  return env.VERCEL_ENV === 'preview' ? AI_DETECT_PREVIEW_WORDS_PER_IP_PER_DAY : AI_DETECT_WORDS_PER_IP_PER_DAY;
}

/**
 * @param {{ headers: { get(name: string): string | null } }} req
 * @param {{ words: number, costMicros: number }} analysis  billed words (a multiple of 100) and their price
 * @param {any} [deps]  counters (tests pass in-memory ones)
 * @param {Record<string, string | undefined>} [env]
 * @returns {Promise<{ok:false,status:number,error:string,retryAfter:number}|{ok:true,release:()=>Promise<void>}>}
 */
async function reserveAiDetect(req, { words, costMicros }, deps, env = process.env) {
  if (!Number.isInteger(words) || words <= 0 || !Number.isInteger(costMicros) || costMicros <= 0) {
    throw new Error(`reserveAiDetect: invalid analysis ${JSON.stringify({ words, costMicros })}`);
  }
  // Loaded lazily: counters.js opens the Supabase client at import, which tests must never do.
  deps = deps || require('./counters');
  const ipKey = `aidetect_ip:day:${visitorBucketId(req)}`;
  const dayKey = currentUtcDayKey();
  const monthKey = currentUtcMonthKey();
  const perDay = wordsPerIpPerDay(env);

  const r = await deps.incrementCountersAllOrNone([
    { bucketKey: ipKey, periodKey: dayKey, amount: words, cap: perDay },
    { bucketKey: BUDGET_KEY, periodKey: monthKey, amount: costMicros, cap: AI_DETECT_MONTHLY_BUDGET_MICROS },
  ]);
  // The visitor's own limit is reported first: it is the one they can act on.
  if (!r.allowed && (r.results[0].overCap || !r.results[1].overCap)) {
    const left = Math.max(0, perDay - r.results[0].newValue);
    return {
      ok: false, status: 429, retryAfter: secondsUntilNextUtcDay(),
      error: left > 0
        ? `This analysis counts ${words} words and ${left} of today's ${perDay} free words are left. Shorten the text, or come back tomorrow (the count resets at midnight UTC).`
        : `You have used today's ${perDay} free words. More tomorrow (the count resets at midnight UTC).`,
    };
  }
  if (!r.allowed) {
    // The last analyses rarely land exactly on $50: say "100 %" once when the budget starts refusing.
    try {
      const checkAndAlertThresholds = deps.checkAndAlertThresholds || require('./alerts').checkAndAlertThresholds;
      await checkAndAlertThresholds({ counterName: 'ai_detect_spend', periodKey: monthKey, value: AI_DETECT_MONTHLY_BUDGET_MICROS, cap: AI_DETECT_MONTHLY_BUDGET_MICROS });
    } catch (err) {
      console.error('ai-detect budget alert check failed (non-fatal):', err.message);
    }
    return { ok: false, status: 503, retryAfter: secondsUntilNextUtcMonth(), error: `The AI detector has reached its monthly budget — a site-wide limit, not something on your end. It resets on ${nextUtcMonthLabel()}.` };
  }
  // Alerting is best-effort: a failure here must never undo a reservation that already succeeded.
  try {
    const checkAndAlertThresholds = deps.checkAndAlertThresholds || require('./alerts').checkAndAlertThresholds;
    await checkAndAlertThresholds({ counterName: 'ai_detect_spend', periodKey: monthKey, value: r.results[1].newValue, cap: AI_DETECT_MONTHLY_BUDGET_MICROS });
  } catch (err) {
    console.error('ai-detect budget alert check failed (non-fatal, reservation stands):', err.message);
  }

  // Each give-back happens once; a call that failed part-way can be repeated and only does what is left.
  let budgetBack = false, wordsBack = false;
  return {
    ok: true,
    // Only when Pangram refused to create the task (nothing billed): give back both the budget and the words. Two
    // calls, on purpose: a failure part-way leaves a counter too high (an over-count), never too low.
    async release() {
      if (!budgetBack) { await deps.decrementCounter(BUDGET_KEY, monthKey, costMicros); budgetBack = true; }
      if (!wordsBack) { await deps.decrementCounter(ipKey, dayKey, words); wordsBack = true; }
    },
  };
}

module.exports = { reserveAiDetect, visitorBucketId, AI_DETECT_WORDS_PER_IP_PER_DAY, AI_DETECT_PREVIEW_WORDS_PER_IP_PER_DAY, AI_DETECT_MONTHLY_BUDGET_MICROS };
