'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { imageHeaderSize, OPENABLE_PIXELS } from '../../../lib/fileChecks';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function GifCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(80);
  // P24 (03/10): ezgif's GIF optimizer also reduces the colours and the size; gifsicle does both (--colors, --scale)
  const [colors, setColors] = useState(256);
  const [scale, setScale] = useState(100);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); };

  const compress = async () => {
    setError('');
    if (!file) return;
    // P23: an empty file, a file that is not a GIF, or a GIF whose frame is enormous (read from its header) is said
    // before gifsicle runs; gifsicle giving nothing back showed the raw "Failed to execute 'createObjectURL'".
    if (!file.size) { setError('This file is empty (0 bytes): there is no GIF in it. Choose the file again.'); return; }
    const head = new Uint8Array(await file.slice(0, 6).arrayBuffer());
    if (String.fromCharCode(...head.subarray(0, 4)) !== 'GIF8') { setError(`This is not a GIF file: it may be damaged, or another kind of picture renamed .${(file.name.split('.').pop() || '').toLowerCase()}. For a PNG, JPG or WebP, use our Image Compressor.`); return; }
    const size = await imageHeaderSize(file);
    if (size && size.width * size.height > OPENABLE_PIXELS) { setError(`This GIF is ${size.width.toLocaleString('en-US')} × ${size.height.toLocaleString('en-US')} pixels (${Math.round(size.width * size.height / 1e6)} megapixels): too large to compress in a browser.`); return; }
    setLoading(true);
    try {
      const gifsicle = (await import('gifsicle-wasm-browser')).default;
      // Quality 100 -> --lossy=0 (no lossy compression, still gets -O2's
      // lossless optimization); quality 10 -> --lossy=180, near the top of
      // gifsicle's 1-200 lossy range.
      const lossy = Math.round((100 - quality) * 2);
      const outFiles = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`-O2 --lossy=${lossy}${colors < 256 ? ` --colors ${colors}` : ''}${scale < 100 ? ` --scale ${scale / 100}` : ''} input.gif -o /out/output.gif`],
      });
      const outBlob = outFiles && outFiles[0];
      if (!outBlob || !outBlob.size) throw new Error('This GIF could not be compressed: it may be damaged. Try opening it in a browser or image viewer to check.');
      setResult({ url: URL.createObjectURL(outBlob), originalSize: file.size, newSize: outBlob.size });
    } catch(e) { setError((e && e.message) || 'This file could not be converted. It may be damaged.'); } // P21: a message on the page, not a blocking alert()
    setLoading(false);
  };

  const formatSize = formatBytes;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress GIF files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <img alt="Preview of your image" src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="a GIF file" /></p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input aria-label="Quality (%)" type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Colours</span>
              <select id="gc-colors" value={colors} onChange={e => { setColors(Number(e.target.value)); setResult(null); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">{[256, 128, 64, 32, 16].map(n => <option key={n} value={n}>{n === 256 ? 'Keep (up to 256)' : n}</option>)}</select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Size</span>
              <select id="gc-scale" value={scale} onChange={e => { setScale(Number(e.target.value)); setResult(null); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">{[100, 75, 50, 33, 25].map(n => <option key={n} value={n}>{n === 100 ? 'Keep' : n + '%'}</option>)}</select></label>
          </div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{loading ? 'Compressing...' : 'Compress'}</button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded border border-neutral-200" />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After</div><div className="font-bold text-indigo-400">{formatSize(result.newSize)}</div></div>
                {/* A compressor never hands back a bigger file as a success (28/09): a GIF that is already optimised is said so. */}
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">{result.newSize >= result.originalSize ? 'Larger by' : 'Saved'}</div><div className={`font-bold ${result.newSize >= result.originalSize ? 'text-amber-700' : 'text-green-700'}`} data-saved>{Math.abs(Math.round((1 - result.newSize / result.originalSize) * 100))}%</div></div>
              </div>
              {result.newSize >= result.originalSize && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900" data-larger>
                  <p className="font-semibold">Your GIF is already well optimised.</p>
                  <p>At this quality the result is {formatSize(result.newSize)}, not smaller than your {formatSize(result.originalSize)}: keep your original, or lower the quality and try again.</p>
                </div>
              )}
              <FileDownload href={result.url} name="compressed.gif" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="GIF Compressor"
        description="GIF Compressor makes an animated GIF lighter with gifsicle, compiled to WebAssembly and run on this page. Three settings combine: the quality slider sets the lossy level of gifsicle, Colours reduces the palette, and Size scales every frame down. The animation, its frames and its timing are kept. The result shows the size before and after; when it is not smaller, the page says so and suggests keeping your original. Only GIF files are accepted: for PNG, JPG or WebP pictures, use Image Compressor."
        howToTitle="How to compress a GIF"
        howTo={[
          "Choose the .gif to shrink; it plays above the settings.",
          "Move the \"Quality\" slider: 100 keeps only the lossless optimization of gifsicle, lower values allow more lossy compression.",
          "If needed, pick fewer \"Colours\" (128 down to 16) or a smaller \"Size\".",
          "Click \"Compress\" and compare \"Before\" and \"After\".",
          "Click \"Download\" to save compressed.gif."
        ]}
        specs={[
          { label: "Input", value: "GIF only (.gif)" },
          { label: "Output", value: "GIF, saved as compressed.gif" },
          { label: "Quality", value: "A slider from 10 to 100: at 100, lossless optimization only; at 10, the strongest lossy level" },
          { label: "Colours", value: "Keep (up to 256), 128, 64, 32 or 16" },
          { label: "Size", value: "Keep, 75%, 50%, 33% or 25% of the width and height" },
          { label: "Picture size", value: `Up to ${OPENABLE_PIXELS / 1e6} megapixels (width × height of the GIF)` }
        ]}
        privacy="gifsicle runs as WebAssembly inside this page: the GIF is read from your device and the compressed copy stays in this page until you download it; nothing is uploaded. The gifsicle code is part of the site's own files. If something fails, the report sent to our error log holds the cleaned message, the tool name and your browser and its version, not the GIF."
        faqs={[
          { q: "Will my GIF stay animated?", a: "Yes. gifsicle rewrites every frame with its delay; only the pixel data is optimized, simplified by the lossy setting, reduced in colors or scaled. The preview under the button plays the compressed version before you download it." },
          { q: "Is lowering the quality the only way to shrink a GIF?", a: "No. \"Colours\" keeps 128, 64, 32 or 16 colors instead of up to 256, and \"Size\" scales every frame down. Flat graphics often look the same with far fewer colors. You can combine all three settings and compress again." },
          { q: "Can the result be larger than my GIF?", a: "Yes, for a GIF that is already well optimized. The page then shows \"Larger by\" with a percentage and says so, so you can keep your original or lower the quality and try again." },
          { q: "Will a low quality setting show noise?", a: "Yes, at low values: the lossy mode of gifsicle changes pixels so the data compresses better, which can look like speckles, mostly on flat color areas. Raise \"Quality\" and compress again if you see it." },
          { q: "Is there a size limit?", a: `Yes: the picture of the GIF may be up to ${OPENABLE_PIXELS / 1e6} megapixels, read from its header before compression starts. The file size has no fixed limit; a large GIF needs more memory and time on your device.` }
        ]}
        tips={[
          "The first compression on the page loads gifsicle, so it takes longer than the next ones."
        ]}
      />
    </div>
  );
}