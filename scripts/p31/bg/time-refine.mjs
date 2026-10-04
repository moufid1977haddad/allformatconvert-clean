// P31 (03/10) — time of refineAtWorkingSize at the page's working size (1 MP), per estimator, in Node (V8, as Chromium).
// Synthetic photo: a disc with a soft, too-wide mask on a gradient. Usage: node scripts/p31/bg/time-refine.mjs
import { refineAtWorkingSize, DEFAULTS } from '../../../app/lib/mattingRefine.js';

const w = 1155, h = 866; // 1 MP, 4:3 like a 12 MP iPhone photo reduced
const rgba = new Uint8ClampedArray(w * h * 4), mask = new Uint8Array(w * h);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const i = y * w + x, d = Math.hypot(x - w / 2, y - h / 2), inside = d < 300;
  rgba[i * 4] = inside ? 230 : 90 + x / 20; rgba[i * 4 + 1] = inside ? 220 : 80; rgba[i * 4 + 2] = inside ? 210 : 200; rgba[i * 4 + 3] = 255;
  mask[i] = Math.max(0, Math.min(255, Math.round((310 - d) * 12)));
}
const variants = JSON.parse(process.argv[2] || '{"blur (P21)":{},"local":{"estimator":"local"},"local+ML":{"estimator":"local","ml":true}}');
for (const [name, v] of Object.entries(variants)) {
  const t = [];
  for (let k = 0; k < 3; k++) { const t0 = performance.now(); refineAtWorkingSize(rgba, mask, w, h, { ...DEFAULTS, ...v }); t.push(performance.now() - t0); }
  console.log(name.padEnd(14), t.map((x) => x.toFixed(0) + ' ms').join(', '));
}
