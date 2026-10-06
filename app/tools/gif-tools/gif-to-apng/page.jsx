'use client';
import { headerSize, sizeProblem, MAX_ANIMATION_PIXELS } from '../../../lib/gifEncode';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { gifFrames } from '../../../lib/gifFrames';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function GifToApngPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setResult(null);
  };

  // P24 review (03/10): the GIF's own number of plays is kept — UPNG writes "loop forever", so a GIF made to play
  // once looped endlessly. GIF: the NETSCAPE2.0 extension holds the repeat count (0 = forever); without it, the GIF
  // plays once. APNG: acTL num_plays (0 = forever) = GIF repeat count + 1.
  const gifLoopCount = (b) => {
    for (let i = 0; i + 18 < b.length; i++) {
      if (b[i] === 0x21 && b[i + 1] === 0xff && b[i + 2] === 0x0b && String.fromCharCode(...b.subarray(i + 3, i + 14)) === 'NETSCAPE2.0' && b[i + 14] === 3 && b[i + 15] === 1) {
        const repeat = b[i + 16] | (b[i + 17] << 8);
        return repeat === 0 ? 0 : repeat + 1;
      }
    }
    return 1;
  };
  const withPlays = (png, plays) => {
    const u = new Uint8Array(png), dv = new DataView(u.buffer);
    for (let i = 8; i + 12 <= u.length;) {
      const len = dv.getUint32(i), type = String.fromCharCode(u[i + 4], u[i + 5], u[i + 6], u[i + 7]);
      if (type === 'acTL') {
        dv.setUint32(i + 12, plays);
        let c = ~0; // CRC-32 over type + data
        for (let k = i + 4; k < i + 8 + len; k++) { c ^= u[k]; for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
        dv.setUint32(i + 8 + len, ~c >>> 0);
        break;
      }
      if (type === 'IDAT') break;
      i += 12 + len;
    }
    return u.buffer;
  };

  const convert = async () => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const UPNGModule = await import('upng-js');
      const UPNG = UPNGModule.default || UPNGModule;
      // Frames composited as a GIF decoder does (29/09): the old putImageData
      // pasting left holes wherever an optimised GIF uses transparency for
      // "unchanged", and ignored disposal 3.
      const buf = await file.arrayBuffer();
      const head = new Uint8Array(buf, 0, Math.min(16, buf.byteLength));
      if (!buf.byteLength || !(head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46)) throw new Error('This is not a GIF file (or it is empty). Choose an animated GIF.');
      const tooBig = sizeProblem(headerSize(head));
      if (tooBig) throw new Error(tooBig);
      const { width, height, frames } = await gifFrames(buf);
      const rgbaFrames = frames.map((f) => f.imageData.data.buffer);
      const delays = frames.map((f) => f.delay);

      const pngBuffer = withPlays(UPNG.encode(rgbaFrames, width, height, 0, delays), gifLoopCount(new Uint8Array(buf)));
      const blob = new Blob([pngBuffer], { type: 'image/png' });
      setResult({ url: URL.createObjectURL(blob), frameCount: rgbaFrames.length });
    } catch(e) { setError((e && e.message) || 'This file could not be converted. It may be damaged.'); } // P21: a message on the page, not a blocking alert()
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">GIF to APNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to APNG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img alt="Preview of your image" src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="a GIF file" /></p>}
            <input ref={inputRef} type="file" accept="image/gif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to APNG'}</button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><p className="text-green-600 text-center text-sm font-semibold">{result.frameCount} frame{result.frameCount === 1 ? '' : 's'}</p><FileDownload href={result.url} name="converted.png" /></div>}
        </div>
      </div>
      <SeoContent
        title="GIF to APNG"
        description="GIF to APNG turns an animated GIF into an animated PNG. It decodes the GIF with gifuct-js, rebuilds every frame the way a GIF player draws it, including optimized GIFs that store only the changed pixels and all three disposal methods, and writes the frames losslessly with upng-js. Frame delays and the play count of the GIF are carried into the APNG. Colors and transparency stay exactly as in the GIF: the tool adds no detail the GIF did not have. The GIF is converted on this page and is not uploaded."
        howToTitle="How to convert GIF to APNG"
        howTo={[
          "Choose an animated .gif; it starts playing in the box.",
          "Click \"Convert to APNG\".",
          "Check the result and the number of frames shown under it.",
          "Click \"Download\" to save converted.png, an animated PNG."
        ]}
        specs={[
          { label: "Input", value: "GIF (image/gif)" },
          { label: "Output", value: "APNG, saved as converted.png" },
          { label: "Frame size", value: `Up to ${(MAX_ANIMATION_PIXELS / 1e6).toFixed(1)} megapixels per frame, read from the GIF header before decoding` },
          { label: "Compression", value: "Lossless, with no color reduction" },
          { label: "Timing", value: "Delays copied from the GIF; a delay of 0 becomes 100 ms" }
        ]}
        privacy="The GIF is decoded and the APNG encoded by JavaScript on this page, so your file is not uploaded and the APNG is created on your device. When an error appears, our error log gets that sentence cleaned of names, plus the tool and browser names; the GIF itself is never part of it."
        faqs={[
          { q: "Will an optimized GIF come out with holes?", a: "No. Each frame is drawn over the previous one, as a GIF player does, so a GIF that stores only the pixels that changed still gives complete frames. The three disposal methods of the GIF format, including restore to background and restore to previous, are applied." },
          { q: "Does the APNG loop like the GIF?", a: "Yes. The loop count stored in the GIF, in its NETSCAPE2.0 block, is copied: forever stays forever, and a GIF without that block, which plays once, gives an APNG that plays once." },
          { q: "Is the conversion lossy?", a: "No. The rebuilt frames are stored as full-color PNG data with their alpha channel, so every pixel is kept. The APNG cannot be better than the GIF, though: the palette and the hard transparency of the GIF stay as they were." },
          { q: "Is there a size limit?", a: `Yes: ${(MAX_ANIMATION_PIXELS / 1e6).toFixed(1)} megapixels per frame at most, taken from the GIF header before anything is decoded. File size and frame count have no fixed cap; long animations take longer.` }
        ]}
        tips={[
          "Need a GIF again later? APNG to GIF converts in the other direction."
        ]}
      />
    </div>
  );
}