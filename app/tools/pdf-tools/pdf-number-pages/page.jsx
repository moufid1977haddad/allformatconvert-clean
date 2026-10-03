'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { pdfFileProblem } from '../../../lib/fileChecks';
import { placeOnVisiblePage, visibleSize } from '../../../lib/pdfPlace';
import { FileDownload } from '../../../components/FileDownload';
import { textAsPng, fontCanWrite } from '../../../lib/pdfTextImage';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// P24 (03/10), coverage against iLovePDF's "Add page numbers" (read 02/10: position, margin, facing pages, skip the
// cover, page range, first number, text templates "{n}", "Page {n}", "Page {n} of {p}", font size and colour).
// Before: one fixed "n / total" label from page 1, 12 pt, drawn in the MediaBox coordinates — sideways on a page
// displayed rotated (/Rotate) and possibly outside the visible area when the CropBox does not start at 0. Now every
// label is placed as the reader sees the page (lib/pdfPlace.js, as PDF Sign does).
const FORMATS = [
  ['{n} / {p}', '1 / 12'],
  ['{n}', '1'],
  ['Page {n}', 'Page 1'],
  ['Page {n} of {p}', 'Page 1 of 12'],
  ['custom', 'Custom text…'],
];
const MARGINS = { small: 18, recommended: 30, big: 54 };
const POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

export default function PdfNumberPagesPage() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [format, setFormat] = useState('{n} / {p}');
  const [custom, setCustom] = useState('Page {n} of {p}');
  const [firstNumber, setFirstNumber] = useState(1);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState('');
  const [skipCover, setSkipCover] = useState(false);
  const [margin, setMargin] = useState('recommended');
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#000000');
  const [facing, setFacing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useToolError('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setDownloadUrl(null); setStatus(''); setError('');
    if (!f) return;
    const problem = await pdfFileProblem(f);
    if (problem) { setFile(null); setError(problem); return; }
    setFile(f);
  };

  const addNumbers = async () => {
    if (!file) return;
    setLoading(true); setError(''); setStatus('Processing...'); setDownloadUrl(null);
    try {
      const template = format === 'custom' ? custom : format;
      if (!template.includes('{n}')) throw new Error('The text must contain {n}, where the page number goes (and {p} for the last number, if you want it).');
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(await file.arrayBuffer()), { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;
      const start = Math.max(skipCover ? 2 : 1, Math.round(Number(fromPage)) || 1);
      const end = toPage === '' ? total : Math.min(total, Math.round(Number(toPage)));
      if (!(end >= 1)) throw new Error('"To page" must be a page number (1 or more), or empty for the last page.');
      if (start > end) throw new Error(`There is no page to number between page ${start} and page ${end} (this PDF has ${total} page${total > 1 ? 's' : ''}).`);
      const first = Math.round(Number(firstNumber));
      if (!Number.isFinite(first)) throw new Error('The first number must be a whole number.');
      const last = first + (end - start);
      const size = Math.min(72, Math.max(6, Number(fontSize) || 12));
      const m = MARGINS[margin];
      const [r, g, b] = hexToRgb(color);
      for (let i = start - 1; i < end; i++) {
        const page = pages[i];
        const n = first + (i - (start - 1));
        const text = template.replaceAll('{n}', String(n)).replaceAll('{p}', String(last));
        // Helvetica writes WinAnsi (Latin-1, €, ’, –…); any other script is drawn by the browser as an image (review 03/10:
        // Cyrillic letters were dropped without a word)
        const asImage = !fontCanWrite(font, text) ? await textAsPng(text, size, color) : null;
        const box = page.getCropBox();
        const rotation = page.getRotation().angle;
        const { width, height } = visibleSize(box, rotation);
        const textWidth = asImage ? asImage.width : font.widthOfTextAtSize(text, size);
        let [v, h] = position.split('-'); // 'bottom-center' → v = 'bottom', h = 'center'
        // On facing pages (a printed book), left and right swap on the even page numbers
        if (facing && n % 2 === 0) h = h === 'left' ? 'right' : h === 'right' ? 'left' : h;
        const vx = h === 'left' ? m : h === 'right' ? width - textWidth - m : (width - textWidth) / 2;
        const vy = v === 'top' ? height - m - size : m;
        const at = placeOnVisiblePage(box, rotation, vx, vy);
        if (asImage) { const img = await pdfDoc.embedPng(asImage.bytes); const below = placeOnVisiblePage(box, rotation, vx, vy - asImage.baseline); page.drawImage(img, { x: below.x, y: below.y, width: asImage.width, height: asImage.height, rotate: degrees(below.rotate) }); }
        else page.drawText(text, { x: at.x, y: at.y, size, font, color: rgb(r, g, b), rotate: degrees(at.rotate) });
      }
      const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus(`Numbered pages ${start} to ${end} (${first} to ${last}).`);
    } catch (err) {
      setStatus(''); setError(err?.message || 'The page numbers could not be added.');
    }
    setLoading(false);
  };

  const input = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number PDF Pages</h1>
        <p className="text-neutral-500 text-center mb-8">Add page numbers to your PDF — format, first number, page range, position</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map(pos => (
                <button key={pos} type="button" onClick={() => setPosition(pos)} aria-pressed={position === pos} className={`py-2 rounded-lg text-sm font-semibold transition ${position === pos ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{pos}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Number format</span>
              <select id="pn-format" value={format} onChange={(e) => setFormat(e.target.value)} className={input}>
                {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            {format === 'custom' && <label className="block"><span className="block text-neutral-500 mb-1">Custom text ({'{n}'} = number, {'{p}'} = last number)</span>
              <input id="pn-custom" type="text" value={custom} onChange={(e) => setCustom(e.target.value)} className={input} /></label>}
            <label className="block"><span className="block text-neutral-500 mb-1">First number</span>
              <input id="pn-first" type="number" step="1" value={firstNumber} onChange={(e) => setFirstNumber(e.target.value)} className={input} /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">From page</span>
              <input id="pn-from" type="number" min="1" step="1" value={fromPage} onChange={(e) => setFromPage(e.target.value)} className={input} /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">To page (empty = last)</span>
              <input id="pn-to" type="number" min="1" step="1" value={toPage} onChange={(e) => setToPage(e.target.value)} className={input} /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Margin</span>
              <select id="pn-margin" value={margin} onChange={(e) => setMargin(e.target.value)} className={input}>
                <option value="small">Small</option><option value="recommended">Recommended</option><option value="big">Big</option>
              </select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Font size: {fontSize} pt</span>
              <input id="pn-size" type="range" min="6" max="36" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" /></label>
            <label className="flex items-center justify-between gap-2"><span className="text-neutral-500">Colour</span>
              <input id="pn-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input id="pn-skip" type="checkbox" checked={skipCover} onChange={(e) => setSkipCover(e.target.checked)} /> Skip the first page (cover)</label>
          <label className="flex items-center gap-2 text-sm"><input id="pn-facing" type="checkbox" checked={facing} onChange={(e) => setFacing(e.target.checked)} /> Facing pages (left and right swap on even numbers, as in a printed book)</label>
          <button onClick={addNumbers} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Add Page Numbers'}
          </button>
          {status && <p role="status" className="text-center text-neutral-600 text-sm">{status}</p>}
          {error && <p role="alert" className="text-center text-red-600 text-sm">{error}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.pdf$/i, '') + '-numbered.pdf'} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Number Pages"
        description="PDF Number Pages stamps page numbers onto your PDF entirely in your browser using the pdf-lib library — your file is never uploaded to a server. Choose the format (1, 1 / 12, Page 1, Page 1 of 12 or your own text with {n} and {p}), the first number, which pages get a number (from / to, or skip the cover), the position, the margin, the font size and colour, and facing pages for a printed book. Numbers are placed as you see the page, also on pages displayed rotated."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Choose a position (top or bottom, left, center or right) and a number format.",
          "Optionally set the first number, the pages to number (from / to), skip the first page, and the margin, size and colour.",
          "Click 'Add Page Numbers', then 'Download' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Number Pages free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which number formats are there?", a: "1, 1 / 12, Page 1, Page 1 of 12, or your own text: {n} is replaced by the page number and {p} by the last number used. Roman numerals are not offered." },
          { q: "Can I start numbering from a different number or skip a cover page?", a: "Yes. Tick 'Skip the first page (cover)', or set 'From page' and 'To page' to number only part of the document, and set 'First number' to start from any number." },
          { q: "What does 'Facing pages' do?", a: "In a printed book, numbers sit on the outer edge: with a left or right position, even numbers go to the other side." },
          { q: "Is my PDF uploaded to a server?", a: "No. Page numbers are added entirely in your browser using the pdf-lib library." }
        ]}
        tips={[
          "Bottom-center is the most common, professional-looking placement for page numbers.",
          "Numbers are drawn on top of existing page content: choose the 'Big' margin if they overlap a footer.",
          "With a cover page skipped, set 'First number' to 1 if the second page should be page 1."
        ]}
      />
    </div>
  );
}
