// In-memory only: no Supabase, no real environment variable touched.
const assert = require('node:assert');
const { requiredPositiveInt } = require('../../lib/quota/requiredEnv');

assert.strictEqual(requiredPositiveInt('X', { X: '30' }), 30);
assert.strictEqual(requiredPositiveInt('X', { X: ' 100 ' }), 100);

for (const bad of [undefined, '', '   ', '0', '-5', 'abc', '3.5', 'NaN', 'Infinity']) {
  assert.throws(() => requiredPositiveInt('X', { X: bad }), /X is missing or is not a positive integer/, `should reject ${JSON.stringify(bad)}`);
}
assert.throws(() => requiredPositiveInt('X', {}), /X is missing/);

// The error must name the variable but never echo the offending value.
try { requiredPositiveInt('X', { X: 'secret-looking-value' }); } catch (e) {
  assert.ok(!e.message.includes('secret-looking-value'), 'error must not echo the value');
}

// config.js itself must refuse to load without the two IP variables, and load with them.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const cfg = path.join(__dirname, '..', '..', 'lib', 'quota', 'config.js');
const run = (env) => execFileSync(process.execPath, ['-e', `require(${JSON.stringify(cfg)});console.log('LOADED')`],
  { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
assert.throws(() => run({}), (e) => /IP_RATE_LIMIT_PER_HOUR is missing/.test(String(e.stderr)));
assert.throws(() => run({ IP_RATE_LIMIT_PER_HOUR: '30' }), (e) => /IP_RATE_LIMIT_PER_DAY is missing/.test(String(e.stderr)));
assert.match(run({ IP_RATE_LIMIT_PER_HOUR: '30', IP_RATE_LIMIT_PER_DAY: '100' }), /LOADED/);

console.log('PASS: requiredPositiveInt rejects absent/invalid values; config.js refuses to load without the two IP variables.');
