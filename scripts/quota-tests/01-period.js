const assert = require('node:assert');
const { currentUtcMonthKey, currentUtcDayKey, currentUtcHourKey, secondsUntilNextUtcMonth, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('../../lib/quota/period');

const fixedNow = new Date(Date.UTC(2026, 7, 28, 14, 30, 0)); // 2026-08-28T14:30:00Z

assert.strictEqual(currentUtcMonthKey(fixedNow), '2026-08');
assert.strictEqual(currentUtcDayKey(fixedNow), '2026-08-28');
assert.strictEqual(currentUtcHourKey(fixedNow), '2026-08-28T14');
assert.strictEqual(secondsUntilNextUtcHour(fixedNow), 30 * 60);
assert.strictEqual(secondsUntilNextUtcDay(fixedNow), (9 * 3600 + 30 * 60));
const expectedMonthSeconds = Math.round((Date.UTC(2026, 8, 1, 0, 0, 0) - fixedNow.getTime()) / 1000);
assert.strictEqual(secondsUntilNextUtcMonth(fixedNow), expectedMonthSeconds);

console.log('PASS: period key and reset-countdown helpers.');
