const { incrementCounter } = require('./counters');
const { sendAlert } = require('../alert');

function currentUtcHourKey() {
  return new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
}

// Caps unhandled-route-error alerts to one per route per UTC hour, so a
// sustained failure (a bad deploy, a broken upstream) sends one email, not
// one per request. Same capped-counter primitive (increment, cap 1) as the
// spend/Adobe threshold alerts in lib/quota/alerts.js. Fails open: if the
// throttle check itself errors, alert anyway rather than risk going silent.
async function alertServerError(routeKey, detail, sendAlertFn = sendAlert) {
  const periodKey = currentUtcHourKey();
  try {
    const { allowed } = await incrementCounter(`error_alert:${routeKey}`, periodKey, 1, 1);
    if (!allowed) return;
  } catch (err) {
    console.error(`error-alert throttle check failed for "${routeKey}" (failing open, alerting anyway):`, err.message);
  }
  await sendAlertFn('server-error', `${routeKey}: ${detail}`.slice(0, 300));
}

module.exports = { alertServerError };
