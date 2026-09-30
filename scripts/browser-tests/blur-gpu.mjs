// P17: the GPU blur (app/lib/glBlur.js) against the CPU blur (app/lib/canvasFilters.js) in each engine: same pixels
// to within 1 colour level (alpha > 0), across several strips, with transparency; and the time at 12, 24, 48 MP.
// The two modules are evaluated in a page as they are (exports stripped), so this tests the shipped code.
// Usage: node scripts/browser-tests/blur-gpu.mjs [origin] [--browser=webkit|chromium|firefox]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
const origin = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100';
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
const strip = (s) => s.replace(/^import .*$/gm, '').replace(/export /g, '');
const src = strip(fs.readFileSync('app/lib/canvasFilters.js', 'utf8')) + '\n' + strip(fs.readFileSync('app/lib/glBlur.js', 'utf8'));
const b = await ({ chromium, firefox, webkit })[name].launch();
const p = await b.newPage(); await p.goto(origin + '/');
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name, n, info); };
const r = await p.evaluate(({ src }) => {
  const f = new Function(src + '\nreturn { applyGaussianBlur, applyGaussianBlurGL };')();
  const make = (w, h, alpha) => { const d = new Uint8ClampedArray(w * h * 4); let s = 7; for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) >>> 0; d[i] = (i % 4 === 3) ? (alpha ? ((s >>> 16) & 255) : 255) : (s >>> 16) & 255; } for (let y = 0; y < h; y += 37) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; d[i] = 255; d[i + 1] = 0; d[i + 2] = 0; } return d; };
  const out = [];
  for (const [w, h, sigma, alpha] of [[640, 2400, 1, true], [640, 3600, 5, true], [1000, 2500, 20, false], [333, 7000, 12.5, true]]) {
    const d = make(w, h, alpha), cpu = { width: w, height: h, data: new Uint8ClampedArray(d) }, gpu = { width: w, height: h, data: new Uint8ClampedArray(d) };
    f.applyGaussianBlur(cpu, sigma);
    const ok = f.applyGaussianBlurGL(gpu, sigma);
    let max = 0, n1 = 0;
    for (let i = 0; i < d.length; i += 4) { if (cpu.data[i + 3] === 0 && gpu.data[i + 3] === 0) continue; for (let c = 0; c < 4; c++) { const e = Math.abs(cpu.data[i + c] - gpu.data[i + c]); if (e > max) max = e; if (e > 1) n1++; } }
    out.push({ w, h, sigma, alpha, gpu: ok, max, over1: n1 });
  }
  const times = {};
  for (const [W, H] of [[4032, 3024], [5712, 4284], [8064, 2080]]) {
    const d = make(W, H, false);
    let t = performance.now(); const ok = f.applyGaussianBlurGL({ width: W, height: H, data: new Uint8ClampedArray(d) }, 5); times[`GPU ${W}x${H}`] = ok ? ((performance.now() - t) / 1000).toFixed(2) + ' s' : 'unavailable';
    t = performance.now(); f.applyGaussianBlur({ width: W, height: H, data: new Uint8ClampedArray(d) }, 5); times[`CPU ${W}x${H}`] = ((performance.now() - t) / 1000).toFixed(2) + ' s';
  }
  return { out, times };
}, { src });
for (const o of r.out) check(`${o.w}x${o.h} sigma ${o.sigma}${o.alpha ? ' with alpha' : ''}: GPU = CPU within 1 level`, o.gpu && o.max <= 1, `(GPU used: ${o.gpu}, max diff ${o.max}, values over 1: ${o.over1})`);
console.log(name, 'times (one blur, sigma 5):', JSON.stringify(r.times));
await b.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
