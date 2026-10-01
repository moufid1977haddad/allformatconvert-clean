// Edge refinement off the main thread (P21, 02/10): app/lib/mattingRefine.js on the working copy of the photo.
import { refineAtWorkingSize } from '../../../lib/mattingRefine';

self.onmessage = ({ data }) => {
  try {
    const { rgba, mask, w, h } = data;
    const r = refineAtWorkingSize(rgba, mask, w, h);
    // One image for the alphas: R = opacity, G = mixing alpha, B = edge band.
    const layers = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) { layers[i * 4] = r.alpha[i]; layers[i * 4 + 1] = r.mix[i]; layers[i * 4 + 2] = r.band[i]; layers[i * 4 + 3] = 255; }
    self.postMessage({ ok: true, layers, fg: r.fg, bg: r.bg }, [layers.buffer, r.fg.buffer, r.bg.buffer]);
  } catch (e) {
    self.postMessage({ ok: false, message: (e && e.message) || String(e) });
  }
};
