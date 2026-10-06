'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { cropRect } from '../../../lib/pdfCropBox';
import { FileDownload } from '../../../components/FileDownload';
import { parsePageRange } from '../../../lib/pageRange';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function Page() {
  const [file, setFile] = useState(null);
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [range, setRange] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); setError(''); };

  const crop = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer));
      const m = {};
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const v = Number(margins[side]);
        if (!Number.isFinite(v) || v < 0) throw new Error(`the ${side} margin must be a number of points, 0 or more.`);
        m[side] = v;
      }
      const pages = pdfDoc.getPages();
      // P24: on the chosen pages (iLovePDF / Smallpdf: current page or all)
      const chosen = new Set(parsePageRange(range, pages.length));
      pages.forEach((page, n) => {
        if (!chosen.has(n + 1)) return;
        const box = page.getCropBox();
        const next = cropRect(box, page.getRotation().angle, m);
        if (!next) throw new Error(`these margins are larger than page ${n + 1} (${Math.round(box.width)} x ${Math.round(box.height)} pt): nothing would be left of it.`);
        page.setCropBox(next.x, next.y, next.width, next.height);
      });
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
        <p className="text-neutral-500 text-center mb-8">Trim the margins of PDF pages</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a PDF file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-4">
            {['top', 'bottom', 'left', 'right'].map(side => (
              <div key={side}>
                <label className="block text-sm text-neutral-500 mb-1 capitalize">{side} margin (pt)</label>
                <input aria-label="margin (pt)" type="number" min={0} value={margins[side]} onChange={e => { setMargins({...margins, [side]: e.target.value}); setResult(null); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            ))}
          </div>
          <label className="block text-sm"><span className="block text-neutral-500 mb-1">Pages (empty = all; e.g. 1-3, 5)</span>
            <input id="crop-pages" type="text" value={range} onChange={e => { setRange(e.target.value); setResult(null); }} placeholder="all pages" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm" /></label>
          <button onClick={crop} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Cropping...' : 'Crop PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <FileDownload href={result} name="cropped.pdf" />}
        </div>
      </div>
      <SeoContent
        title="PDF Crop"
        description={`PDF Crop cuts the margins of PDF pages by the amounts you type in points (one point is 1/72 inch). It changes each page's crop box, the visible area, so the trimmed part is hidden rather than deleted from the file. Margins are measured on the page as it is displayed, also when the page is rotated or was cropped before, so a second crop cuts further. You can crop every page or only the pages you list. There is no preview and no drag selection. pdf-lib rewrites the crop boxes inside your browser tab.`}
        howToTitle="How to crop the margins of a PDF"
        howTo={[
          `Choose the PDF to crop.`,
          `Type the top, bottom, left and right margins to remove, in points.`,
          `Leave "Pages" empty to crop every page, or list pages such as 1-3, 5.`,
          `Click "Crop PDF", then "Download" to save cropped.pdf.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF` },
          { label: 'Margins', value: `In points, zero or more, one set of four per run` },
          { label: 'Pages', value: `All pages, or a list such as 1-3, 5, 8-` },
          { label: 'Result', value: `cropped.pdf; the hidden area stays in the file` },
        ]}
        privacy={`The PDF is opened and cropped in your browser with pdf-lib; it is not uploaded to our servers. A PDF that opens without a password but carries restrictions is decrypted in the browser first, while one that needs a password to open is refused with a pointer to PDF Unlock.`}
        faqs={[
          { q: "Does cropping delete the content outside the new edges?", a: `No. Only the crop box changes, so viewers and printers show the smaller area, but the trimmed content is still in the file and comes back if the crop box is reset. To remove sensitive text for good, use PDF Redact instead.` },
          { q: "Can I crop each page differently?", a: `Yes, in several runs. List the pages in Pages and crop them with one set of margins, then open the downloaded file again for the next pages and other margins. Every run starts from the page's current visible area.` },
          { q: "Is the top the edge I see on a rotated page?", a: `Yes. For a page stored sideways and displayed rotated, the tool converts your four margins to the page's own sides, so the top you type is the top you see on screen, and the result matches what a viewer shows.` },
          { q: "Can the margins be larger than the page?", a: `No. Nothing is saved when the margins would leave no area on a page: the tool names that page and its width and height in points, so you can type smaller values and try again.` },
        ]}
        tips={[
          `One inch is 72 points and one centimeter is about 28 points: convert a ruler measurement before typing it.`,
        ]}
      />
    </div>
  );
}