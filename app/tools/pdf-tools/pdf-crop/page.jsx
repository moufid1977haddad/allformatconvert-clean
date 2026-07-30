'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function Page() {
  const [file, setFile] = useState(null);
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const crop = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.setCropBox(
          margins.left,
          margins.bottom,
          width - margins.left - margins.right,
          height - margins.top - margins.bottom
        );
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Crop failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Crop PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Crop and resize PDF pages</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-4">
            {['top', 'bottom', 'left', 'right'].map(side => (
              <div key={side}>
                <label className="block text-sm text-neutral-500 mb-1 capitalize">{side} margin (pt)</label>
                <input type="number" min={0} max={200} value={margins[side]} onChange={e => setMargins({...margins, [side]: Number(e.target.value)})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            ))}
          </div>
          <button onClick={crop} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Cropping...' : 'Crop PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="cropped.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Cropped PDF</a>}
        </div>
      </div>
      <SeoContent
        title="PDF Crop"
        description="PDF Crop trims each page's crop box by the top, bottom, left, and right margins you enter, using the pdf-lib library entirely in your browser — your file is never uploaded to a server. The same margins are applied to every page; there's no interactive drag-to-select tool or visual preview."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Enter the top, bottom, left, and right margins (in points, 0–200) to trim from each page.",
          "Click 'Crop PDF' to apply those margins to every page.",
          "Click 'Download Cropped PDF' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Crop free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I preview or drag to select the crop area?", a: "No — there's no visual crop preview or draggable handles. You enter numeric margins in points for each side." },
          { q: "Can I crop each page differently?", a: "No, the same margin values are applied to every page in the document." },
          { q: "Is my file uploaded to a server?", a: "No. Cropping happens entirely in your browser using the pdf-lib library." }
        ]}
        tips={[
          "Margins are in points (1 point = 1/72 inch), and each side is limited to 200pt in the input fields.",
          "Cropping only adjusts the page's visible crop box — content outside it isn't deleted from the file, just hidden from view.",
          "Since there's no preview, try small margin values first and check the downloaded result before committing to larger crops.",
          "Use the same margins across a batch of similarly formatted documents for consistent results."
        ]}
      />
    </div>
  );
}