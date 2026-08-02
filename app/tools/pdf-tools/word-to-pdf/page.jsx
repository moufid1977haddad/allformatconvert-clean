'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

const twipsToIn = (twips) => parseInt(twips, 10) / 1440;
const eighthPtToPx = (sz) => (parseInt(sz, 10) / 8) * (96 / 72);
const BORDER_STYLE_MAP = { single: 'solid', dashed: 'dashed', dotted: 'dotted', double: 'double', thick: 'solid', none: 'none', nil: 'none' };

// Mammoth never reads a docx's section properties (page size/margins/page
// border) — its object model only covers paragraph and run content. Since a
// .docx is just a zip of XML parts, read word/document.xml directly with
// JSZip + DOMParser and pull w:pgSz / w:pgMar / w:pgBorders out of the last
// <w:sectPr> ourselves, translating them to plain CSS. This intentionally
// approximates the border's position at the page's margin box rather than
// exactly `space` points from the physical paper edge (which offsetFrom="page"
// borders technically call for) — true per-edge offset would need custom
// print-margin math that most browsers' print engines don't handle
// consistently, so this trades a small positioning approximation for a
// simple, reliable result.
async function extractPageCss(arrayBuffer) {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) return '';
    const xmlText = await docXmlFile.async('text');
    const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xmlDoc.querySelector('parsererror')) return '';
    const sectPrList = xmlDoc.getElementsByTagName('w:sectPr');
    if (!sectPrList.length) return '';
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

    let borderCss = '';
    const pgBorders = sectPr.getElementsByTagName('w:pgBorders')[0];
    if (pgBorders) {
      const decls = ['top', 'right', 'bottom', 'left'].map((side) => {
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
      if (decls) borderCss = `body{${decls}padding:24px;}`;
    }

    return `@page{size:${widthIn.toFixed(2)}in ${heightIn.toFixed(2)}in;margin:${marginTopIn.toFixed(2)}in ${marginRightIn.toFixed(2)}in ${marginBottomIn.toFixed(2)}in ${marginLeftIn.toFixed(2)}in;}` + borderCss;
  } catch (e) {
    // Non-fatal: if the page geometry can't be read for any reason, the
    // conversion still proceeds with mammoth's content and default styling.
    return '';
  }
}

export default function WordToPdfPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDone(false);
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
      const pageCss = await extractPageCss(arrayBuffer);
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
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {done && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">Done!</div>
              <p className="text-neutral-500 text-sm">Use Save as PDF in the print dialog.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Word to PDF"
        description="Word to PDF reads your .docx file using the Mammoth.js library and renders it as HTML in a new browser tab, entirely on your device — your file is never uploaded to a server. It doesn't generate a PDF file directly: instead, it opens your browser's print dialog, where you choose 'Save as PDF' to produce the actual file. Page size, page margins, and a page border (if your document has one) are read directly from the .docx and applied to the printed page, even though Mammoth itself doesn't support them."
        howTo={[
          "Click the upload area and select a .docx file from your device.",
          "Click 'Convert to PDF' — a new tab renders your document and the browser's print dialog appears. (Allow pop-ups for this site if your browser blocks the new tab.)",
          "In the print dialog, choose 'Save as PDF' (or your OS equivalent) as the destination.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Word to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does Word to PDF support?", a: "Only .docx files. The older binary .doc format isn't supported — save your document as .docx first if needed." },
          { q: "Will my documents be uploaded to a server?", a: "No. Your file is read and rendered entirely in your browser using the Mammoth.js library — it's never uploaded anywhere." },
          { q: "Do I need to install any software to use Word to PDF?", a: "No, it works directly in your web browser." },
          { q: "Will my page border and page size carry over?", a: "Page size, margins, and a page border (color, style, and thickness) are read directly from your .docx's page setup and applied to the printed page — Mammoth itself ignores these entirely, so this tool extracts them separately. The border is positioned at the page's margin, which may sit slightly closer to the text than an 'offset from page edge' border does in Word." },
          { q: "Why doesn't my layout look exactly like it does in Word?", a: "Mammoth.js converts your document semantically (e.g. a 'Heading 1' paragraph becomes an h1) rather than visually. It deliberately does not preserve exact fonts, font sizes, text color, paragraph spacing, line spacing, or indentation unless that formatting comes from a named heading style — this is a deliberate design choice of the library, not a bug, and there's currently no setting to change it. For pixel-accurate layout fidelity, you'll get better results printing directly from Word or Google Docs." }
        ]}
        tips={[
          "Basic formatting like headings, bold, italics, and tables carries over; very complex layouts or unusual styles may render differently than in Word.",
          "Page size, margins, and any page border are preserved, but manual formatting (specific fonts, font sizes, colors, paragraph spacing) generally isn't — apply formatting through named styles (like 'Heading 1') where possible for the most reliable conversion.",
          "If your file is a legacy .doc, open it in Word and save a copy as .docx before uploading.",
          "Preview the rendered tab before saving to check that everything looks right — if your browser blocks the new tab, allow pop-ups for this site and try again."
        ]}
      />
    </div>
  );
}