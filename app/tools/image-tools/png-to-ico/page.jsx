'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

const ALL_SIZES = [16, 32, 48, 256];

function pngBlobForSize(img, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not encode PNG frame'))), 'image/png');
  });
}

// Builds a real ICONDIR/ICONDIRENTRY container (the native Windows ICO
// binary format) around PNG-encoded frames -- supported since Windows
// Vista and required for the 256x256 size, so PNG frames work for every
// size in one consistent code path instead of also needing a raw-BMP
// encoder for the smaller sizes.
function buildIco(entries) {
  const count = entries.length;
  const headerSize = 6 + 16 * count;
  const totalSize = headerSize + entries.reduce((sum, e) => sum + e.bytes.length, 0);
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);
  let dataOffset = headerSize;
  let entryOffset = 6;
  for (const e of entries) {
    const dim = e.size >= 256 ? 0 : e.size;
    buffer[entryOffset] = dim;
    buffer[entryOffset + 1] = dim;
    buffer[entryOffset + 2] = 0;
    buffer[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, e.bytes.length, true);
    view.setUint32(entryOffset + 12, dataOffset, true);
    buffer.set(e.bytes, dataOffset);
    dataOffset += e.bytes.length;
    entryOffset += 16;
  }
  return buffer;
}

export default function PngToIcoPage() {
  const [file, setFile] = useState(null);
  const [sizes, setSizes] = useState(ALL_SIZES);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setStatus('');
  };

  const toggleSize = (s) => {
    setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].sort((a, b) => a - b));
  };

  const convert = () => {
    if (!file || sizes.length === 0) return;
    setStatus('Converting...');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const entries = [];
        for (const s of sizes) {
          const blob = await pngBlobForSize(img, s);
          entries.push({ size: s, bytes: new Uint8Array(await blob.arrayBuffer()) });
        }
        const icoBytes = buildIco(entries);
        const icoBlob = new Blob([icoBytes], { type: 'image/x-icon' });
        setResult(URL.createObjectURL(icoBlob));
        setStatus('');
      } catch (err) {
        setStatus('Error: ' + err.message);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      setStatus('Error: could not load image file');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PNG to ICO</h1>
        <p className="text-neutral-500 text-center mb-8">Create favicon ICO from PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PNG file here'}</p>
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Sizes to include (a real multi-resolution ICO)</label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_SIZES.map(s => (
                <button key={s} onClick={() => toggleSize(s)} className={`py-2 rounded-lg font-semibold transition ${sizes.includes(s) ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{s}x{s}</button>
              ))}
            </div>
          </div>
          <button onClick={convert} disabled={!file || sizes.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert to ICO</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">Done!</div>
              <a href={result} download="favicon.ico" className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download ICO</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PNG to ICO"
        description="PNG to ICO builds a real, multi-resolution Windows ICO file from your PNG — with a proper ICONDIR/ICONDIRENTRY container around PNG-encoded frames at each selected size (16, 32, 48, and 256px by default) — entirely in your browser, with your file never uploaded to a server. The result is a genuine .ico binary, not a PNG simply renamed, so it works both as a browser favicon and in software (like Windows Explorer or app icon tooling) that expects the native ICO format."
        howTo={[
          "Click the upload area and select a PNG file from your device.",
          "Choose which sizes to bundle into the ICO: 16x16, 32x32, 48x48, and/or 256x256 (all four are selected by default).",
          "Click 'Convert to ICO' to build the multi-resolution icon file.",
          "Click the download button to save your favicon.ico file."
        ]}
        faqs={[
          { q: "What is an ICO file?", a: "An ICO file is an image format traditionally used for website favicons and application icons. A proper ICO container can bundle several resolutions of the same icon in one file, letting the OS or browser pick the best size for each context — this tool produces exactly that, not a single image renamed to .ico." },
          { q: "Do I need to install any software to use this tool?", a: "No, it's completely web-based and works directly in your browser." },
          { q: "Is there a file size limit for PNG uploads?", a: "There's no fixed limit — processing happens locally, and favicon source images are typically small anyway." },
          { q: "Can I convert multiple PNG files at once?", a: "No, only one file can be converted at a time." }
        ]}
        tips={[
          "For best results, start with a square PNG image at least as large as your biggest selected size (256px if included).",
          "Use a PNG with a transparent background if you want the icon to have transparency.",
          "Keep all four sizes selected for maximum compatibility — Windows uses different sizes for the taskbar, desktop, and Explorer views.",
          "Test the downloaded file in your browser's favicon slot, or by setting it as a desktop shortcut icon, to confirm it displays correctly."
        ]}
      />
    </div>
  );
}