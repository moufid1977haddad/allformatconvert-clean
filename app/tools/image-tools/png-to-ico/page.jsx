'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { FileDownload } from '../../../components/FileDownload';
import { unreadableImageMessage } from '../../../lib/fileChecks';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// P24 (03/10): Windows also uses 24, 64 and 128 px icons (CloudConvert and icoconvert offer them); the first four stay
// selected by default, as before.
const ALL_SIZES = [16, 24, 32, 48, 64, 128, 256];
const DEFAULT_SIZES = [16, 32, 48, 256];

function pngBlobForSize(img, size, fill = false) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  // A non-square PNG used to be stretched into the square icon (29/09): it is
  // now scaled to fit and centred on a transparent square, proportions kept.
  // fit: whole image, transparent margins; fill (P24): cropped to the square, centred, no margin
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = size / (fill ? Math.min(iw, ih) : Math.max(iw, ih));
  const w = Math.round((img.naturalWidth || img.width) * scale);
  const h = Math.round((img.naturalHeight || img.height) * scale);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, Math.floor((size - w) / 2), Math.floor((size - h) / 2), w, h);
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
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const [fill, setFill] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  // P23: an error was shown in light yellow (text-yellow-400: unreadable on white, no alert role), and as
  // "could not load image file" whatever the cause; now the exact sentence, in red, announced.
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setStatus('');
    setError(f && !f.size ? 'This file is empty (0 bytes): there is no picture in it. Choose the image again.' : '');
    if (f && !f.size) setFile(null);
  };

  const toggleSize = (s) => {
    setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].sort((a, b) => a - b));
  };

  const convert = () => {
    if (!file || sizes.length === 0) return;
    setError('');
    setStatus('Converting...');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        if (!img.naturalWidth || !img.naturalHeight) throw new Error(await unreadableImageMessage(file));
        const entries = [];
        for (const s of sizes) {
          const blob = await pngBlobForSize(img, s, fill);
          entries.push({ size: s, bytes: new Uint8Array(await blob.arrayBuffer()) });
        }
        const icoBytes = buildIco(entries);
        const icoBlob = new Blob([icoBytes], { type: 'image/x-icon' });
        setResult(URL.createObjectURL(icoBlob));
        setStatus('');
      } catch (err) {
        setStatus(''); setError(err?.message || 'The icon could not be made.');
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = async () => {
      URL.revokeObjectURL(url);
      setStatus(''); setError(await unreadableImageMessage(file));
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
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PNG file" />}</p>
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
          <label className="block text-sm"><span className="block text-neutral-500 mb-1">Image that is not square</span>
            <select id="ico-fit" value={fill ? 'fill' : 'fit'} onChange={(e) => { setFill(e.target.value === 'fill'); setResult(null); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2"><option value="fit">Fit (whole image, transparent margins)</option><option value="fill">Fill (cropped to the square, centered)</option></select></label>
          <button onClick={convert} disabled={!file || sizes.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert to ICO</button>
          {status && <p className="text-center text-neutral-500 text-sm">{status}</p>}
          {error && <p role="alert" className="text-center text-red-600 text-sm">{error}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">Done!</div>
              <FileDownload href={result} name="favicon.ico" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PNG to ICO"
        description={`PNG to ICO builds a Windows icon file from a PNG. You choose which sizes go inside, from ${ALL_SIZES[0]} to ${ALL_SIZES[ALL_SIZES.length - 1]} pixels square, and each size is drawn from your image and stored as a PNG entry in one ICO container: a real icon file, not a renamed PNG. A picture that is not square is either fitted on a transparent square or cropped to fill it, never stretched. The download is always named favicon.ico. PNG entries in an icon are read by Windows Vista and later. The icon is assembled in your browser.`}
        howToTitle="How to make an ICO file from a PNG"
        howTo={[
          `Pick the PNG for your icon, ideally square, in the upload area.`,
          `Under "Sizes to include", click the size buttons to add or remove sizes.`,
          `Under "Image that is not square", choose "Fit" or "Fill".`,
          `Click "Convert to ICO", then "Download" to save favicon.ico.`
        ]}
        specs={[
          { label: 'Input format', value: `PNG (.png), one file` },
          { label: 'Output format', value: `ICO named favicon.ico, with PNG-compressed entries` },
          { label: 'Icon sizes', value: `${ALL_SIZES.join(', ')} px square; ${DEFAULT_SIZES.join(', ')} selected at first` },
          { label: 'Non-square images', value: `Fit (whole image, transparent margins) or Fill (cropped to the square, centered)` }
        ]}
        privacy={`Each icon size is drawn on a canvas in your browser and packed into the .ico by the page's own code. The PNG you choose is not uploaded anywhere. A displayed error message is logged for us in cleaned form, with the tool's name and your browser's name and version, without the image or its name.`}
        faqs={[
          { q: "Can I include more sizes than the default ones?", a: `Yes. ${ALL_SIZES.length} sizes are offered: ${ALL_SIZES.join(', ')} pixels. ${DEFAULT_SIZES.join(', ')} are selected at first; click any size button to add or remove it, and the icon holds exactly the sizes that are highlighted.` },
          { q: "Is a rectangular image stretched to a square?", a: `No. "Fit" keeps the whole picture centered on a transparent square; "Fill" crops it to the square from the center. Choose one under "Image that is not square"; in both cases the proportions are kept.` },
          { q: "Will a small PNG look sharp at the largest size?", a: `No. Every size is drawn from your PNG, so an image smaller than a selected size is enlarged and looks soft. Start from a PNG at least as big as the largest size you select.` },
          { q: "Does the icon work on Windows XP?", a: `No. The sizes are stored as PNG inside the icon, which Windows reads from Vista onward. Older systems expect bitmap entries, which this tool does not write.` }
        ]}
        tips={[
          `To check an existing icon, open it with ICO to PNG, which can list every size the icon holds.`
        ]}
      />
    </div>
  );
}