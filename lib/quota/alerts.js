const { incrementCounter } = require('./counters');
const { ALERT_THRESHOLDS } = require('./config');

// lib/alert.js uses ESM export syntax (only ever run through Next's
// bundler elsewhere in this repo) -- this file is CommonJS per this plan's
// Global Constraints, so it requires the compiled interop shape. Next
// resolves this transparently for both the route handlers and this module
// when it's imported from a route; the standalone test script below
// requires the same file directly and needs the identical shape, which
// Node's CJS/ESM interop provides automatically for a plain `export`.
const { sendAlert } = require('../alert');

// Threshold-crossing is itself a capped-at-1 counter increment: if it
// succeeds (flag was 0, now 1), this is the first time this threshold was
// crossed this period -- send the alert. If it fails (already 1), skip
// silently. Exactly-once per threshold per period, no separate bookkeeping.
// sendAlertFn is injectable for testing: require() of this repo's ESM
// lib/alert.js returns a non-writable namespace object per the JS spec,
// making monkeypatching impossible; dependency injection is the only reliable
// way to stub it in tests. Production code (no current call sites) will use
// the real sendAlert; tests pass a stub.
async function checkAndAlertThresholds({ counterName, periodKey, value, cap }, sendAlertFn = sendAlert) {
  if (cap <= 0) return;
  const pct = (value / cap) * 100;
  for (const threshold of ALERT_THRESHOLDS) {
    if (pct < threshold) continue;
    const flagBucket = `alert_sent:${counterName}:${threshold}`;
    const { allowed } = await incrementCounter(flagBucket, periodKey, 1, 1);
    if (allowed) {
      await sendAlertFn(counterName, `${threshold}pct_of_cap_${value}_of_${cap}`);
    }
  }
}

module.exports = { checkAndAlertThresholds };
