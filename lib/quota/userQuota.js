const { incrementCounter, decrementCounter } = require('./counters');
const { currentUtcMonthKey, nextUtcMonthIso } = require('./period');
const { USER_QUOTA_PDF_CONVERSIONS, USER_QUOTA_IMAGES } = require('./config');

const CAPS = { pdf_conversions: USER_QUOTA_PDF_CONVERSIONS, images: USER_QUOTA_IMAGES };

function bucketFor(userId, bucket) {
  if (!CAPS[bucket]) throw new Error(`Unknown user quota bucket "${bucket}"`);
  return `user_quota:${bucket}:${userId}`;
}

async function reserveUserQuota(userId, bucket) {
  const cap = CAPS[bucket];
  const periodKey = currentUtcMonthKey();
  const { newValue, allowed } = await incrementCounter(bucketFor(userId, bucket), periodKey, 1, cap);
  return { allowed, remaining: Math.max(cap - newValue, 0), cap, resetsAt: nextUtcMonthIso(), periodKey };
}

async function releaseUserQuota(userId, bucket) {
  await decrementCounter(bucketFor(userId, bucket), currentUtcMonthKey(), 1);
}

// Read-only balance check: reserving 0 units never fails the cap check, so
// this reuses the same RPC to read the current value without mutating it.
async function getUserQuotaRemaining(userId, bucket) {
  const cap = CAPS[bucket];
  const { newValue } = await incrementCounter(bucketFor(userId, bucket), currentUtcMonthKey(), 0, cap);
  return { remaining: Math.max(cap - newValue, 0), cap, resetsAt: nextUtcMonthIso() };
}

module.exports = { reserveUserQuota, releaseUserQuota, getUserQuotaRemaining };
