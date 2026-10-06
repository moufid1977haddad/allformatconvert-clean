'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { carryOver, carryOutline } from '../../../lib/pdfCarryOver';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function Page() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setError('');
    setNumPages(0);
    setOrder([]);
    try {
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const n = pdf.numPages;
      setNumPages(n);
      setOrder(Array.from({ length: n }, (_, i) => ({ n: i + 1, rot: 0 })));
    } catch (err) {
      setError('Failed to read PDF: ' + err.message);
      setNumPages(0);
      setOrder([]);
    }
  };

  const moveUp = (i) => {
    if (i === 0) return;
    const newOrder = [...order];
    [newOrder[i-1], newOrder[i]] = [newOrder[i], newOrder[i-1]];
    setOrder(newOrder);
  };

  const moveDown = (i) => {
    if (i === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[i], newOrder[i+1]] = [newOrder[i+1], newOrder[i]];
    setOrder(newOrder);
  };

  const removePage = (i) => setOrder(order.filter((_, idx) => idx !== i));
  // P24 (03/10): as iLovePDF's and Smallpdf's organizers (read 02/10) — rotate a page, duplicate it, add a blank page.
  const rotatePage = (i) => setOrder(order.map((p, idx) => (idx === i ? { ...p, rot: (p.rot + 90) % 360 } : p)));
  const duplicatePage = (i) => setOrder([...order.slice(0, i + 1), { ...order[i] }, ...order.slice(i + 1)]);
  const addBlank = (i) => setOrder([...order.slice(0, i + 1), { n: 0, rot: 0 }, ...order.slice(i + 1)]);

  const reorganize = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const lib = await import('pdf-lib');
      const { PDFDocument, degrees } = lib;
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer));
      const newDoc = await PDFDocument.create();
      if (!order.some((p) => p.n)) throw new Error('Keep at least one page of the PDF.');
      // One copyPages call: resources and form fields shared by several pages are copied once.
      const real = order.filter((p) => p.n);
      const copied = await newDoc.copyPages(srcDoc, real.map((p) => p.n - 1));
      let k = 0, last = null;
      for (const p of order) {
        if (p.n) {
          const page = newDoc.addPage(copied[k++]);
          if (p.rot) page.setRotation(degrees((page.getRotation().angle + p.rot) % 360));
          last = page;
        } else {
          // a blank page the size of the page before it (as displayed), else A4
          const { width, height } = last ? last.getCropBox() : { width: 595.28, height: 841.89 };
          const blank = newDoc.addPage([width, height]);
          if (last && last.getRotation().angle) blank.setRotation(last.getRotation());
          if (p.rot) blank.setRotation(degrees((blank.getRotation().angle + p.rot) % 360));
        }
      }
      // Form fields and document information kept (29/09), see lib/pdfCarryOver.js.
      carryOver(lib, srcDoc, newDoc);
      // Bookmarks follow their pages (30/09); those of removed pages are dropped; a blank page has none.
      carryOutline(lib, srcDoc, newDoc, order.map((p) => p.n));
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Organize PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Reorder, rotate, duplicate and remove PDF pages, add blank pages</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name} ({numPages} pages)</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a PDF file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          {order.length > 0 && (
            <div className="space-y-2">
              {order.map((p, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-neutral-700 flex-1">{p.n ? `Page ${p.n}` : 'Blank page'}{p.rot ? ` (turned ${p.rot}°)` : ''}</span>
                  <button onClick={() => moveUp(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Up</button>
                  <button onClick={() => moveDown(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Down</button>
                  <button onClick={() => rotatePage(i)} aria-label={`Rotate position ${i + 1} by 90 degrees`} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Rotate</button>
                  <button onClick={() => duplicatePage(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Duplicate</button>
                  <button onClick={() => addBlank(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Blank after</button>
                  <button onClick={() => removePage(i)} className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={reorganize} disabled={!file || loading || order.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Apply Changes'}
          </button>
          {error && <p role="alert" className="text-red-400 text-center text-sm">{error}</p>}
          {result && <FileDownload href={result} name="organized.pdf" />}
        </div>
      </div>
      <SeoContent
        title="PDF Organize"
        description={`PDF Organize lists the pages of one PDF by number and lets you rework it page by page: Up and Down move a page, Rotate turns it 90° clockwise, Duplicate adds a copy right after it, Blank after inserts an empty page of the same size, and Remove drops it. Nothing changes until you apply the changes. Form fields, the title and author, and bookmarks follow the pages you keep. The list shows page numbers, not thumbnails, and it works on a single file; to join files, use Merge PDF. pdf-lib rebuilds the list you arranged into a new file inside your browser.`}
        howToTitle="How to organize the pages of a PDF"
        howTo={[
          `Choose the PDF; each page appears as a row, from Page 1 to the last.`,
          `Use "Up", "Down", "Rotate", "Duplicate", "Blank after" or "Remove" on any row.`,
          `Click "Apply Changes" to build the PDF.`,
          `Get organized.pdf, in the new order, with the "Download" button.`,
        ]}
        specs={[
          { label: 'Input', value: `One PDF` },
          { label: 'Per page', value: `Up, Down, Rotate (90° clockwise), Duplicate, Blank after, Remove` },
          { label: 'Blank pages', value: `Same size as the page before them, or A4 at the very start` },
          { label: 'Kept', value: `Form fields, title and author, bookmarks of kept pages` },
          { label: 'Result', value: `organized.pdf` },
        ]}
        privacy={`PDF.js counts the pages and pdf-lib builds the reorganized file, both inside your browser; the PDF is not sent to our servers. A file that asks for a password to open cannot be read here and has to be unlocked first.`}
        faqs={[
          { q: "Can I drag thumbnails to reorder pages?", a: `No. Pages are listed as Page 1, Page 2 and so on, and you move them with Up and Down. To see thumbnails while you reorder, rotate or delete pages, use the PDF Editor, which shows each page with arrow buttons.` },
          { q: "Are the bookmarks of removed pages kept?", a: `No. A bookmark that points to a removed page is dropped, and the bookmarks under it move up one level. The others follow their pages to the new positions, and form fields on the pages you keep still work with their values.` },
          { q: "Is a blank page the size of the page next to it?", a: `Yes. A blank page takes the visible size and rotation of the real page before it in the list. If you put it before every real page, it is an A4 page, 595 by 842 points.` },
          { q: "Can I combine two PDFs here?", a: `No. This page changes one file only. Merge PDF joins several files; you can then open the merged PDF here to fine-tune its page order, rotate pages or add blank ones.` },
        ]}
        tips={[]}
      />
    </div>
  );
}