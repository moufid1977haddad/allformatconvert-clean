const { incrementCounter, decrementCounter } = require('./counters');
const { checkAndAlertThresholds } = require('./alerts');
const { currentUtcMonthKey } = require('./period');
const { ADOBE_TX_CAP } = require('./config');

const BUCKET = 'adobe_tx';

async function reserveAdobeTransaction() {
  const periodKey = currentUtcMonthKey();
  const { newValue, allowed } = await incrementCounter(BUCKET, periodKey, 1, ADOBE_TX_CAP);
  await checkAndAlertThresholds({ counterName: 'adobe_tx', periodKey, value: newValue, cap: ADOBE_TX_CAP });
  return { allowed, periodKey };
}

async function releaseAdobeTransaction(periodKey) {
  await decrementCounter(BUCKET, periodKey, 1);
}

module.exports = { reserveAdobeTransaction, releaseAdobeTransaction };
