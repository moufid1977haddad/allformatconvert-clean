// AI Image Generator: its own two limits, checked BEFORE the shared guard (guard.js is not changed).
//
//   1. per visitor (hashed IP): IMAGE_GEN_PER_IP_PER_DAY images per UTC day -- the way the reference
//      sites bound free use (Bing 15/day with an account, Ideogram ~10/day), here without an account;
//   2. a monthly budget of its own, IMAGE_GEN_MONTHLY_BUDGET_MICROS, reserved per image and settled
//      to the real cost afterwards -- so image generation can never use up the site-wide $20 cap that
//      the 15 AI tools, ConvertAPI and the background remover share (docs/audit/RAPPORT-ecarts-marche.md §3d).
// The shared guard (IP hourly/daily limits + global spend cap) still runs after these two.
const { hashIp, getClientIp } = require('./ipHash');
const { currentUtcDayKey, currentUtcMonthKey, secondsUntilNextUtcDay, nextUtcMonthIso, secondsUntilNextUtcMonth } = require('./period');
const { IMAGE_GEN_WORST_CASE_MICROS } = require('./config');

const IMAGE_GEN_PER_IP_PER_DAY = 5;
const IMAGE_GEN_MONTHLY_BUDGET_MICROS = 5_000_000; // $5 of the $20 global cap, at most

/**
 * @returns {Promise<{ok:false,status:number,error:string,retryAfter:number}|{ok:true,settle:(actualMicros:number|null)=>Promise<void>,release:()=>Promise<void>}>}
 */
async function reserveImageGen(req, deps) {
  // Loaded lazily: counters.js opens the Supabase client at import, which tests must never do.
  deps = deps || require('./counters');
  const raw = getClientIp(req);
  const ipKey = `imagegen_ip:day:${raw ? hashIp(raw) : 'unknown-ip'}`;
  const dayKey = currentUtcDayKey();
  const monthKey = currentUtcMonthKey();
  const budgetKey = 'imagegen_spend_micros';

  const ip = await deps.incrementCounter(ipKey, dayKey, 1, IMAGE_GEN_PER_IP_PER_DAY);
  if (!ip.allowed) {
    return { ok: false, status: 429, retryAfter: secondsUntilNextUtcDay(), error: `You have used today's ${IMAGE_GEN_PER_IP_PER_DAY} free images. More tomorrow (the count resets at midnight UTC).` };
  }
  const budget = await deps.incrementCounter(budgetKey, monthKey, IMAGE_GEN_WORST_CASE_MICROS, IMAGE_GEN_MONTHLY_BUDGET_MICROS);
  if (!budget.allowed) {
    await deps.decrementCounter(ipKey, dayKey, 1);
    return { ok: false, status: 503, retryAfter: secondsUntilNextUtcMonth(), error: `The image generator has reached its monthly budget — a site-wide limit, not something on your end. It resets on ${nextUtcMonthIso()}.` };
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
    // Nothing was generated (provider refused or unreachable): give both back.
    async release() {
      if (settled) return;
      settled = true;
      await deps.decrementCounter(budgetKey, monthKey, IMAGE_GEN_WORST_CASE_MICROS);
      await deps.decrementCounter(ipKey, dayKey, 1);
    },
  };
}

module.exports = { reserveImageGen, IMAGE_GEN_PER_IP_PER_DAY, IMAGE_GEN_MONTHLY_BUDGET_MICROS };
