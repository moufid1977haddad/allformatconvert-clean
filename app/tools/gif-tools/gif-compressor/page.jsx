'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function GifCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); };

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const gifsicle = (await import('gifsicle-wasm-browser')).default;
      // Quality 100 -> --lossy=0 (no lossy compression, still gets -O2's
      // lossless optimization); quality 10 -> --lossy=180, near the top of
      // gifsicle's 1-200 lossy range.
      const lossy = Math.round((100 - quality) * 2);
      const outFiles = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`-O2 --lossy=${lossy} input.gif -o /out/output.gif`],
      });
      const outBlob = outFiles[0];
      setResult({ url: URL.createObjectURL(outBlob), originalSize: file.size, newSize: outBlob.size });
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress GIF files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{loading ? 'Compressing...' : 'Compress'}</button>
          {result && (
            <div className="space-y-3">
              <img src={result.url} className="max-h-48 mx-auto rounded border border-neutral-200" />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After</div><div className="font-bold text-indigo-400">{formatSize(result.newSize)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Saved</div><div className="font-bold text-green-400">{Math.max(0, Math.round((1-result.newSize/result.originalSize)*100))}%</div></div>
              </div>
              <a href={result.url} download="compressed.gif" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="GIF Compressor"
        description="GIF Compressor shrinks your animated GIF's file size while keeping the animation intact, using gifsicle compiled to WebAssembly (gifsicle-wasm-browser) entirely in your browser — nothing is uploaded to a server. The quality slider controls gifsicle's lossy compression level: higher quality applies less lossy compression (relying mainly on lossless optimization), while lower quality allows more aggressive lossy compression for a smaller file."
        howTo={[
          "Click the upload area and select a GIF file.",
          "Adjust the quality slider — lower values compress more aggressively but can introduce visible noise.",
          "Click \"Compress\" to process the file locally.",
          "Review the before/after size comparison, preview the animated result, and download it."
        ]}
        faqs={[
          { q: "Does this reduce my GIF's file size while keeping it animated?", a: "Yes — it uses gifsicle's real GIF optimization and lossy compression, and the output stays a fully animated GIF." },
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