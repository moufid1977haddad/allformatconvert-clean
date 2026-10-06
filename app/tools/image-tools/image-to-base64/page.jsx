'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sniffFormat } from '../../../lib/detectFileFormat';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';
// P23 (02/10): a 2 MB photo gave 2.6 million characters pushed whole into the text box: WebKit (Safari's engine) froze
// the page 84 s (Chromium 2.9 s). Measured: 100 000 characters take 0.27 s in WebKit, 1 000 000 take 6.9 s
// (scripts/p23/textarea-cost.mjs). The box shows the first 100 000; Copy and Download give everything (base64.guru,
// measured the same day, pushes the whole text into its box).
const PREVIEW_CHARS = 100000;
export default function ImageToBase64Page() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useToolError('');
  // P24 (03/10): the forms base64.guru offers — data URI, plain Base64, an <img> tag, a CSS background, JSON
  const [fmt, setFmt] = useState('datauri');
  const b64 = result ? result.slice(result.indexOf(',') + 1) : '';
  const mime = result ? result.slice(5, result.indexOf(';')) : '';
  const out = !result ? '' : fmt === 'raw' ? b64 : fmt === 'img' ? '<img src="' + result + '" alt="">' : fmt === 'css' ? 'background-image: url("' + result + '");' : fmt === 'json' ? JSON.stringify({ name: fileName, mime, base64: b64 }) : result;
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
        <p className="text-neutral-500 text-center mb-8">Encode an image file as Base64 text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{fileName || <UploadPrompt what="an image" />}</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={encode} />
          </div>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><label className="flex items-center gap-2 text-sm text-neutral-600">Output<select id="b64-format" value={fmt} onChange={(e) => setFmt(e.target.value)} className="min-w-0 border border-neutral-200 rounded px-2 py-1 bg-white"><option value="datauri">Data URI (data:image/…;base64,…)</option><option value="raw">Plain Base64</option><option value="img">HTML &lt;img&gt; tag</option><option value="css">CSS background-image</option><option value="json">JSON</option></select></label><TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={out.length > PREVIEW_CHARS ? out.slice(0, PREVIEW_CHARS) : out} readOnly />{out.length > PREVIEW_CHARS && <p className="text-xs text-neutral-500">Preview of the first {PREVIEW_CHARS.toLocaleString('en-US')} of {out.length.toLocaleString('en-US')} characters, so the page stays responsive; Copy Base64 and Download give the whole text.</p>}<button onClick={() => navigator.clipboard.writeText(out)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy Base64</button><TextDownload text={out} name={(fileName || 'image').replace(/\.[^.]+$/, '') + '.base64.txt'} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image to Base64"
        description={`Image to Base64 reads an image file and writes its bytes as Base64 text, ready to paste into HTML, CSS, JavaScript or a JSON payload. Any image type can be chosen (JPG, PNG, GIF, WebP, AVIF, SVG, BMP, ICO, TIFF, HEIC), because the file is not opened or re-compressed: the bytes your browser receives are encoded as they are, so the text is about a third larger than the file. The "Output" menu switches between a data URI, plain Base64, an HTML img tag, a CSS background-image rule and JSON with the name and MIME type. Encoding starts as soon as you pick the file, in your browser.`}
        example={{ caption: 'A 1 × 1 red PNG named red-dot.png (69 bytes) and the JSON form this tool writes for it, produced by the same steps as the page (FileReader data URI, then the "JSON" choice).', inputLabel: 'red-dot.png (bytes, hex)', input: '89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52\n00 00 00 01 00 00 00 01 08 02 00 00 00 90 77 53\nde 00 00 00 0c 49 44 41 54 78 9c 63 f8 cf c0 00\n00 03 01 01 00 c9 fe 92 ef 00 00 00 00 49 45 4e\n44 ae 42 60 82', outputLabel: 'Output: JSON', output: '{"name":"red-dot.png","mime":"image/png","base64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC"}' }}
        howToTitle="How to convert an image to Base64"
        howTo={[
          `Pick an image in the upload area; the Base64 text appears at once, with no convert button.`,
          `Choose the form you need in the "Output" menu.`,
          `Click "Copy Base64" to copy the text in that form.`,
          `Or click "Download" to save the same text as a .base64.txt file.`
        ]}
        specs={[
          { label: 'Input', value: `Any image file: JPG, PNG, GIF, WebP, AVIF, SVG, BMP, ICO, TIFF, HEIC and others` },
          { label: 'Output forms', value: `Data URI, plain Base64, HTML img tag, CSS background-image, JSON; copy or .txt download` },
          { label: 'Text box', value: `Shows the first ${PREVIEW_CHARS.toLocaleString('en-US')} characters; copy and download give the full text` },
          { label: 'Files at once', value: `One` }
        ]}
        privacy={`The file is read with your browser's FileReader and encoded on this page; it is not uploaded, and the text exists only in this tab until you copy or save it. If the page shows an error, such as an empty file, that cleaned message is logged for us with the tool's name and your browser's name and version, without the file or its name.`}
        faqs={[
          { q: "Can I get the Base64 string without the data: prefix?", a: `Yes. Choose "Plain Base64" in the "Output" menu: the text then starts directly with the encoded bytes, which is what most APIs and JSON fields expect.` },
          { q: "Is the image compressed or resized before encoding?", a: `No. The bytes the page receives are encoded as they are. On an iPhone, a photo picked from the photo library can arrive already converted by iOS (HEIC becomes JPEG); pick it through the Files app to encode the original file.` },
          { q: "Can I encode HEIC or TIFF images?", a: `Yes, the file is encoded byte for byte whatever its type. But a data URI only shows as a picture in a browser that can open that format: on a computer, Chrome, Edge and Firefox do not display HEIC or TIFF.` },
          { q: "Is the whole image in the text box?", a: `No, not for large files. The box shows the first ${PREVIEW_CHARS.toLocaleString('en-US')} characters so that the page stays responsive; "Copy Base64" and "Download" always give the complete text.` }
        ]}
        tips={[
          `To get a shorter string, make the image smaller first with Image Compressor or Image Resizer, then encode the result.`
        ]}
      />
    </div>
  );
}