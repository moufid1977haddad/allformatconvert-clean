// One slice of a Gaussian blur (app/lib/canvasFilters.js, applyGaussianBlurParallel): the slice arrives with enough
// rows of real image around the rows to keep, so the kept rows are exactly those of the whole image.
import { applyGaussianBlur } from './canvasFilters';

self.onmessage = ({ data: { id, buf, width, rows, keepTop, keepRows, sigma } }) => {
  try {
    const img = { width, height: rows, data: new Uint8ClampedArray(buf) };
    applyGaussianBlur(img, sigma);
    const out = img.data.slice(keepTop * width * 4, (keepTop + keepRows) * width * 4);
    self.postMessage({ id, out: out.buffer }, [out.buffer]);
  } catch (e) {
    self.postMessage({ id, error: String(e && e.message || e) });
  }
};
