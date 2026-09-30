// Kept apart from canvasFilters.js on purpose: blur.worker.js imports canvasFilters.js, and a module that both starts
// a worker and is imported by that worker makes the bundler build the worker into itself, endlessly.
import { applyGaussianBlur, gaussianBlurSupport } from './canvasFilters';

// P17: the blur spread over the device's cores (Web Workers), slice by slice. Each slice carries
// gaussianBlurSupport(sigma) rows of real image above and below, so the result is exactly applyGaussianBlur's.
// Slices of about one million pixels keep the memory per worker small (iPhone). Without Worker support, or if a
// worker cannot start, the same computation runs here, on the page: same result, only slower.
const SLICE_PIXELS = 1_000_000;
export async function applyGaussianBlurParallel(imageData, sigma) {
  if (!(sigma > 0)) return imageData;
  const { width: w, height: h, data } = imageData;
  const M = gaussianBlurSupport(sigma);
  const rowsPer = Math.max(1, Math.floor(SLICE_PIXELS / w), 4 * M);
  const tasks = [];
  for (let y = 0; y < h; y += rowsPer) tasks.push([y, Math.min(h, y + rowsPer)]);
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
  const n = Math.min(tasks.length, Math.max(1, Math.min(6, cores)));
  if (typeof Worker === 'undefined' || tasks.length < 2) return applyGaussianBlur(imageData, sigma);
  let workers;
  try {
    workers = Array.from({ length: n }, () => new Worker(new URL('./blur.worker.js', import.meta.url), { type: 'module' }));
  } catch {
    return applyGaussianBlur(imageData, sigma);
  }
  // Results go to their own buffer: a slice sent later must read the ORIGINAL rows of its margins, not blurred ones.
  const result = new Uint8ClampedArray(data.length);
  try {
    let next = 0;
    await Promise.all(workers.map((worker) => new Promise((resolve, reject) => {
      const send = () => {
        if (next >= tasks.length) return resolve();
        const id = next++, [y0, y1] = tasks[id];
        const top = Math.max(0, y0 - M), bottom = Math.min(h, y1 + M);
        const buf = data.slice(top * w * 4, bottom * w * 4).buffer;
        worker.postMessage({ id, buf, width: w, rows: bottom - top, keepTop: y0 - top, keepRows: y1 - y0, sigma }, [buf]);
      };
      worker.onmessage = ({ data: msg }) => {
        if (msg.error) return reject(new Error('Blur failed: ' + msg.error));
        result.set(new Uint8ClampedArray(msg.out), tasks[msg.id][0] * w * 4);
        send();
      };
      worker.onerror = (e) => { e.preventDefault?.(); reject(new Error('Blur failed: ' + (e.message || 'worker error'))); };
      send();
    })));
    data.set(result);
    return imageData;
  } finally {
    for (const worker of workers) worker.terminate();
  }
}
