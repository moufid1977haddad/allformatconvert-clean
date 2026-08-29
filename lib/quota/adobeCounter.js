const { incrementCounter, decrementCounter } = require('./counters');
const { checkAndAlertThresholds } = require('./alerts');
const { currentUtcMonthKey } = require('./period');
const { ADOBE_TX_CAP } = require('./config');

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

const BUCKET = 'adobe_tx';

async function reserveAdobeTransaction() {
  const periodKey = currentUtcMonthKey();
  const { newValue, allowed } = await incrementCounter(BUCKET, periodKey, 1, ADOBE_TX_CAP);
  await safeCheckAndAlertThresholds({ counterName: 'adobe_tx', periodKey, value: newValue, cap: ADOBE_TX_CAP });
  return { allowed, periodKey };
}

async function releaseAdobeTransaction(periodKey) {
  await decrementCounter(BUCKET, periodKey, 1);
}

module.exports = { reserveAdobeTransaction, releaseAdobeTransaction };
