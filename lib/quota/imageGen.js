// AI Image Generator: its own two limits, checked BEFORE the shared guard (guard.js is not changed).
//
//   1. per visitor (hashed IP): IMAGE_GEN_PER_IP_PER_DAY images per UTC day -- the way the reference
//      sites bound free use (Bing 15/day with an account, Ideogram ~10/day), here without an account;
//   2. a monthly budget of its own, IMAGE_GEN_MONTHLY_BUDGET_MICROS, reserved per image and settled
//      to the real cost afterwards -- so image generation can never use up the site-wide $20 cap that
//      the 15 AI tools, ConvertAPI and the background remover share (docs/audit/RAPPORT-ecarts-marche.md §3d).
// The shared guard (IP hourly/daily limits + global spend cap) still runs after these two.
const { clientIpBucketId } = require('./ipHash');
const { currentUtcDayKey, currentUtcMonthKey, secondsUntilNextUtcDay, nextUtcMonthLabel, secondsUntilNextUtcMonth } = require('./period');
const { IMAGE_GEN_WORST_CASE_MICROS } = require('./config');

const IMAGE_GEN_PER_IP_PER_DAY = 5;
const IMAGE_GEN_MONTHLY_BUDGET_MICROS = 5_000_000; // $5 of the $20 global cap, at most

/**
 * @returns {Promise<{ok:false,status:number,error:string,retryAfter:number}|{ok:true,settle:(actualMicros:number|null)=>Promise<void>,release:()=>Promise<void>}>}
 */
async function reserveImageGen(req, deps) {
  // Loaded lazily: counters.js opens the Supabase client at import, which tests must never do.
  deps = deps || require('./counters');
  const ipKey = `imagegen_ip:day:${clientIpBucketId(req)}`;
  const dayKey = currentUtcDayKey();
  const monthKey = currentUtcMonthKey();
  const budgetKey = 'imagegen_spend_micros';

  // The visitor's image and the budget reservation are taken in ONE atomic call: both or neither
  // (no separate give-back that a network error could skip). The visitor's limit is reported first.
  const r = await deps.incrementCountersAllOrNone([
    { bucketKey: ipKey, periodKey: dayKey, amount: 1, cap: IMAGE_GEN_PER_IP_PER_DAY },
    { bucketKey: budgetKey, periodKey: monthKey, amount: IMAGE_GEN_WORST_CASE_MICROS, cap: IMAGE_GEN_MONTHLY_BUDGET_MICROS },
  ]);
  if (!r.allowed && (r.results[0].overCap || !r.results[1].overCap)) {
    return { ok: false, status: 429, retryAfter: secondsUntilNextUtcDay(), error: `You have used today's ${IMAGE_GEN_PER_IP_PER_DAY} free images. More tomorrow (the count resets at midnight UTC).` };
  }
  if (!r.allowed) {
    return { ok: false, status: 503, retryAfter: secondsUntilNextUtcMonth(), error: `The image generator has reached its monthly budget — a site-wide limit, not something on your end. It resets on ${nextUtcMonthLabel()}.` };
  }

  let settled = false;
  return {
    ok: true,
    // Real cost known: move the reservation to it. Unknown (null): keep the worst case, never zero.
    async settle(actualMicros) {
      if (settled) return;
      settled = true;
      if (typeof actualMicros === 'number') await deps.adjustCounter(budgetKey, monthKey, actualMicros - IMAGE_GEN_WORST_CASE_MICROS);
    },
    // Nothing was generated (provider refused or unreachable): give both back. Two calls, on purpose:
    // a failure part-way leaves a counter too high (an over-count), never too low -- the safe direction.
    async release() {
      if (settled) return;
      settled = true;
      await deps.decrementCounter(budgetKey, monthKey, IMAGE_GEN_WORST_CASE_MICROS);
      await deps.decrementCounter(ipKey, dayKey, 1);
    },
  };
}

module.exports = { reserveImageGen, IMAGE_GEN_PER_IP_PER_DAY, IMAGE_GEN_MONTHLY_BUDGET_MICROS };
