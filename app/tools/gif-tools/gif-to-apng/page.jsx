'use client';
import { headerSize, sizeProblem } from '../../../lib/gifEncode';
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
        description="GIF to APNG decodes every frame of your GIF (using the gifuct-js library) and re-encodes them into a real, downloadable animated PNG (using upng-js), entirely in your browser — nothing is uploaded to a server. Frame delays are carried over from the original GIF."
        howTo={[
          "Click the upload area and select a GIF file from your device.",
          "Click \"Convert to APNG\" to decode every frame and re-encode them as an animated PNG.",
          "Preview the resulting APNG and check the frame count.",
          "Click \"Download\" next to the APNG file (converted.png) to save the result."
        ]}
        faqs={[
          { q: "Does this tool produce a real animated PNG?", a: "Yes — every frame of the source GIF is decoded and re-encoded into the APNG, not just a single snapshot." },
          { q: "Will colors improve compared to the original GIF?", a: "Colors are carried over as-is from the GIF's existing 256-color-per-frame palette — this tool doesn't add color detail the source GIF didn't have, it just repackages the same frames as APNG." },
          { q: "Does it handle every kind of GIF correctly?", a: "Yes for standard GIFs: each frame is composited over the previous one as a GIF player does, so optimised GIFs that only store the changed pixels come out complete, and the three disposal methods (leave, restore to background, restore to previous) are applied." },
          { q: "Is GIF to APNG free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "Frame delays from the original GIF are preserved, so playback speed should match the source animation.",
          "APNG supports full color and partial transparency, but this conversion only carries over what was already in the GIF — it won't add detail the source didn't have.",
          "Large or many-frame GIFs take longer to process since every frame is individually decoded and composited.",
          "The GIF's number of plays is kept: a GIF that loops forever gives an APNG that loops forever, one made to play once plays once."
        ]}
      />
    </div>
  );
}