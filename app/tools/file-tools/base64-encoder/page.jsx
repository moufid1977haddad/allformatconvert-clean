'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef, useMemo, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { detectSignature } from '../../../lib/fileSignature';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

// Audit 2 (29/09): a file the browser has no type for (HEIC or AVIF on some systems, a file without extension) came
// out as data:application/octet-stream, which no browser displays as an image -- the type is now read from the
// content; the raw Base64 (without the data: prefix) can be chosen, as base64.guru offers; a very large result is
// no longer pushed whole into the text box (the tab froze): a preview is shown and the full text downloads.
// P23 (02/10): measured in WebKit (Safari's engine), a read-only text box takes 0.27 s for 100 000 characters, 6.9 s
// for 1 000 000 (Chromium 0.28 s): the preview is 100 000 characters (scripts/p23/textarea-cost.mjs).
const PREVIEW_CHARS = 100000;
export default function FileBase64EncoderPage() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [raw, setRaw] = useState(false);
  const out = useMemo(() => (raw ? result.slice(result.indexOf(',') + 1) : result), [result, raw]);
  const txtUrl = useMemo(() => (out ? URL.createObjectURL(new Blob([out], { type: 'text/plain' })) : null), [out]);
  useEffect(() => () => { if (txtUrl) URL.revokeObjectURL(txtUrl); }, [txtUrl]);
  const inputRef = useRef();
  const encode = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    // P21: Base64 of an empty file is an empty text — said, not handed over as a result.
    if (emptyFileProblem(file)) { setResult(''); setError(emptyFileProblem(file, 'encode')); return; }
    setLoading(true);
    setError('');
    setResult('');
    setFileName(file.name);
    try {
      const head = new Uint8Array(await file.slice(0, 0x8010).arrayBuffer());
      const sig = !file.type || file.type === 'application/octet-stream' ? detectSignature(head) : null;
      const reader = new FileReader();
      reader.onload = () => {
        let url = reader.result;
        if (sig) url = url.replace(/^data:[^;,]*/, 'data:' + sig.mime);
        setResult(url);
        setLoading(false);
      };
      reader.onerror = () => { setError('Failed to read file: ' + (reader.error?.message || 'unknown error')); setLoading(false); };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read file: ' + (err?.message || 'unknown error'));
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File to Base64</h1>
        <p className="text-neutral-500 text-center mb-8">Convert any file to Base64 encoding</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{fileName || <UploadPrompt what="any file" />}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={encode} />
          </div>
          {loading && <p className="text-center text-neutral-500">Encoding...</p>}
          {error && <p role="alert" className="text-center text-red-600 text-sm">{error}</p>}
          {result && (() => {
            const big = out.length > PREVIEW_CHARS;
            return (
              <div className="space-y-2">
                <div className="flex gap-2 text-sm">
                  {[[false, 'Data URL'], [true, 'Raw Base64']].map(([v, l]) => <button key={l} onClick={() => setRaw(v)} className={'px-3 py-1 rounded-lg font-semibold ' + (raw === v ? 'bg-indigo-600 text-white' : 'bg-neutral-200 text-neutral-800')}>{l}</button>)}
                  <span className="ml-auto self-center text-neutral-500" data-b64-length>{out.length.toLocaleString()} characters</span>
                </div>
                <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={big ? out.slice(0, PREVIEW_CHARS) : out} readOnly data-b64 />
                {big && <p className="text-xs text-neutral-500">Preview of the first {PREVIEW_CHARS.toLocaleString()} characters; Copy and Download give the whole text.</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigator.clipboard.writeText(out)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy Base64</button>
                  <FileDownload href={txtUrl} name={(fileName || 'file') + '.base64.txt'} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      <SeoContent
        title="File to Base64"
        description="File to Base64 is a free online tool that instantly converts any file into a Base64-encoded data URL, right in your browser. Upload a file and get a ready-to-use Base64 string for embedding in HTML, CSS, JSON, or API payloads — nothing is ever uploaded to a server."
        howTo={[
          "Click the upload area and select any file from your device.",
          "The file is encoded to Base64 automatically the moment it's selected — no extra button to click.",
          "Review the encoded string in the output box.",
          "Click \"Copy Base64\" to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is File to Base64 free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can encode." },
          { q: "Is my file uploaded anywhere?", a: "No. The file is read and encoded locally using the browser's FileReader API — it never leaves your device." },
          { q: "What kinds of files can I encode?", a: "Any file type — images, PDFs, documents, and more — one file at a time." },
          { q: "What does the output look like?", a: "A full data URL (data:<mime-type>;base64,<data>) ready to paste into an src attribute, or the raw Base64 alone for a JSON payload or API call — switch with the Data URL / Raw Base64 buttons. When the browser does not know the file's type, it is read from the file's content." }
        ]}
        tips={[
          "Use the Base64 output directly as an image or CSS background src to avoid an extra HTTP request for small assets.",
          "Base64 is a third larger than the file. For large files the box shows a preview; use Download .txt to keep the whole text.",
          "Base64 is an encoding, not encryption — don't use it to hide or protect sensitive data.",
          "Choose \"Raw Base64\" when you only need the payload without the \"data:mime/type;base64,\" prefix."
        ]}
      />
    </div>
  );
}