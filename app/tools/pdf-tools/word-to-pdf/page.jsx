'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

const twipsToIn = (twips) => parseInt(twips, 10) / 1440;
const eighthPtToPx = (sz) => (parseInt(sz, 10) / 8) * (96 / 72);
const BORDER_STYLE_MAP = { single: 'solid', dashed: 'dashed', dotted: 'dotted', double: 'double', thick: 'solid', none: 'none', nil: 'none' };

const PAGE_INFO_DEFAULTS = { widthIn: 8.5, heightIn: 11, marginTopIn: 1, marginRightIn: 1, marginBottomIn: 1, marginLeftIn: 1, borderDecl: '' };

// Mammoth never reads a docx's section properties (page size/margins/page
// border) — its object model only covers paragraph and run content. Since a
// .docx is just a zip of XML parts, read word/document.xml directly with
// JSZip + DOMParser and pull w:pgSz / w:pgMar / w:pgBorders out of the last
// <w:sectPr> ourselves. Returns raw numbers/declarations (rather than a CSS
// string) so both the print-preview flow and the direct-PDF-download flow
// can build their own layout from the same extracted data.
async function extractPageInfo(arrayBuffer) {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) return PAGE_INFO_DEFAULTS;
    const xmlText = await docXmlFile.async('text');
    const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xmlDoc.querySelector('parsererror')) return PAGE_INFO_DEFAULTS;
    const sectPrList = xmlDoc.getElementsByTagName('w:sectPr');
    if (!sectPrList.length) return PAGE_INFO_DEFAULTS;
    const sectPr = sectPrList[sectPrList.length - 1];

    let widthIn = 8.5, heightIn = 11;
    const pgSz = sectPr.getElementsByTagName('w:pgSz')[0];
    if (pgSz) {
      const w = pgSz.getAttribute('w:w');
      const h = pgSz.getAttribute('w:h');
      if (w) widthIn = twipsToIn(w);
      if (h) heightIn = twipsToIn(h);
    }

    let marginTopIn = 1, marginRightIn = 1, marginBottomIn = 1, marginLeftIn = 1;
    const pgMar = sectPr.getElementsByTagName('w:pgMar')[0];
    if (pgMar) {
      const top = pgMar.getAttribute('w:top');
      const right = pgMar.getAttribute('w:right');
      const bottom = pgMar.getAttribute('w:bottom');
      const left = pgMar.getAttribute('w:left');
      if (top) marginTopIn = twipsToIn(top);
      if (right) marginRightIn = twipsToIn(right);
      if (bottom) marginBottomIn = twipsToIn(bottom);
      if (left) marginLeftIn = twipsToIn(left);
    }

    let borderDecl = '';
    const pgBorders = sectPr.getElementsByTagName('w:pgBorders')[0];
    if (pgBorders) {
      borderDecl = ['top', 'right', 'bottom', 'left'].map((side) => {
        const el = pgBorders.getElementsByTagName('w:' + side)[0];
        if (!el) return '';
        const val = (el.getAttribute('w:val') || 'single').toLowerCase();
        const cssStyle = BORDER_STYLE_MAP[val] || 'solid';
        if (cssStyle === 'none') return '';
        const sz = el.getAttribute('w:sz') || '4';
        const widthPx = Math.max(1, eighthPtToPx(sz)).toFixed(2);
        const rawColor = (el.getAttribute('w:color') || '').toLowerCase();
        const cssColor = !rawColor || rawColor === 'auto' ? '#000000' : '#' + rawColor;
        return `border-${side}:${widthPx}px ${cssStyle} ${cssColor};`;
      }).join('');
    }

    return { widthIn, heightIn, marginTopIn, marginRightIn, marginBottomIn, marginLeftIn, borderDecl };
  } catch (e) {
    // Non-fatal: if the page geometry can't be read for any reason, callers
    // fall back to sane defaults and the conversion still proceeds.
    return PAGE_INFO_DEFAULTS;
  }
}

// This intentionally approximates the border's position at the page's margin
// box rather than exactly `space` points from the physical paper edge (which
// offsetFrom="page" borders technically call for) — true per-edge offset
// would need custom print-margin math that most browsers' print engines
// don't handle consistently, so this trades a small positioning
// approximation for a simple, reliable result.
function buildPrintPageCss(info) {
  let css = `@page{size:${info.widthIn.toFixed(2)}in ${info.heightIn.toFixed(2)}in;margin:${info.marginTopIn.toFixed(2)}in ${info.marginRightIn.toFixed(2)}in ${info.marginBottomIn.toFixed(2)}in ${info.marginLeftIn.toFixed(2)}in;}`;
  if (info.borderDecl) css += `body{${info.borderDecl}padding:24px;}`;
  return css;
}

export default function WordToPdfPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState('document.pdf');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDone(false);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    // Open the popup FIRST, synchronously within the click handler, before any
    // async work (mammoth conversion, reading the docx as a zip for page CSS).
    // Browsers only allow window.open() while user activation is still fresh;
    // opening it only after awaiting async steps risks the popup blocker
    // silently returning null once that activation has lapsed.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setStatus('Error: Your browser blocked the popup. Please allow pop-ups for this site and try again.');
      setLoading(false);
      return;
    }
    try {
      const mammoth = (await import('mammoth/mammoth.browser')).default;
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      // Mammoth intentionally converts only semantic paragraph/run content — it
      // never reads the section/page-level properties (page size, margins, page
      // border) at all, so those are silently dropped no matter what. Pull just
      // that page geometry directly out of the raw docx XML (a docx is a zip of
      // XML parts) and turn it into CSS ourselves, independent of mammoth.
      const pageInfo = await extractPageInfo(arrayBuffer);
      const pageCss = buildPrintPageCss(pageInfo);
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title><style>html,body{margin:0;}body{font-family:Arial,sans-serif;line-height:1.6;color:#000;box-sizing:border-box;}h1,h2,h3{color:#000;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}' + pageCss + '</style></head><body>' + html + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setStatus('');
        setDone(true);
        setLoading(false);
      }, 500);
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
      printWindow.close();
    }
  };

  // Independent of the print-preview flow above: renders the same
  // mammoth HTML + extracted page geometry into an off-screen container and
  // rasterizes it into an actual PDF file client-side with html2pdf.js
  // (html2canvas + jsPDF), producing a real downloadable Blob rather than
  // relying on the user manually choosing "Save as PDF" in a print dialog.
  const downloadPdf = async () => {
    if (!file) return;
    setDownloading(true);
    setStatus('Generating PDF...');
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
    let offscreenWrapper = null;
    try {
      const mammoth = (await import('mammoth/mammoth.browser')).default;
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      const pageInfo = await extractPageInfo(arrayBuffer);

      // html2pdf.js's own toContainer() step deep-clones the element passed to
      // .from() into ITS OWN wrapper (which sizes itself via height:auto). If
      // that source element carries its own position:fixed/absolute + a large
      // left offset (as this container needs, to stay off-screen while it's
      // briefly attached to the live document), the clone inherits that same
      // out-of-flow positioning once nested inside html2pdf's wrapper too —
      // so it no longer contributes to the wrapper's auto height, the wrapper
      // collapses to 0px, and html2canvas rasterizes a blank page. Keeping the
      // off-screen positioning on a separate outer wrapper — and passing the
      // normally-flowed (position:static) inner container to .from() — avoids
      // that collapse while still hiding the staging area from the user.
      offscreenWrapper = document.createElement('div');
      offscreenWrapper.style.cssText = 'position:fixed;left:-99999px;top:0;';
      const container = document.createElement('div');
      container.style.cssText = 'background:#fff;box-sizing:border-box;font-family:Arial,sans-serif;line-height:1.6;color:#000;'
        + `width:${pageInfo.widthIn}in;`
        + `padding:${pageInfo.marginTopIn}in ${pageInfo.marginRightIn}in ${pageInfo.marginBottomIn}in ${pageInfo.marginLeftIn}in;`
        + pageInfo.borderDecl;
      container.innerHTML = '<style>h1,h2,h3{color:#000;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;}</style>' + html;
      offscreenWrapper.appendChild(container);
      document.body.appendChild(offscreenWrapper);

      const filename = (file.name.replace(/\.docx$/i, '') || 'document') + '.pdf';
      const opt = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: [pageInfo.widthIn, pageInfo.heightIn], orientation: pageInfo.widthIn > pageInfo.heightIn ? 'landscape' : 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };
      const blob = await html2pdf().set(opt).from(container).outputPdf('blob');
      setPdfUrl(URL.createObjectURL(blob));
      setPdfName(filename);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    } finally {
      if (offscreenWrapper && offscreenWrapper.parentNode) offscreenWrapper.parentNode.removeChild(offscreenWrapper);
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Word to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .docx files to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a .docx file here'}</p>
            <input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={downloadPdf} disabled={!file || downloading} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
              {loading ? 'Opening preview...' : 'Preview & Print'}
            </button>
          </div>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {pdfUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">PDF ready!</div>
              <a href={pdfUrl} download={pdfName} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download {pdfName}</a>
            </div>
          )}
          {done && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">Preview opened</div>
              <p className="text-neutral-500 text-sm">Use Save as PDF in the print dialog.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Word to PDF"
        description="Word to PDF reads your .docx file using the Mammoth.js library, entirely on your device — your file is never uploaded to a server. 'Download PDF' rasterizes the result into a real, downloadable .pdf file directly (via html2canvas + jsPDF), while 'Preview & Print' opens a browser tab and print dialog instead, letting you fine-tune print settings before choosing 'Save as PDF' yourself. Page size, page margins, and a page border (if your document has one) are read directly from the .docx and applied in both paths, even though Mammoth itself doesn't support them."
        howTo={[
          "Click the upload area and select a .docx file from your device.",
          "Click 'Download PDF' to generate and download a real .pdf file directly — no extra steps needed.",
          "Alternatively, click 'Preview & Print' to open a rendered preview and your browser's print dialog, where you choose 'Save as PDF' yourself. (Allow pop-ups for this site if your browser blocks the new tab.)",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Word to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does Word to PDF support?", a: "Only .docx files. The older binary .doc format isn't supported — save your document as .docx first if needed." },
          { q: "Will my documents be uploaded to a server?", a: "No. Both the 'Download PDF' and 'Preview & Print' paths run entirely in your browser — using Mammoth.js plus html2canvas/jsPDF for the direct download — your file is never uploaded anywhere." },
          { q: "Do I need to install any software to use Word to PDF?", a: "No, it works directly in your web browser." },
          { q: "What's the difference between 'Download PDF' and 'Preview & Print'?", a: "'Download PDF' renders the document to an image-based PDF and downloads it in one click, with no dialogs. 'Preview & Print' opens a browser tab and the native print dialog instead, so you can adjust print settings (or pick a different destination) before saving — but text in that PDF stays selectable, whereas 'Download PDF' produces an image-based (non-selectable) PDF." },
          { q: "Will my page border and page size carry over?", a: "Page size, margins, and a page border (color, style, and thickness) are read directly from your .docx's page setup and applied in both the direct download and the print preview — Mammoth itself ignores these entirely, so this tool extracts them separately. The border is positioned at the page's margin, which may sit slightly closer to the text than an 'offset from page edge' border does in Word." },
          { q: "Why doesn't my layout look exactly like it does in Word?", a: "Mammoth.js converts your document semantically (e.g. a 'Heading 1' paragraph becomes an h1) rather than visually. It deliberately does not preserve exact fonts, font sizes, text color, paragraph spacing, line spacing, or indentation unless that formatting comes from a named heading style — this is a deliberate design choice of the library, not a bug, and there's currently no setting to change it. For pixel-accurate layout fidelity, you'll get better results printing directly from Word or Google Docs." }
        ]}
        tips={[
          "Basic formatting like headings, bold, italics, and tables carries over; very complex layouts or unusual styles may render differently than in Word.",
          "Use 'Download PDF' for a one-click file; use 'Preview & Print' if you want to double-check the layout or adjust print settings before saving.",
          "Page size, margins, and any page border are preserved, but manual formatting (specific fonts, font sizes, colors, paragraph spacing) generally isn't — apply formatting through named styles (like 'Heading 1') where possible for the most reliable conversion.",
          "If your file is a legacy .doc, open it in Word and save a copy as .docx before uploading."
        ]}
      />
    </div>
  );
}