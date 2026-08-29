const assert = require('node:assert');
const { checkAndAlertThresholds } = require('../../lib/quota/alerts');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');

const sent = [];
const stubSendAlert = async (service, status) => { sent.push({ service, status }); };

async function main() {
  const counterName = 'test-alert-' + Date.now();
  const period = '2000-01';

  try {
    await checkAndAlertThresholds({ counterName, periodKey: period, value: 40, cap: 100 }, stubSendAlert); // 40% -- no threshold crossed
    assert.strictEqual(sent.length, 0, 'no alert should fire below 50%');

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 55, cap: 100 }, stubSendAlert); // crosses 50%
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].service, counterName);

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 60, cap: 100 }, stubSendAlert); // still only past 50%, already sent
    assert.strictEqual(sent.length, 1, 'the 50% alert must not fire twice');

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 85, cap: 100 }, stubSendAlert); // crosses 80%
    assert.strictEqual(sent.length, 2);

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 100, cap: 100 }, stubSendAlert); // crosses 100%
    assert.strictEqual(sent.length, 3);

    await checkAndAlertThresholds({ counterName, periodKey: period, value: 100, cap: 100 }, stubSendAlert); // repeat call at same value
    assert.strictEqual(sent.length, 3, 'no threshold should re-fire on a repeat call');

    console.log('PASS: alert thresholds fire exactly once each, in order 50/80/100.');
  } finally {
    await supabaseAdmin.from('usage_counters').delete().like('bucket_key', `alert_sent:${counterName}:%`);
  }
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
