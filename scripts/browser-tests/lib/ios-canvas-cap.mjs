// The iPhone's canvas limit, MANDATORY and ON BY DEFAULT in every image bench (P16, 30/09).
// On 30/09 image-tools-big was announced 21/21 without --ios, and the iPhone path of the image tools had never been
// run: no image result may be announced again without this simulation. As on iOS/iPadOS Safari:
//   - any canvas over 16,777,216 pixels gets no context (getContext -> null), in the page AND in the tools' Workers
//     (the page passes window.__forceSafariCanvasCap to them; app/lib/bigImage.js simulateIosCanvasCap);
//   - drawing into or reading a canvas enlarged past the limit fails;
//   - window.__forceSafariCanvasCap = true, so the site's own probe (canvasBeyondSafariCap) answers "no".
// Every refusal is counted in window.__iosCanvasCapHits: a tool that tried a canvas over the limit is a failure,
// even if it showed a result (on an iPhone it would have been blank or refused).
// `--no-ios-cap` turns it off for one run, and every line of that run's summary says so: never a result to announce.
export const IOS_CAP_OFF = process.argv.includes('--no-ios-cap');

export function iosCanvasCapInit() {
  const MAX = 16777216;
  window.__forceSafariCanvasCap = true;
  window.__iosCanvasCapHits = 0;
  const over = (c) => c && c.width * c.height > MAX;
  const refuse = (what) => { window.__iosCanvasCapHits++; (window.__iosCanvasCapLog ||= []).push(what); };
  for (const C of [window.OffscreenCanvas, window.HTMLCanvasElement]) {
    if (!C) continue;
    const get = C.prototype.getContext;
    C.prototype.getContext = function (...a) { if (over(this)) { refuse(`getContext ${this.width}x${this.height}`); return null; } return get.apply(this, a); };
  }
  for (const X of [window.OffscreenCanvasRenderingContext2D, window.CanvasRenderingContext2D]) {
    if (!X) continue;
    for (const m of ['drawImage', 'getImageData', 'putImageData']) {
      const f = X.prototype[m];
      X.prototype[m] = function (...a) { if (over(this.canvas)) { refuse(`${m} ${this.canvas.width}x${this.canvas.height}`); throw new Error('Simulated iPhone canvas limit: canvas over 16,777,216 pixels'); } return f.apply(this, a); };
    }
  }
  if (window.HTMLCanvasElement) {
    const toBlob = HTMLCanvasElement.prototype.toBlob, toDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toBlob = function (cb, ...a) { if (over(this)) { refuse(`toBlob ${this.width}x${this.height}`); return cb(null); } return toBlob.call(this, cb, ...a); };
    HTMLCanvasElement.prototype.toDataURL = function (...a) { if (over(this)) { refuse(`toDataURL ${this.width}x${this.height}`); return 'data:,'; } return toDataURL.apply(this, a); };
  }
}

/** Applies the simulation to a browser context (every page opened in it). No-op only with --no-ios-cap. */
export async function applyIosCanvasCap(ctx) {
  if (!IOS_CAP_OFF) await ctx.addInitScript(iosCanvasCapInit);
}

/** Canvases the page tried over the limit ([] when none). */
export async function iosCapHits(page) {
  if (IOS_CAP_OFF) return [];
  return page.evaluate(() => window.__iosCanvasCapLog || []).catch(() => []);
}

/** Suffix for every summary line: which path was measured. */
export const iosCapLabel = () => (IOS_CAP_OFF ? 'WITHOUT the iPhone canvas limit (--no-ios-cap): NOT a result to announce' : 'iPhone canvas limit simulated (16.7 MP, page + Workers)');
