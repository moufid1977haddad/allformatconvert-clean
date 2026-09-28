// AI Image Upscaler: a monthly spend cap of its own, on the model of the image generator's
// (lib/quota/imageGen.js, $5/month). Before 28/09 the upscaler was bounded only by the media
// service's per-connection ticket limits (60/day): nothing capped the month.
//
// What an upscale costs us is Railway compute + network, measured, not a provider price:
//   CPU      : the model's own seconds (returned by the service) x 8 vCPU x $0.00000772 per vCPU-second
//   network  : the PNG leaves Railway up to twice (service -> media store -> visitor), $0.05 per GB
//   memory   : <= 2 GB during the run, $0.00000386 per GB-second
// (Railway prices read live on 28/09/2026; docs/audit/RAPPORT-global-28-09.md, point 6.)
// Each image reserves the worst case of the largest accepted image before the service runs, and is
// settled to its real cost afterwards -- as the image generator does.
const { currentUtcMonthKey, nextUtcMonthLabel, secondsUntilNextUtcMonth } = require('./period');

const UPSCALE_MONTHLY_BUDGET_MICROS = 5_000_000; // $5 a month, the image generator's order of magnitude
const VCPU = 8;
const MICROS_PER_VCPU_SECOND = 7.72;
const MICROS_PER_GB_SECOND = 3.86;
const MICROS_PER_GB_OUT = 50_000;
// Worst case for the largest accepted image (6 Mpx x4: ~207 s of model time, a 96 Mpx PNG at ~2 bytes/px, twice).
const UPSCALE_WORST_CASE_MICROS = 40_000;

function upscaleCostMicros({ seconds, outputBytes }) {
  const s = Math.max(0, Number(seconds) || 0);
  const gbOut = Math.max(0, Number(outputBytes) || 0) / 1e9;
  return Math.ceil(s * VCPU * MICROS_PER_VCPU_SECOND + s * 2 * MICROS_PER_GB_SECOND + gbOut * 2 * MICROS_PER_GB_OUT);
}

// The budget can be lowered (never raised past what the code says without a code change) by a
// variable, to prove the cut-off on a preview without spending anything.
function monthlyBudgetMicros(env = process.env) {
  const v = env.UPSCALE_MONTHLY_BUDGET_MICROS;
  if (v === undefined || v === '') return UPSCALE_MONTHLY_BUDGET_MICROS;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new Error('UPSCALE_MONTHLY_BUDGET_MICROS must be a non-negative integer');
  return Math.min(n, UPSCALE_MONTHLY_BUDGET_MICROS);
}

/**
 * @returns {Promise<{ok:false,status:number,error:string,retryAfter:number}|{ok:true,settle:(r:{seconds:number,outputBytes:number}|null)=>Promise<void>,release:()=>Promise<void>}>}
 */
async function reserveUpscale(deps, env) {
  // Loaded lazily: counters.js opens the Supabase client at import, which tests must never do.
  deps = deps || require('./counters');
  const budgetKey = 'upscale_spend_micros';
  const monthKey = currentUtcMonthKey();
  const budget = await deps.incrementCounter(budgetKey, monthKey, UPSCALE_WORST_CASE_MICROS, monthlyBudgetMicros(env));
  if (!budget.allowed) {
    return { ok: false, status: 503, retryAfter: secondsUntilNextUtcMonth(), error: `The AI upscaler's server has reached its monthly budget — a site-wide limit, not something on your end. It resets on ${nextUtcMonthLabel()}.` };
  }
  let settled = false;
  return {
    ok: true,
    // The service answered with its real work: move the reservation to the real cost. Unknown: keep the worst case.
    async settle(result) {
      if (settled) return;
      settled = true;
      if (result && typeof result.seconds === 'number') await deps.adjustCounter(budgetKey, monthKey, upscaleCostMicros(result) - UPSCALE_WORST_CASE_MICROS);
    },
    // Nothing was computed (refused, unreachable before starting): give the reservation back.
    async release() {
      if (settled) return;
      settled = true;
      await deps.decrementCounter(budgetKey, monthKey, UPSCALE_WORST_CASE_MICROS);
    },
  };
}

module.exports = { reserveUpscale, upscaleCostMicros, monthlyBudgetMicros, UPSCALE_MONTHLY_BUDGET_MICROS, UPSCALE_WORST_CASE_MICROS };
