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

export async function evaluateExpression(expr, { angle = 'rad', ans = 0, raw = false } = {}) {
  const math = await loadMath();
  let e = expr
    .replace(/π/g, 'pi')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/√\(/g, 'sqrt(')
    .replace(/\blog\(/g, 'log10(')
    .replace(/\bln\(/g, 'log(')
    .replace(/(?<=[\d.)]|\bpi|\be|Ans)\s*(?=Ans\b)/g, '*') // 2Ans is fine already; πAns, AnsAns, )Ans
    .replace(/\bAns(?=\s*[\d.(]|\s*pi\b|\s*e\b|Ans)/g, 'Ans*'); // Ans2, Ans(2), Ansπ
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
    Ans: ans, // P24 (03/10): the previous result at full precision, as calculator.net's Ans key
  };
  let r;
  try {
    r = math.evaluate(e, scope);
  } catch (err) {
    if (/must be non-negative/i.test(err.message)) throw new Error('This is not defined for negative numbers (for example the factorial of a negative number).');
    throw new Error(err.message.startsWith('tan is') ? err.message : `Cannot read this expression: ${err.message}`);
  }
  if (typeof r === 'function' || r === undefined) throw new Error('Incomplete expression.');
  if (typeof r !== 'number') r = Number(r);
  if (Number.isNaN(r)) throw new Error('The result is not a real number (for example the square root or logarithm of a negative number).');
  if (!Number.isFinite(r)) throw new Error('The result is infinite or too large to show (division by zero, log of 0, or beyond about 1.8e308, like 171!).');
  return raw ? { text: fmt12(r), value: r } : fmt12(r);
}

// ---------- statistics ----------
export function parseNumberList(input) {
  const tokens = input.split(/[\s,;]+/).filter(Boolean);
  const bad = tokens.filter((t) => !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t));
  if (bad.length) throw new Error(`Not a number: ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? '…' : ''}. Separate values with commas, spaces or new lines; use a dot for decimals.`);
  return tokens.map(Number);
}

export function statistics(numbers, { quartiles = 'inclusive' } = {}) {
  const n = numbers.length;
  if (n === 0) throw new Error('Enter at least one number.');
  const sorted = [...numbers].sort((a, b) => a - b);
  // P24 review (03/10): sums are compensated (Neumaier) and taken around a value of the data (shifted), so the mean
  // stays exact enough for 1e15 + small differences; equal values give an exact 0 spread (0.1 × 3 gave skew -2.449).
  const ksum = (xs) => { let s = 0, c = 0; for (const x of xs) { const t = s + x; c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s; s = t; } return s + c; };
  const shift = sorted[Math.floor(n / 2)];
  // review (03/10): the mean is the compensated sum / n — the shifted form lost small values next to huge ones that
  // cancel ([-1e17, 1e17, 3, 4] gave 3.75, not 1.75); deviations are re-centred on their own mean, which removes the
  // rounding of the mean itself (1e15 + small differences stay exact)
  const sum = ksum(numbers);
  const mean = sum / n;
  const constant = sorted[0] === sorted[n - 1];
  const dev0 = numbers.map((x) => x - mean);
  const dbar = ksum(dev0) / n;
  const dev = dev0.map((d) => d - dbar);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const freq = new Map();
  for (const x of numbers) freq.set(x, (freq.get(x) || 0) + 1);
  const maxF = Math.max(...freq.values());
  const mode = maxF === 1 ? [] : [...freq.keys()].filter((k) => freq.get(k) === maxF).sort((a, b) => a - b);
  // corrected two-pass sum of squares: Σd² − (Σd)²/n removes what the rounding of the mean leaves
  const ss = constant ? 0 : Math.max(0, ksum(dev.map((d) => d * d)) - ksum(dev) ** 2 / n);
  const popVar = ss / n;
  const sampleVar = n > 1 ? ss / (n - 1) : null;
  // Quartiles by the same method as Excel QUARTILE.INC / calculator.net's default.
  const q = (p) => { const h = (n - 1) * p; const lo = Math.floor(h); return sorted[lo] + (h - lo) * ((sorted[lo + 1] ?? sorted[lo]) - sorted[lo]); };
  // P24 (03/10): Excel QUARTILE.EXC (Minitab, SPSS, TI-83's "(n+1)p"), undefined when (n+1)p falls outside 1..n
  const qExc = (p) => { const h = (n + 1) * p; if (h < 1 || h > n) return null; const lo = Math.floor(h); return sorted[lo - 1] + (h - lo) * ((sorted[lo] ?? sorted[lo - 1]) - sorted[lo - 1]); };
  const [q1, q3] = quartiles === 'exclusive' ? [qExc(0.25), qExc(0.75)] : [q(0.25), q(0.75)];
  const iqr = q1 === null || q3 === null ? null : q3 - q1;
  // P24 (03/10): what calculator.net and Calculator Soup add — each one only where it is defined, never a made-up value
  const sampleSd = sampleVar === null ? null : Math.sqrt(sampleVar);
  const allPositive = numbers.every((x) => x > 0);
  // relative to a value of the data, so 1e15-sized or tiny values keep their precision
  // log(x/shift) by log1p when x is close to shift (exact for 1e15 + k), by a difference of logs when the range is huge
  const logRatio = (x) => { const r = (x - shift) / shift; return Number.isFinite(r) && r > -1 && Math.abs(r) < 1 ? Math.log1p(r) : Math.log(x) - Math.log(shift); };
  const geometricMean = allPositive ? (constant ? shift : shift * Math.exp(ksum(numbers.map(logRatio)) / n)) : null;
  const lo = sorted[0], hSum = allPositive ? ksum(numbers.map((x) => lo / x)) : 0; // min/x <= 1: never overflows
  const harmonicMean = allPositive && hSum > 0 ? (constant ? shift : lo * n / hSum) : null;
  const standardError = sampleSd === null ? null : constant ? 0 : sampleSd / Math.sqrt(n);
  const coefficientOfVariation = sampleSd === null || mean === 0 ? null : constant ? 0 : sampleSd / Math.abs(mean);
  // Excel SKEW (adjusted Fisher-Pearson, n >= 3) and KURT (excess kurtosis, n >= 4); undefined when all values are equal
  const z = (k) => ksum(dev.map((d) => (d / sampleSd) ** k));
  const skewness = n >= 3 && !constant && sampleSd > 0 ? (n / ((n - 1) * (n - 2))) * z(3) : null;
  const kurtosis = n >= 4 && !constant && sampleSd > 0 ? ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * z(4) - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3)) : null;
  const outliers = iqr === null ? [] : sorted.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr);
  return {
    count: n, sum, mean, median, mode, modeCount: maxF, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0],
    populationVariance: popVar, populationStdDev: Math.sqrt(popVar),
    sampleVariance: sampleVar, sampleStdDev: sampleSd,
    q1, q3, iqr, geometricMean, harmonicMean, standardError, coefficientOfVariation, skewness, kurtosis, outliers,
    sumOfSquares: ss, allPositive,
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
  // Exact decimal when the denominator has only 2s and 5s, else the repeating form (repeatingDecimal).
  let d = f.den; while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n;
  let decimal;
  if (d === 1n) {
    // scale to the smallest power-of-ten denominator
    let p = 0; let pow = 1n; while (pow % f.den !== 0n) { pow *= 10n; p++; }
    const scaled = (abs * pow) / f.den;
    const str = scaled.toString().padStart(p + 1, '0');
    decimal = (neg ? '-' : '') + (p ? str.slice(0, -p) + '.' + str.slice(-p) : str);
  } else {
    // P24 (03/10): exact long division in BigInt — the repeating part in brackets (1/6 = 0.1(6)), as Calculator Soup
    // writes it; Number(abs) / Number(den) gave NaN beyond 1e308 (two 400-digit numbers)
    decimal = (neg ? '-' : '') + repeatingDecimal(abs, f.den);
  }
  return { fraction: f.den === 1n ? String(f.num) : `${f.num}/${f.den}`, mixed, decimal };
}

// a / b (a >= 0, b > 0, not terminating) as "int.pre(period)", or, when the period is longer than `max` digits, the
// first `max` digits followed by "…" (cut, not rounded)
export function repeatingDecimal(a, b, max = 100) {
  // the digits before the repeat (one per factor 2 or 5 of b) do not count against the limit: 1/(3·2^120) has a
  // 1-digit period after 120 digits (review 03/10)
  let pre = 0, t2 = b, t5 = b, k2 = 0, k5 = 0; while (t2 % 2n === 0n) { t2 /= 2n; k2++; } while (t5 % 5n === 0n) { t5 /= 5n; k5++; } pre = Math.max(k2, k5);
  max += pre;
  const int = a / b; let r = a % b; const seen = new Map(); let digits = '';
  while (r !== 0n && !seen.has(r) && digits.length < max) { seen.set(r, digits.length); r *= 10n; digits += (r / b).toString(); r %= b; }
  if (r === 0n) return `${int}.${digits}`;
  if (seen.has(r)) { const k = seen.get(r); return `${int}.${digits.slice(0, k)}(${digits.slice(k)})`; }
  return `${int}.${digits}… (the repeating part is longer than ${max - pre} digits)`;
}

// P24 (03/10): the working, as Calculator Soup shows it
export function fractionSteps(a, b, op) {
  const s = (f) => (f.den === 1n ? String(f.num) : `${f.num}/${f.den}`);
  const p = (n, d) => (n < 0n ? `(${n}/${d})` : `${n}/${d}`); // -2/6 written (−2/6) after an operator
  const lcm = (x, y) => (x / bgcd(x, y)) * y;
  const steps = [];
  if (op === '+' || op === '-') {
    const L = lcm(a.den, b.den), ka = L / a.den, kb = L / b.den, n = op === '+' ? a.num * ka + b.num * kb : a.num * ka - b.num * kb;
    if (a.den !== b.den) steps.push(`Least common denominator of ${a.den} and ${b.den}: ${L}`, `${s(a)} = ${a.num * ka}/${L} and ${s(b)} = ${b.num * kb}/${L}`);
    steps.push(`${a.num * ka}/${L} ${op} ${p(b.num * kb, L)} = ${n}/${L}`);
    const g = bgcd(n, L) || 1n; if (g > 1n) steps.push(`Simplify by ${g}: ${n / g}/${L / g}`);
  } else if (op === '*') {
    const n = a.num * b.num, d = a.den * b.den; steps.push(`Multiply across: (${a.num} × ${b.num}) / (${a.den} × ${b.den}) = ${n}/${d}`);
    const g = bgcd(n, d) || 1n; if (g > 1n) steps.push(`Simplify by ${g}: ${n / g}/${d / g}`);
  } else {
    if (b.num === 0n) return steps;
    const r = norm(b.den, b.num); steps.push(`Dividing by ${s(b)} is multiplying by its reciprocal ${s(r)}`);
    const n = a.num * r.num, d = a.den * r.den; steps.push(`(${a.num} × ${r.num}) / (${a.den} × ${r.den}) = ${n}/${d}`);
    const g = bgcd(n, d) || 1n; if (g > 1n) steps.push(`Simplify by ${g}: ${n / g}/${d / g}`);
  }
  return steps;
}

// P24 (03/10): an optional whole part, as the mixed-number fields of Calculator Soup: -1 and 1/2 is -(1 + 1/2)
export function mixedFraction(whole, frac) {
  const w = whole.trim();
  if (!w) return frac;
  const W = parseFraction(w);
  if (W.den !== 1n) throw new Error(`"${w}": the whole-number part must be a whole number.`);
  if (frac.num < 0n) throw new Error('With a whole-number part, put the minus sign on the whole number only (-1 1/2).');
  const negative = w.startsWith('-');
  const sum = norm((negative ? -W.num : W.num) * frac.den + frac.num, frac.den);
  return negative ? { num: -sum.num, den: sum.den } : sum;
}
