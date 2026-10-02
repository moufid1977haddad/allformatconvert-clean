'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { carryOver, carryOutline } from '../../../lib/pdfCarryOver';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';

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
            {file ? <p className="text-neutral-700 font-medium">{file.name} ({numPages} pages)</p> : <p className="text-neutral-500 text-sm">Click to upload a PDF file</p>}
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
        description="PDF Organize lets you reorder, rotate, duplicate and remove pages within a single PDF, and insert blank pages, using Up, Down, Rotate, Duplicate, Blank after and Remove buttons next to a list of pages, entirely in your browser using the pdf-lib and PDF.js libraries — your file is never uploaded to a server. It only reorders and removes pages within one file; it does not merge, split, compress, or rotate PDFs. Form fields on the pages you keep still work, with their values, and the document title and author are kept; removed pages are truly removed from the file, not just hidden."
        howTo={[
          "Click the upload area and select a PDF file — its pages appear in a numbered list.",
          "Use 'Up' and 'Down' next to each page to change its position, 'Rotate' to turn it 90°, 'Duplicate' to copy it, 'Blank after' to insert an empty page, or 'Remove' to drop it.",
          "Click 'Apply Changes' to build the reordered PDF.",
          "Click 'Download' next to organized.pdf to save the result."
        ]}
        faqs={[
          { q: "Is PDF Organize free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I merge multiple PDFs or split one into several files?", a: "No — this tool only reorders and removes pages inside a single PDF. Use the Merge PDF or Split PDF tools for those tasks." },
          { q: "Can I rotate or compress pages here?", a: "Rotate: yes, each click on 'Rotate' turns that page 90° clockwise. Compression: use the Compress PDF tool." },
          { q: "Can I add a blank page or repeat a page?", a: "Yes — 'Blank after' inserts an empty page the size of that page, and 'Duplicate' adds a copy of the page right after it." },
          { q: "Are form fields and bookmarks kept?", a: "Form fields on the kept pages are kept and still fillable. Bookmarks (the outline) are kept too and follow their pages to their new positions; a bookmark pointing to a page you removed is dropped, and the bookmarks under it move up a level." },
          { q: "Is my file uploaded to a server?", a: "No. Everything happens locally in your browser using the pdf-lib and PDF.js libraries." }
        ]}
        tips={[
          "Pages are listed by their original page number, so you can track which page you're moving even after reordering.",
          "Use 'Remove' to drop pages you don't want — removed pages aren't included in the downloaded file.",
          "Changes only take effect after clicking 'Apply Changes'; reordering the list alone doesn't modify the file.",
          "For combining multiple files or splitting one PDF into parts, use the Merge PDF or Split PDF tools instead."
        ]}
      />
    </div>
  );
}