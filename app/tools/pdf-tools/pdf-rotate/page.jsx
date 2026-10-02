'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { FileDownload } from '../../../components/FileDownload';
import { parsePageRange } from '../../../lib/pageRange';

export default function PdfRotatePage() {
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(90);
  const [range, setRange] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDownloadUrl(null);
  };

  const rotate = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Rotating...'); setError('');
    setDownloadUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { PDFDocument, degrees } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer), { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      // P24: the angle is ADDED to each page's own rotation (it replaced it: a page already turned 90° "rotated 90°" did
      // not move), on the chosen pages only (iLovePDF / Smallpdf: per page or all)
      const chosen = parsePageRange(range, pages.length);
      for (const n of chosen) { const page = pages[n - 1]; page.setRotation(degrees((page.getRotation().angle + rotation) % 360)); }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      setStatus(''); setError(err?.message || 'The PDF could not be rotated.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Rotate PDF Pages</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate all pages of a PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Rotation angle</label>
            <div className="flex gap-3">
              {[90, 180, 270].map(deg => (
                <button key={deg} type="button" aria-pressed={rotation === deg} onClick={() => setRotation(deg)} className={`flex-1 py-2 rounded-lg font-semibold transition ${rotation === deg ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{deg === 90 ? '90° clockwise' : deg === 180 ? '180°' : '90° counter-clockwise'}</button>
              ))}
            </div>
          </div>
          <label className="block text-sm"><span className="block text-neutral-500 mb-1">Pages (empty = all; e.g. 1-3, 5, 8-)</span>
            <input id="rot-pages" type="text" value={range} onChange={e => setRange(e.target.value)} placeholder="all pages" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2" /></label>
          <button onClick={rotate} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Rotating...' : 'Rotate PDF'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {error && <p role="alert" className="text-center text-red-600 text-sm">{error}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.pdf$/i, '-rotated.pdf')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Rotate"
        description="PDF Rotate rotates the pages you choose (or all of them) by 90° clockwise, 180° or 90° counter-clockwise, using the pdf-lib library entirely in your browser. Your file is never uploaded to a server. The angle is added to each page's current orientation, so a page that was already turned keeps turning the way you asked."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Choose a rotation: 90° clockwise, 180° or 90° counter-clockwise.",
          "Leave 'Pages' empty to rotate every page, or type pages like 1-3, 5.",
          "Click 'Rotate PDF'.",
          "Click 'Download' to save the rotated file."
        ]}
        faqs={[
          { q: "Is PDF Rotate free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I rotate only some pages?", a: "Yes — type them in 'Pages' (for example 2, 5-7). Run the tool again on the result to turn other pages another way." },
          { q: "What rotation angles are available?", a: "90° clockwise, 180° and 90° counter-clockwise, added to each page's current orientation." },
          { q: "Is my file uploaded to a server?", a: "No, rotation happens entirely in your browser using the pdf-lib library." }
        ]}
        tips={[
          "There's no preview, so download and check a page or two before using the result for something important.",
          "Rotation changes the page's orientation setting rather than redrawing content, so text and images stay sharp at any angle."
        ]}
      />
    </div>
  );
}