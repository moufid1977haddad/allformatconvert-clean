// Strict reader for limits that must never be silently defaulted: a missing
// variable throws (naming only the variable, never a value) instead of
// applying a default that would throttle real visitors without anyone noticing.
function requiredPositiveInt(name, env = process.env) {
  const raw = env[name];
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(
      `[quota/config] ${name} is missing or is not a positive integer. Refusing to start: ` +
      'a silent default would throttle real visitors without anyone noticing. ' +
      'Set it for every environment that builds or runs this app (Production, Preview, Development).'
    );
  }
  return n;
}

module.exports = { requiredPositiveInt };
