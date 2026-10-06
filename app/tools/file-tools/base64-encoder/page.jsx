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
        title={"File to Base64"}
        description={"File to Base64 turns the bytes of any file, whether a PDF, a ZIP, a font or a recording, into Base64 text. Choose Data URL, which adds the data:<type>;base64, prefix for an src attribute or a CSS url(), or Raw Base64, the payload alone for JSON or an API request. When your browser gives the file no type, the tool reads it from the file's first bytes for common formats such as PNG, JPEG, HEIC, PDF, ZIP or MP4. It only encodes: there is no way back from Base64 to a file on this page. The file never leaves your device."}
        example={{
          caption: "A text file named hello.txt that contains the word hello and nothing else (browsers give a .txt file the type text/plain):",
          inputLabel: "File content",
          input: "hello",
          outputLabel: "Result",
          output: "Data URL:\ndata:text/plain;base64,aGVsbG8=\n\nRaw Base64:\naGVsbG8=\n\nDownloaded as hello.txt.base64.txt",
        }}
        howToTitle={"How to convert a file to Base64"}
        howTo={[
          "Click the dashed area to pick a file, or drop the file on it; on a phone, tap the area.",
          "Encoding starts as soon as the file is chosen, and the result shows in the form you picked last, \"Data URL\" for the first file.",
          "Switch to \"Raw Base64\" if you need the text without the data: prefix.",
          "\"Copy Base64\" puts the whole text on the clipboard; \"Download\" gives a file named after yours plus .base64.txt."
        ]}
        specs={[
          { label: "Input", value: "One file of any type at a time; an empty file is refused with a message" },
          { label: "Output", value: "Data URL or Raw Base64 text, copied or downloaded as a .txt file" },
          { label: "File size", value: "The tool sets no size cap; every three bytes of the file become four characters of text" },
          { label: "Large results", value: `The box previews the first ${PREVIEW_CHARS.toLocaleString('en-US')} characters, while Copy Base64 and Download give the whole text` }
        ]}
        privacy={"Your browser's FileReader turns the file into Base64 on your device: the file and its Base64 text are not sent to us, and nothing is kept once you leave the page. When an error is shown, such as an empty file or a file that cannot be read, we receive that message with file names removed, the tool's name and your browser's name and version."}
        faqs={[
          { q: "How much bigger is the Base64 than the file?", a: "About a third bigger, because every three bytes become four characters. Data URL also adds the data:<type>;base64, prefix. The counter above the result gives the exact number of characters for your file and the format you chose." },
          { q: "Why does my data URL say application/octet-stream?", a: "Neither your browser nor the tool recognized the file's type, so the generic type stays. When the browser gives no type, the tool checks the first bytes for common images, audio, video, PDF, Office, archive and font formats before falling back to it." },
          { q: "Can I turn Base64 back into a file here?", a: "No, this page only encodes. Base64 Encoder decodes Base64 into text and tells you when the bytes are binary rather than text, but it does not rebuild the original file for you to download." },
          { q: "Can I encode several files at once?", a: "No. The tool takes one file at a time, whether you pick it or drop it. Choosing another file replaces the previous result, so copy or download each result before moving on." }
        ]}
        tips={[
          "For a picture, Image to Base64 can also write an HTML img tag, a CSS background-image line or a JSON object.",
          "Choose \"Raw Base64\" before copying when an API field expects only the encoded bytes."
        ]}
      />
    </div>
  );
}