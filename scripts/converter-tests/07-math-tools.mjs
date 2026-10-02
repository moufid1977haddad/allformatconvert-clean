// Tests for app/lib/mathTools.js (29/09). Oracles: exact arithmetic (BigInt
// for fractions), textbook values (sample vs population SD of 2,4,4,4,5,5,7,9
// = 2.138 / 2), and known trig values.
// Run: node scripts/converter-tests/07-math-tools.mjs
import assert from 'node:assert/strict';
const m = await import(new URL('../../app/lib/mathTools.js', import.meta.url));

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('calculator: tiny results are not rounded to 0; implicit multiplication', async () => {
  assert.equal(await m.evaluateExpression('1/3e12'), '3.33333333333e-13');
  assert.equal(await m.evaluateExpression('2π'), '6.28318530718');
  assert.equal(await m.evaluateExpression('2(3+1)'), '8');
  assert.equal(await m.evaluateExpression('0.1+0.2'), '0.3');
  assert.equal(await m.evaluateExpression('2^10'), '1024');
  assert.equal(await m.evaluateExpression('5!'), '120');
});
test('calculator: log is base 10, ln natural, e constant', async () => {
  assert.equal(await m.evaluateExpression('log(1000)'), '3');
  assert.equal(await m.evaluateExpression('ln(e)'), '1');
  assert.equal(await m.evaluateExpression('sqrt(16)'), '4');
});
test('calculator: degrees mode gives exact textbook values', async () => {
  assert.equal(await m.evaluateExpression('sin(30)', { angle: 'deg' }), '0.5');
  assert.equal(await m.evaluateExpression('cos(90)', { angle: 'deg' }), '0');
  assert.equal(await m.evaluateExpression('tan(45)', { angle: 'deg' }), '1');
  await assert.rejects(() => m.evaluateExpression('tan(90)', { angle: 'deg' }), /undefined/);
  assert.equal(await m.evaluateExpression('sin(pi/2)'), '1');
});
test('calculator: honest messages', async () => {
  await assert.rejects(() => m.evaluateExpression('sqrt(-1)'), /not a real number/);
  await assert.rejects(() => m.evaluateExpression('1/0'), /infinite/);
  await assert.rejects(() => m.evaluateExpression('log(0)'), /infinite/);
  await assert.rejects(() => m.evaluateExpression('2+*3'), /Cannot read/);
});
test('statistics: any separator, invalid tokens refused', () => {
  assert.deepEqual(m.parseNumberList('1 2\n3,4;5\t-6.5 1e3'), [1, 2, 3, 4, 5, -6.5, 1000]);
  assert.throws(() => m.parseNumberList('1, 12abc, 3'), /Not a number: 12abc/);
});
test('statistics: sample and population SD, median, quartiles, mode', () => {
  const s = m.statistics([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(s.mean, 5); assert.equal(s.median, 4.5); assert.deepEqual(s.mode, [4]);
  assert.equal(s.populationStdDev, 2);
  assert.equal(m.formatStat(s.sampleStdDev), '2.1380899353');
  assert.equal(s.q1, 4); assert.equal(s.q3, 5.5);
  assert.deepEqual(m.statistics([1, 2, 3]).mode, []);
  assert.equal(m.statistics([7]).sampleStdDev, null);
  assert.equal(m.formatStat(m.statistics([0.1, 0.2]).sum), '0.3');
});
test('fractions: exact, normalised, mixed numbers, decimals, big values', () => {
  const f = (s) => m.parseFraction(s);
  const d = (x) => m.describeFraction(x);
  assert.deepEqual(d(m.fractionOp(f('1/2'), f('1/3'), '+')), { fraction: '5/6', mixed: '5/6', decimal: '0.8(3)' });
  assert.deepEqual(d(m.fractionOp(f('1 1/2'), f('3/4'), '*')), { fraction: '9/8', mixed: '1 1/8', decimal: '1.125' });
  assert.deepEqual(d(f('1/-2')), { fraction: '-1/2', mixed: '-1/2', decimal: '-0.5' });
  assert.deepEqual(d(f('1.5')), { fraction: '3/2', mixed: '1 1/2', decimal: '1.5' });
  assert.equal(d(m.fractionOp(f('9007199254740993/1'), f('1/1'), '+')).fraction, '9007199254740994');
  assert.throws(() => f('1/0'), /zero/);
  assert.throws(() => f('abc'), /not a number/);
  assert.throws(() => m.fractionOp(f('1/2'), f('0'), '/'), /divide by zero/);
});

for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; }
}
console.log(`${passed}/${tests.length} passed`);
