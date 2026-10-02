'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { drawToRaster, encodeRaster } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';

export default function ImageComparisonPage() {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [mode, setMode] = useState('slider');
  const [diff, setDiff] = useState(null);
  const [error, setError] = useToolError('');
  // Pixel differences (as Diffchecker's image compare): image 2 is drawn at the size of image 1; a pixel differs
  // when one channel (or alpha) differs by more than 16/255, and is shown in red over a faded copy of image 1.
  // P21 (robustness): an image that cannot be opened, or is too large, is said at once (the slider simply showed
  // nothing), and is not put on screen; a later pick wins over a slower earlier one (review, 02/10).
  const picks = useRef({ first: 0, second: 0 });
  const checkImage = (f, which, accept) => {
    // only this field's own message is cleared: picking the second image must not hide the first one's problem
    setError((prev) => (prev.startsWith(`The ${which} `) ? '' : prev));
    const n = ++picks.current[which];
    if (!f.size) { setError(`The ${which} file is empty (0 bytes).`); return; }
    const u = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(u);
      if (n !== picks.current[which]) return;
      if (im.naturalWidth * im.naturalHeight > 100_000_000) { setError(`The ${which} image is ${im.naturalWidth} × ${im.naturalHeight} pixels: too large to compare here (100 megapixels at most). Make it smaller first with our Image Resizer.`); return; }
      accept();
    };
    im.onerror = () => { URL.revokeObjectURL(u); if (n === picks.current[which]) setError(`The ${which} file, "${f.name}", is not an image this browser can open. Choose a JPG, PNG, WebP or GIF image.`); };
    im.src = u;
  };
  const computeDiff = async () => {
    setError('');
    try {
      const load = (src) => new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ko(new Error('Could not read one of the images.')); im.src = src; });
      const [a, bImg] = await Promise.all([load(image1), load(image2)]);
      const w = a.naturalWidth, h = a.naturalHeight;
      // 30/09: two phone photos of 24/48 MP exceed the one canvas iOS allows (16.7 MP): each is drawn in bands if
      // needed (lib/imageOutput.js), compared on their pixels, and the difference image written as a Blob.
      const A = (await drawToRaster(w, h, (ctx, y) => ctx.drawImage(a, 0, -y))).rgba();
      const B = (await drawToRaster(w, h, (ctx, y) => ctx.drawImage(bImg, 0, -y, w, h))).rgba();
      const out = new Uint8ClampedArray(w * h * 4);
      let n = 0;
      for (let i = 0; i < A.length; i += 4) {
        const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]), Math.abs(A[i + 3] - B[i + 3]));
        if (d > 16) { n++; out[i] = 255; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 255; }
        else { const g = 0.2126 * A[i] + 0.7152 * A[i + 1] + 0.0722 * A[i + 2]; out[i] = out[i + 1] = out[i + 2] = 255 - (255 - g) * 0.3; out[i + 3] = 255; }
      }
      const blob = await encodeRaster(rasterFromRGBA(out, w, h), 'image/png');
      setDiff({ url: URL.createObjectURL(blob), changed: n, total: w * h, resized: bImg.naturalWidth !== w || bImg.naturalHeight !== h, w, h, w2: bImg.naturalWidth, h2: bImg.naturalHeight });
    } catch (e) { setDiff(null); setError(e.message); }
  };
  const ref1 = useRef();
  const ref2 = useRef();

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Comparison</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two images with a slider</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref1.current.click()}>
              {image1 ? <img src={image1} className="max-h-32 mx-auto rounded" /> : <p className="text-neutral-500 text-sm">Image 1 (Before)</p>}
              <input ref={ref1} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) checkImage(f, 'first', () => { setImage1(URL.createObjectURL(f)); setDiff(null); }); }} />
            </div>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref2.current.click()}>
              {image2 ? <img src={image2} className="max-h-32 mx-auto rounded" /> : <p className="text-neutral-500 text-sm">Image 2 (After)</p>}
              <input ref={ref2} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) checkImage(f, 'second', () => { setImage2(URL.createObjectURL(f)); setDiff(null); }); }} />
            </div>
          </div>
          {image1 && image2 && (
            <div className="flex gap-2 justify-center">
              {[['slider', 'Slider'], ['diff', 'Differences']].map(([v, l]) => <button key={v} onClick={() => { setMode(v); if (v === 'diff' && !diff) computeDiff(); }} className={'px-4 py-2 rounded-lg text-sm font-semibold transition ' + (mode === v ? 'bg-indigo-600 text-white' : 'bg-neutral-200 text-neutral-800')}>{l}</button>)}
            </div>
          )}
          {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}
          {image1 && image2 && mode === 'diff' && diff && (
            <div className="space-y-2 text-center">
              <p className="text-sm text-neutral-700" data-diff-summary>{diff.changed === 0 ? 'The two images are identical (no pixel differs by more than 16/255).' : `${diff.changed.toLocaleString()} of ${diff.total.toLocaleString()} pixels differ (${(100 * diff.changed / diff.total).toFixed(2)} %), shown in red.`}{diff.resized ? ` Image 2 (${diff.w2}×${diff.h2}) was scaled to the size of image 1 (${diff.w}×${diff.h}) to compare them.` : ''}</p>
              <img src={diff.url} className="max-w-full mx-auto rounded border border-neutral-200" alt="Differences" />
              <FileDownload href={diff.url} name="differences.png" />
            </div>
          )}
          {image1 && image2 && mode === 'slider' && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl" style={{height: '300px'}}>
                <img src={image2} className="absolute inset-0 w-full h-full object-contain bg-neutral-100" />
                <div className="absolute inset-0 overflow-hidden" style={{width: sliderPos + '%'}}>
                  <img src={image1} className="absolute inset-0 w-full h-full object-contain bg-neutral-100" style={{width: (100 / Math.max(sliderPos, 1) * 100) + '%', maxWidth: 'none'}} />
                </div>
                <div className="absolute top-0 bottom-0 w-1 bg-white" style={{left: sliderPos + '%'}}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-neutral-900 font-bold shadow-lg">⇄</div>
                </div>
              </div>
              <div><label className="block text-sm text-neutral-500 mb-1">Slider: {sliderPos}%</label><input aria-label="Slider (%)" type="range" min="0" max="100" value={sliderPos} onChange={e => setSliderPos(parseInt(e.target.value))} className="w-full" /></div>
              <div className="flex justify-between text-sm text-neutral-500"><span>Before</span><span>After</span></div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image Comparison"
        description="Image Comparison shows two images stacked with a draggable vertical divider, letting you slide between a 'before' and 'after' view, and a Differences view that marks in red every pixel that changed (more than 16/255 on any channel) with the share of pixels that differ, as Diffchecker's image compare does. Whole images are shown, never cropped. Both images stay in your browser — nothing is uploaded to a server."
        howTo={[
          "Click the first box and upload your 'before' image.",
          "Click the second box and upload your 'after' image.",
          "Drag the slider left and right to reveal more or less of each image.",
          "Switch to Differences to see exactly which pixels changed, and download that difference image if needed."
        ]}
        faqs={[
          { q: "What image formats does Image Comparison support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP." },
          { q: "Is my image data stored or shared?", a: "No, both images stay in your browser and are never uploaded to a server." },
          { q: "Can I compare more than two images at once?", a: "No, the tool only supports comparing two images at a time." },
          { q: "Does it highlight what changed?", a: "Yes — the Differences view paints every changed pixel red over a faded copy of the first image, gives the percentage of changed pixels, and can be downloaded as a PNG. Images of different sizes are compared after scaling the second to the first." }
        ]}
        tips={[
          "Use images with the same dimensions and framing for the most useful comparison.",
          "Drag the slider slowly across areas you want to inspect closely.",
          "If you want to share the comparison, take a manual screenshot of your browser window.",
          "Tiny differences from JPEG re-compression stay below the 16/255 threshold, so only real changes are painted."
        ]}
      />
    </div>
  );
}