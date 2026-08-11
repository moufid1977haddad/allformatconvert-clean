'use client';
import { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import SeoContent from '../../../components/SeoContent';

export default function PdfRotatePage() {
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(90);
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
    setStatus('Rotating...');
    setDownloadUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      pages.forEach(page => page.setRotation(degrees(rotation)));
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
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
                <button key={deg} onClick={() => setRotation(deg)} className={`flex-1 py-2 rounded-lg font-semibold transition ${rotation === deg ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{deg}deg</button>
              ))}
            </div>
          </div>
          <button onClick={rotate} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Rotating...' : 'Rotate PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace(/\.pdf$/i, '-rotated.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Rotate"
        description="PDF Rotate rotates every page of a PDF by a fixed angle you choose — 90°, 180°, or 270° — using the pdf-lib library entirely in your browser. Your file is never uploaded to a server. The rotation applies to the whole document at once; there's no option to rotate individual pages differently."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Choose a rotation angle: 90°, 180°, or 270°.",
          "Click 'Rotate PDF' to apply it to every page.",
          "Click 'Download' to save the rotated file."
        ]}
        faqs={[
          { q: "Is PDF Rotate free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I rotate individual pages differently?", a: "No — the angle you choose is applied to every page in the document at once." },
          { q: "What rotation angles are available?", a: "90°, 180°, and 270° clockwise. There's no separate counter-clockwise option, but choosing 270° produces the same result as rotating 90° counter-clockwise." },
          { q: "Is my file uploaded to a server?", a: "No, rotation happens entirely in your browser using the pdf-lib library." }
        ]}
        tips={[
          "To rotate 90° counter-clockwise, choose 270° — it produces the same visual result.",
          "Since rotation applies to the whole document, split out any pages that need a different rotation beforehand with another tool.",
          "There's no preview, so download and check a page or two before using the result for something important.",
          "Rotation changes the page's orientation setting rather than redrawing content, so text and images stay sharp at any angle."
        ]}
      />
    </div>
  );
}