'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { drawToRaster, encodeRaster, resultOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { icoEntries, singleEntryIco } from '../../../lib/icoEntries';
export default function ICOtoPNGPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [sizes, setSizes] = useState(null); // P24 (03/10): every image of the icon, as ezgif and Convertio give
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setResult(null); setSizes(null); setError(''); } };
  const decodeBlob = (blob) => new Promise((resolve, reject) => {
    const u = URL.createObjectURL(blob); const im = new Image();
    im.onload = async () => {
      try { const out = await drawToRaster(im.naturalWidth, im.naturalHeight, (ctx, y) => ctx.drawImage(im, 0, -y)); resolve(await encodeRaster(out, 'image/png')); }
      catch (err) { reject(err); } finally { URL.revokeObjectURL(u); }
    };
    im.onerror = () => { URL.revokeObjectURL(u); reject(new Error('unreadable')); };
    im.src = u;
  });
  const extractAll = async () => {
    setError(''); setSizes(null);
    try {
      const { entries, count } = icoEntries(new Uint8Array(await file.arrayBuffer()));
      const base = (file.name || 'icon').replace(/\.[^.]+$/, '');
      const list = [];
      for (const en of entries) {
        let blob = null;
        try { blob = en.png ? new Blob([en.data], { type: 'image/png' }) : await decodeBlob(singleEntryIco(en)); } catch { blob = null; }
        list.push({ ...en, blob, url: blob ? URL.createObjectURL(blob) : null, name: `${base}-${en.width}x${en.height}${en.bitCount ? '-' + en.bitCount + 'bit' : ''}${entries.filter((x) => x.width === en.width && x.height === en.height).length > 1 ? '-' + (en.index + 1) : ''}.png` });
      }
      const bad = list.filter((x) => !x.blob).length + (count - entries.length);
      setSizes({ list: list.filter((x) => x.blob), bad, count });
    } catch (err) { setError(err.message); }
  };
  const convert = () => {
    const img = new Image();
    img.onload = async () => {
      // 30/09: a Blob named after the original (a data: link saves nothing on iPhone), any size (bands on iPhone).
      setError('');
      try {
        const out = await drawToRaster(img.naturalWidth, img.naturalHeight, (ctx, y) => ctx.drawImage(img, 0, -y));
        setResult(resultOf(await encodeRaster(out, 'image/png'), file?.name || 'image', ''));
      } catch (e) { setError(e.message); }
    };
    img.onerror = () => {
      setError('Could not load this image. The file may be corrupted or in an unsupported format.');
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ICO to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert ICO to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".ico" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
          <button type="button" onClick={extractAll} disabled={!file} className="w-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-xl py-2 font-semibold transition" data-ico-all>Every size in this icon</button>
          {sizes && (
            <div className="space-y-2" data-ico-sizes>
              <p className="text-sm text-neutral-600">{sizes.list.length} image{sizes.list.length > 1 ? 's' : ''} in this icon{sizes.bad ? ` — ${sizes.bad} could not be read and ${sizes.bad > 1 ? 'are' : 'is'} left out` : ''}. PNG images inside the icon are given as they are, byte for byte.</p>
              <DownloadGroup zipName={(file?.name || 'icon').replace(/\.[^.]+$/, '') + '-sizes.zip'}>
                <div className="space-y-2">
                  {sizes.list.map((x) => <FileDownload key={x.index} href={x.url} blob={x.blob} name={x.name} note={`${x.width} × ${x.height}${x.bitCount ? ', ' + x.bitCount + '-bit' : ''}`} />)}
                </div>
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="ICO to PNG"
        description="ICO to PNG converts an ICO icon file to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. If the ICO contains multiple embedded sizes, the browser renders the one it picks as the source image; there's no per-size selector."
        howTo={[
          "Click the upload area and select an ICO file from your device.",
          "Click 'Convert' to render it to PNG.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is ICO to PNG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "What is the maximum file size I can upload?", a: "There's no fixed size limit — processing happens locally, and ICO files are typically small anyway." },
          { q: "Will the conversion affect image quality?", a: "No, the pixels are copied as-is. PNG also supports transparency, so any transparent areas in your ICO are preserved." },
          { q: "My icon holds several sizes: which one do I get?", a: "Convert gives the largest one, the image a browser shows. Every size in this icon gives each image it holds (16 × 16, 32 × 32, 48 × 48, 256 × 256…) as its own PNG, or all of them in one ZIP; PNG images stored inside the icon are given byte for byte." },
          { q: "Do I need to install any software?", a: "No, it works entirely in your browser with no downloads, and your file never leaves your device." }
        ]}
        tips={[
          "PNG files are ideal for web use since they support transparent backgrounds, which works well for logos and icons.",
          "Convert files one at a time — there's no batch upload option.",
          "Download your PNG right away, since nothing is stored after you leave the page.",
          "If your ICO has multiple resolutions embedded, check which one the browser used as the source before relying on the output for a specific size."
        ]}
      />
    </div>
  );
}