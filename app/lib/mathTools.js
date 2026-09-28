// Math tool engines (29/09).
//
// Measured before (scripts/converter-tests/07-math-tools.mjs replays each case):
//   - Scientific Calculator: results went through toFixed(10), so 1/3e12
//     showed "0"; "2π" and "2(3)" were "Error" (no implicit multiplication);
//     sqrt(-1) and log(0) both said "Cannot divide by zero"; no degrees mode.
//   - Statistics Calculator: values separated by spaces or new lines were
//     silently dropped ("1 2 3" -> only 1), "12abc" was read as 12, every
//     value was reported as "the mode" when none repeats, and only the
//     population standard deviation was given (calculator.net shows sample
//     and population).
//   - Fraction Calculator: "1.5" was read as 1, a letter produced "Denominators
//     cannot be zero", signs were not normalised (1/-2), and products beyond
//     2^53 lost digits.
// Engines: mathjs (Apache-2.0, as used by many online calculators) for
// expressions; BigInt for fractions; plain sums with 12-significant-digit
// display for statistics.

const fmt12 = (x) => {
  if (!Number.isFinite(x)) return String(x);
  if (x === 0) return '0';
  const s = Number(x.toPrecision(12));
  return String(s);
};

// ---------- scientific calculator ----------
let mathPromise;
const loadMath = () => (mathPromise ||= import('mathjs').then((m) => m.create(m.all, { number: 'number', predictable: true })));

export async function evaluateExpression(expr, { angle = 'rad' } = {}) {
  const math = await loadMath();
  let e = expr
    .replace(/π/g, 'pi')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/√\(/g, 'sqrt(')
    .replace(/\blog\(/g, 'log10(')
    .replace(/\bln\(/g, 'log(');
  const toRad = angle === 'deg' ? Math.PI / 180 : 1;
  const snap = (v) => (Math.abs(v) < 1e-14 ? 0 : v);
  const scope = {
    sin: (x) => snap(Math.sin(x * toRad)),
    cos: (x) => snap(Math.cos(x * toRad)),
    tan: (x) => {
      const c = snap(Math.cos(x * toRad));
      if (c === 0) throw new Error('tan is undefined here (the cosine is 0).');
      return snap(Math.sin(x * toRad)) / c;
    },
    asin: (x) => Math.asin(x) / toRad,
    acos: (x) => Math.acos(x) / toRad,
    atan: (x) => Math.atan(x) / toRad,
  };
  let r;
  try {
    r = math.evaluate(e, scope);
  } catch (err) {
    throw new Error(err.message.startsWith('tan is') ? err.message : `Cannot read this expression: ${err.message}`);
  }
  if (typeof r === 'function' || r === undefined) throw new Error('Incomplete expression.');
  if (typeof r !== 'number') r = Number(r);
  if (Number.isNaN(r)) throw new Error('The result is not a real number (for example the square root or logarithm of a negative number).');
  if (!Number.isFinite(r)) throw new Error('The result is infinite (division by zero, or log of 0).');
  return fmt12(r);
}

// ---------- statistics ----------
export function parseNumberList(input) {
  const tokens = input.split(/[\s,;]+/).filter(Boolean);
  const bad = tokens.filter((t) => !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t));
  if (bad.length) throw new Error(`Not a number: ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? '…' : ''}. Separate values with commas, spaces or new lines; use a dot for decimals.`);
  return tokens.map(Number);
}

export function statistics(numbers) {
  const n = numbers.length;
  if (n === 0) throw new Error('Enter at least one number.');
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const freq = new Map();
  for (const x of numbers) freq.set(x, (freq.get(x) || 0) + 1);
  const maxF = Math.max(...freq.values());
  const mode = maxF === 1 ? [] : [...freq.keys()].filter((k) => freq.get(k) === maxF).sort((a, b) => a - b);
  const ss = numbers.reduce((acc, x) => acc + (x - mean) ** 2, 0);
  const popVar = ss / n;
  const sampleVar = n > 1 ? ss / (n - 1) : null;
  // Quartiles by the same method as Excel QUARTILE.INC / calculator.net's default.
  const q = (p) => { const h = (n - 1) * p; const lo = Math.floor(h); return sorted[lo] + (h - lo) * ((sorted[lo + 1] ?? sorted[lo]) - sorted[lo]); };
  return {
    count: n, sum, mean, median, mode, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0],
    populationVariance: popVar, populationStdDev: Math.sqrt(popVar),
    sampleVariance: sampleVar, sampleStdDev: sampleVar === null ? null : Math.sqrt(sampleVar),
    q1: q(0.25), q3: q(0.75),
  };
}
export const formatStat = (x) => (x === null ? '—' : fmt12(x));

// ---------- fractions ----------
const bgcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };

// Accepts "3", "-3", "3/4", "1 3/4" (mixed), "0.75" (exact decimal).
export function parseFraction(s) {
  const t = s.trim();
  let m;
  if ((m = /^([+-]?)(\d+)\s+(\d+)\/(\d+)$/.exec(t))) {
    const den = BigInt(m[4]);
    if (den === 0n) throw new Error(`"${t}": the denominator cannot be zero.`);
    const num = BigInt(m[2]) * den + BigInt(m[3]);
    return norm(m[1] === '-' ? -num : num, den);
  }
  if ((m = /^([+-]?\d+)\/([+-]?\d+)$/.exec(t))) {
    const den = BigInt(m[2]);
    if (den === 0n) throw new Error(`"${t}": the denominator cannot be zero.`);
    return norm(BigInt(m[1]), den);
  }
  if ((m = /^([+-]?)(\d*)\.(\d+)$/.exec(t)) || (m = /^([+-]?)(\d+)()$/.exec(t))) {
    const den = 10n ** BigInt(m[3].length);
    const num = BigInt((m[2] || '0') + m[3]);
    return norm(m[1] === '-' ? -num : num, den);
  }
  throw new Error(`"${t || '(empty)'}" is not a number or fraction. Examples: 3/4, -2/5, 1 1/2, 0.75.`);
}
function norm(num, den) {
  if (den < 0n) { num = -num; den = -den; }
  const g = bgcd(num, den) || 1n;
  return { num: num / g, den: den / g };
}
export function fractionOp(a, b, op) {
  if (op === '+') return norm(a.num * b.den + b.num * a.den, a.den * b.den);
  if (op === '-') return norm(a.num * b.den - b.num * a.den, a.den * b.den);
  if (op === '*') return norm(a.num * b.num, a.den * b.den);
  if (b.num === 0n) throw new Error('Cannot divide by zero.');
  return norm(a.num * b.den, a.den * b.num);
}
export function describeFraction(f) {
  const neg = f.num < 0n;
  const abs = neg ? -f.num : f.num;
  const whole = abs / f.den;
  const rest = abs % f.den;
  const mixed = f.den === 1n ? String(f.num) : whole === 0n ? `${neg ? '-' : ''}${rest}/${f.den}` : `${neg ? '-' : ''}${whole} ${rest}/${f.den}`;
  // Exact decimal when the denominator has only 2s and 5s, else 12 digits.
  let d = f.den; while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n;
  let decimal;
  if (d === 1n) {
    // scale to the smallest power-of-ten denominator
    let p = 0; let pow = 1n; while (pow % f.den !== 0n) { pow *= 10n; p++; }
    const scaled = (abs * pow) / f.den;
    const str = scaled.toString().padStart(p + 1, '0');
    decimal = (neg ? '-' : '') + (p ? str.slice(0, -p) + '.' + str.slice(-p) : str);
  } else {
    decimal = (neg ? '-' : '') + fmt12(Number(abs) / Number(f.den)) + ' (rounded)';
  }
  return { fraction: f.den === 1n ? String(f.num) : `${f.num}/${f.den}`, mixed, decimal };
}
