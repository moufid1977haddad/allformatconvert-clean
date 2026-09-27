function pad(n) { return String(n).padStart(2, '0'); }

function currentUtcMonthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`;
}

function currentUtcDayKey(now = new Date()) {
  return `${currentUtcMonthKey(now)}-${pad(now.getUTCDate())}`;
}

function currentUtcHourKey(now = new Date()) {
  return `${currentUtcDayKey(now)}T${pad(now.getUTCHours())}`;
}

function nextUtcMonthDate(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
}

function nextUtcMonthIso(now = new Date()) {
  return nextUtcMonthDate(now).toISOString();
}

// For visitors: "October 1, 2026 (UTC)" rather than an ISO timestamp.
function nextUtcMonthLabel(now = new Date()) {
  return nextUtcMonthDate(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) + ' (UTC)';
}

function secondsUntilNextUtcMonth(now = new Date()) {
  return Math.max(1, Math.round((nextUtcMonthDate(now).getTime() - now.getTime()) / 1000));
}

function secondsUntilNextUtcHour(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1, 0, 0));
  return Math.max(1, Math.round((next.getTime() - now.getTime()) / 1000));
}

function secondsUntilNextUtcDay(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(1, Math.round((next.getTime() - now.getTime()) / 1000));
}

module.exports = {
  currentUtcMonthKey, currentUtcDayKey, currentUtcHourKey,
  nextUtcMonthIso, nextUtcMonthLabel, secondsUntilNextUtcMonth, secondsUntilNextUtcHour, secondsUntilNextUtcDay,
};
