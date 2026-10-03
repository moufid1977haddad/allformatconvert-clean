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
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="a GIF file" /></p>}
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
              <img src={result.url} className="max-h-48 mx-auto rounded border border-neutral-200" />
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
        description="GIF Compressor shrinks your animated GIF's file size while keeping the animation intact, using gifsicle compiled to WebAssembly (gifsicle-wasm-browser) entirely in your browser — nothing is uploaded to a server. The quality slider controls gifsicle's lossy compression level: higher quality applies less lossy compression (relying mainly on lossless optimization), while lower quality allows more aggressive lossy compression for a smaller file."
        howTo={[
          "Click the upload area and select a GIF file.",
          "Adjust the quality slider — lower values compress more aggressively but can introduce visible noise — and optionally fewer colours or a smaller size.",
          "Click \"Compress\" to process the file locally.",
          "Review the before/after size comparison, preview the animated result, and download it."
        ]}
        faqs={[
          { q: "Does this reduce my GIF's file size while keeping it animated?", a: "Yes — it uses gifsicle's real GIF optimization and lossy compression, and the output stays a fully animated GIF." },
          { q: "Can I reduce the colours or the size too?", a: "Yes: 'Colours' keeps 128, 64, 32 or 16 instead of up to 256 (flat graphics often look the same with far fewer), and 'Size' scales every frame to 75, 50, 33 or 25% — the two strongest ways to shrink a GIF after lossy compression." },
          { q: "How much can I expect to save?", a: "It depends heavily on the source GIF and the quality setting — simple, few-color animations may shrink only modestly since they're already efficient, while complex or noisy ones can shrink substantially at lower quality settings." },
          { q: "Will lower quality settings look noticeably worse?", a: "Yes, at more aggressive settings — gifsicle's lossy compression can introduce visible speckled noise, especially on flat-color areas. If that's noticeable, raise the quality slider and re-compress." },
          { q: "Is GIF Compressor free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Processing happens entirely in your browser via WebAssembly — your file is never uploaded to a server." }
        ]}
        tips={[
          "Start around 70-80% quality and lower it only if you need a smaller file — gifsicle's lossy noise becomes more visible below that.",
          "GIFs with fewer colors and simpler animation compress more predictably than photographic or noisy content.",
          "The first compression after loading the page takes longer since the gifsicle WebAssembly module needs to download.",
          "If the saved percentage is low, your source GIF may already be well-optimized — try a lower quality value to see the trade-off."
        ]}
      />
    </div>
  );
}