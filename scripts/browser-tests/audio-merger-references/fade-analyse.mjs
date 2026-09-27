// Research analyser (26/09/2026, order + crossfade): a merged file made from pure tones (A = 440 Hz 5 s, B = 1000 Hz 3 s,
// C = 2500 Hz 4 s, each at 0.5 amplitude) is decoded by a native ffmpeg, and the level of each tone is followed in 5 ms
// steps (Goertzel, 40 ms Hann window). Gives: total length, the order the tones come in, where each fade starts and
// ends, its length, and the fade curve (gain at 25/50/75 % of the fade: linear = 0.25/0.50/0.75, equal-power
// (sine) = 0.38/0.71/0.92).
// Usage: node fade-analyse.mjs <ffmpeg> <file> [--json]
import { execFileSync } from 'node:child_process';
const [FF, file] = process.argv.slice(2);
const RATE = 44100;
const raw = execFileSync(FF, ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
const dur = x.length / RATE;
const TONES = { A: 440, B: 1000, C: 2500 };
const WIN = Math.round(0.04 * RATE), HOP = Math.round(0.005 * RATE);
const hann = Float32Array.from({ length: WIN }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1)));
const hannSum = hann.reduce((a, v) => a + v, 0);
function level(start, f) {
  const w = (2 * Math.PI * f) / RATE, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < WIN; i++) { const s0 = x[start + i] * hann[i] + c * s1 - s2; s2 = s1; s1 = s0; }
  const re = s1 - s2 * Math.cos(w), im = s2 * Math.sin(w);
  return (2 * Math.hypot(re, im)) / hannSum; // amplitude of that tone
}
const env = {};
for (const [k, f] of Object.entries(TONES)) {
  env[k] = [];
  for (let s = 0; s + WIN <= x.length; s += HOP) env[k].push(level(s, f));
}
const t = (i) => (i * HOP + WIN / 2) / RATE;
const report = { file, duration: +dur.toFixed(4), tones: {} };
for (const k of Object.keys(TONES)) {
  const e = env[k];
  const peak = e.slice().sort((a, b) => b - a)[Math.floor(e.length * 0.02)] || 0;
  if (peak < 0.02) continue;
  const full = e.map((v) => v > peak * 0.99);
  const fullFirst = full.indexOf(true), fullLast = full.lastIndexOf(true);
  // The tone's own stretch: the run around its full-level part (a hard cut elsewhere spreads a click over every
  // frequency for a window or two, which must not count as this tone).
  let first = fullFirst, last = fullLast;
  while (first > 0 && e[first - 1] > peak * 0.01) first--;
  while (last < e.length - 1 && e[last + 1] > peak * 0.01) last++;
  const curve = (a, bIdx, rising) => [0.25, 0.5, 0.75].map((q) => +(e[Math.round(a + (bIdx - a) * q)] / peak).toFixed(2));
  report.tones[k] = {
    peak: +peak.toFixed(3), start: +t(first).toFixed(3), end: +t(last).toFixed(3),
    fadeIn: +(t(fullFirst) - t(first)).toFixed(3), fadeOut: +(t(last) - t(fullLast)).toFixed(3),
    fadeInCurve: curve(first, fullFirst, true), fadeOutCurve: curve(fullLast, last, false).reverse(),
  };
}
report.order = Object.entries(report.tones).sort((a, b) => a[1].start - b[1].start).map(([k]) => k).join('');
console.log(process.argv.includes('--json') ? JSON.stringify(report) : report);
