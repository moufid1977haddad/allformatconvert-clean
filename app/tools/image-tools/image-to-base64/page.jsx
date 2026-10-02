'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sniffFormat } from '../../../lib/detectFileFormat';
import { TextDownload } from '../../../components/FileDownload';
// P23 (02/10): a 2 MB photo gave 2.6 million characters pushed whole into the text box: WebKit (Safari's engine) froze
// the page 84 s (Chromium 2.9 s). Measured: 100 000 characters take 0.27 s in WebKit, 1 000 000 take 6.9 s
// (scripts/p23/textarea-cost.mjs). The box shows the first 100 000; Copy and Download give everything (base64.guru,
// measured the same day, pushes the whole text into its box).
const PREVIEW_CHARS = 100000;
export default function ImageToBase64Page() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();
  const encode = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setResult('');
    if (emptyFileProblem(file)) { setFileName(''); setError(emptyFileProblem(file, 'encode')); return; } // P21
    setFileName(file.name);
    // When the browser does not know the file's type (HEIC or AVIF on some systems, a file without
    // extension), readAsDataURL writes "data:application/octet-stream", a URI no browser shows as an
    // image (29/09). The real type is read from the file's first bytes.
    const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', tiff: 'image/tiff', bmp: 'image/bmp', webp: 'image/webp', ico: 'image/x-icon', heic: 'image/heic', avif: 'image/avif' };
    const reader = new FileReader();
    reader.onload = async () => {
      let url = reader.result;
      if (url.startsWith('data:application/octet-stream') || url.startsWith('data:;')) {
        const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
        const found = sniffFormat(head);
        if (found && MIME[found.format]) url = url.replace(/^data:[^;,]*/, 'data:' + MIME[found.format]);
        else if (/<svg[\s>]/i.test(await file.slice(0, 1024).text())) url = url.replace(/^data:[^;,]*/, 'data:image/svg+xml');
        else { setError("This file's type could not be recognized as an image; the data URI below says application/octet-stream."); }
      }
      setResult(url);
    };
    reader.onerror = () => setError('Could not read image file');
    reader.readAsDataURL(file);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image to Base64</h1>
        <p className="text-neutral-500 text-center mb-8">Convert images to Base64 data URI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{fileName || 'Click or drop an image here'}</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={encode} />
          </div>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={result.length > PREVIEW_CHARS ? result.slice(0, PREVIEW_CHARS) : result} readOnly />{result.length > PREVIEW_CHARS && <p className="text-xs text-neutral-500">Preview of the first {PREVIEW_CHARS.toLocaleString('en-US')} of {result.length.toLocaleString('en-US')} characters, so the page stays responsive; Copy Base64 and Download give the whole data URI.</p>}<button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy Base64</button><TextDownload text={result} name={(fileName || 'image').replace(/\.[^.]+$/, '') + '.base64.txt'} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image to Base64"
        description="Image to Base64 reads an image file and encodes it as a Base64 data URI, entirely in your browser using the FileReader API — your file is never uploaded to a server. The encoding happens automatically as soon as you select a file, ready to copy."
        howTo={[
          "Click the upload area and select an image file from your device.",
          "The Base64 data URI is generated automatically — there's no separate convert button.",
          "Review the encoded text in the output box.",
          "Click 'Copy Base64' to copy the full data URI to your clipboard."
        ]}
        faqs={[
          { q: "What image formats does Image to Base64 support?", a: "It accepts common formats your browser can open, such as JPG, PNG, GIF, and WebP." },
          { q: "Is there a file size limit for the Image to Base64 converter?", a: "There's no fixed size limit — encoding happens locally, so it's limited only by your device's available memory. Keep in mind large images produce very long Base64 strings." },
          { q: "Can I use Base64 images in all browsers?", a: "Yes, data URIs are supported by all current browsers." },
          { q: "Why would I need to convert an image to Base64?", a: "It's useful for embedding small images directly in HTML, CSS, or JavaScript without a separate file request." }
        ]}
        tips={[
          "Base64 encoding works best for small images and icons — large images produce very long strings that bloat your code.",
          "Compress or resize an image before encoding it if you want a shorter Base64 string.",
          "Paste the full data URI (starting with data:image/...) directly into an src or url() property.",
          "Test the encoded image in your actual application before relying on it, to confirm it renders correctly."
        ]}
      />
    </div>
  );
}