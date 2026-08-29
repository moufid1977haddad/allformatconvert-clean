const { incrementCounter, decrementCounter, adjustCounter } = require('./counters');
const { checkAndAlertThresholds } = require('./alerts');
const { currentUtcMonthKey } = require('./period');
const { GLOBAL_SPEND_CAP_MICROS, WORST_CASE_COST_MICROS } = require('./config');

// Alerting is best-effort and must never be allowed to corrupt a reservation
// that already succeeded: a transient DB error inside checkAndAlertThresholds
// (it does its own incrementCounter call, on the alert-flag bucket) would
// otherwise propagate up AFTER the real counter was already mutated,
// orphaning that reservation -- no commit/release closure would ever reach
// the caller.
async function safeCheckAndAlertThresholds(args) {
  try {
    await checkAndAlertThresholds(args);
  } catch (err) {
    console.error('Alert-threshold check failed (non-fatal, reservation stands):', err.message);
  }
}

const BUCKET = 'global_spend_microusd';

async function reserveGlobalSpend(route) {
  const periodKey = currentUtcMonthKey();
  const reservedMicros = WORST_CASE_COST_MICROS[route];
  if (typeof reservedMicros !== 'number') throw new Error(`No worst-case cost configured for route "${route}"`);
  const { newValue, allowed } = await incrementCounter(BUCKET, periodKey, reservedMicros, GLOBAL_SPEND_CAP_MICROS);
  await safeCheckAndAlertThresholds({ counterName: 'global_spend', periodKey, value: newValue, cap: GLOBAL_SPEND_CAP_MICROS });
  return { allowed, reservedMicros, periodKey };
}

async function releaseGlobalSpend(periodKey, reservedMicros) {
  await decrementCounter(BUCKET, periodKey, reservedMicros);
}

async function reconcileGlobalSpend(periodKey, reservedMicros, actualMicros) {
  const delta = actualMicros - reservedMicros;
  const newValue = await adjustCounter(BUCKET, periodKey, delta);
  await safeCheckAndAlertThresholds({ counterName: 'global_spend', periodKey, value: newValue, cap: GLOBAL_SPEND_CAP_MICROS });
}

module.exports = { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend };
