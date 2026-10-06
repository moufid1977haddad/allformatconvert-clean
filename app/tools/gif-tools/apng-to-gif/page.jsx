'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { writeRgbaFrame, hasTransparency, headerSize, sizeProblem, MAX_ANIMATION_PIXELS } from '../../../lib/gifEncode';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function ApngToGifPage() {
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

  const convert = async () => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const UPNGModule = await import('upng-js');
      const UPNG = UPNGModule.default || UPNGModule;
      const gifenc = await import('gifenc');
      const arrayBuffer = await file.arrayBuffer();
      const tooBig = sizeProblem(headerSize(new Uint8Array(arrayBuffer, 0, Math.min(32, arrayBuffer.byteLength))));
      if (tooBig) throw new Error(tooBig);
      if (arrayBuffer.byteLength === 0 || !headerSize(new Uint8Array(arrayBuffer, 0, Math.min(32, arrayBuffer.byteLength)))) throw new Error('This is not a PNG / APNG file (or it is empty). Choose an animated PNG.');
      const img = UPNG.decode(arrayBuffer);
      const rgbaFrames = UPNG.toRGBA8(img).map((f) => new Uint8Array(f));
      // Transparency and play count are carried over (29/09): transparent pixels used to come out black, and an
      // APNG played once (acTL num_plays = 1) gave a GIF looping forever. GIF counts extra loops: n plays = n - 1.
      const plays = img.tabs.acTL ? img.tabs.acTL.num_plays : 0;
      const repeat = plays === 0 ? 0 : plays === 1 ? -1 : plays - 1;
      const dispose = rgbaFrames.some(hasTransparency) ? 2 : -1;
      const gif = gifenc.GIFEncoder();
      for (let i = 0; i < rgbaFrames.length; i++) {
        const delay = (img.frames[i] && img.frames[i].delay) || 100;
        writeRgbaFrame(gif, gifenc, rgbaFrames[i], img.width, img.height, { delay, dispose, ...(i === 0 ? { repeat } : {}) });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setResult({ url: URL.createObjectURL(blob), frameCount: rgbaFrames.length });
    } catch(e) { setError((e && e.message) || 'This file could not be converted. It may be damaged.'); } // P21: a message on the page, not a blocking alert()
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">APNG to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert APNG to GIF format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img alt="Preview of your image" src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an APNG file" /></p>}
            <input ref={inputRef} type="file" accept="image/png,image/apng" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><p className="text-green-600 text-center text-sm font-semibold">{result.frameCount} frame{result.frameCount === 1 ? '' : 's'}</p><FileDownload href={result.url} name="converted.gif" /></div>}
        </div>
      </div>
      <SeoContent
        title="APNG to GIF"
        description="APNG to GIF converts an animated PNG (APNG) into an animated GIF, for apps and sites that do not show APNG. It decodes every frame with upng-js and encodes them with gifenc, on this page. Each frame gets its own palette of up to 256 colors. Mostly transparent pixels become fully transparent and the others fully opaque, because GIF has no partial transparency. Frame delays and the number of plays are copied from the APNG. A plain, non-animated PNG works too and gives a one-frame GIF."
        howToTitle="How to convert APNG to GIF"
        howTo={[
          "Choose an .apng or .png file; a preview appears in the box.",
          "Click \"Convert to GIF\".",
          "Watch the GIF play; the frame count appears in green under it.",
          "Click \"Download\" to save converted.gif."
        ]}
        specs={[
          { label: "Input", value: "APNG or PNG (image/apng, image/png)" },
          { label: "Output", value: "Animated GIF, saved as converted.gif" },
          { label: "Frame size", value: `Up to ${(MAX_ANIMATION_PIXELS / 1e6).toFixed(1)} megapixels per frame (width × height), on every device` },
          { label: "Transparency", value: "1-bit: each pixel is either fully transparent or fully opaque" },
          { label: "Colors", value: "A palette of up to 256 per frame, without dithering" }
        ]}
        privacy="The APNG is read and the GIF is built by JavaScript in your browser; the file is not uploaded anywhere. An error shown on the page is logged for us with its cleaned text, the tool name and your browser and its version, without the file or its name."
        faqs={[
          { q: "Will transparency survive the conversion?", a: "Yes, but only on or off: GIF lets a pixel be fully transparent or fully opaque, nothing in between. Pixels with an alpha under 50 % become transparent and the others opaque, so soft shadows and smoothed edges turn into hard edges." },
          { q: "Does the GIF play as many times as the APNG?", a: "Yes. An APNG set to loop forever gives a GIF that loops forever, one set to play once plays once, and a fixed count such as three plays is kept. A frame without a delay is given 100 ms." },
          { q: "Will the colors stay exactly the same?", a: "No, not always. An APNG can hold millions of colors per frame and a GIF at most 256; each frame is reduced to its own palette without dithering, so gradients and photos may show bands, while flat graphics and icons usually look the same." },
          { q: "Is there a size limit?", a: `Yes: a frame may have at most ${(MAX_ANIMATION_PIXELS / 1e6).toFixed(1)} megapixels, read from the file header before any decoding. Neither the file size nor the number of frames has a fixed limit; a long animation simply takes longer to convert.` }
        ]}
        tips={[
          "To go the other way and keep full transparency, use GIF to APNG.",
          "GIF Compressor can make the converted GIF lighter afterwards."
        ]}
      />
    </div>
  );
}