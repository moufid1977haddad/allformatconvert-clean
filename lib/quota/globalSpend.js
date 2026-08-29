const { incrementCounter, decrementCounter, adjustCounter } = require('./counters');
const { checkAndAlertThresholds } = require('./alerts');
const { currentUtcMonthKey } = require('./period');
const { GLOBAL_SPEND_CAP_CENTS, WORST_CASE_COST_CENTS } = require('./config');

const BUCKET = 'global_spend_cents';

async function reserveGlobalSpend(route) {
  const periodKey = currentUtcMonthKey();
  const reservedCents = WORST_CASE_COST_CENTS[route];
  if (typeof reservedCents !== 'number') throw new Error(`No worst-case cost configured for route "${route}"`);
  const { newValue, allowed } = await incrementCounter(BUCKET, periodKey, reservedCents, GLOBAL_SPEND_CAP_CENTS);
  await checkAndAlertThresholds({ counterName: 'global_spend', periodKey, value: newValue, cap: GLOBAL_SPEND_CAP_CENTS });
  return { allowed, reservedCents, periodKey };
}

async function releaseGlobalSpend(periodKey, reservedCents) {
  await decrementCounter(BUCKET, periodKey, reservedCents);
}

async function reconcileGlobalSpend(periodKey, reservedCents, actualCents) {
  const delta = actualCents - reservedCents;
  const newValue = await adjustCounter(BUCKET, periodKey, delta);
  await checkAndAlertThresholds({ counterName: 'global_spend', periodKey, value: newValue, cap: GLOBAL_SPEND_CAP_CENTS });
}

module.exports = { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend };
