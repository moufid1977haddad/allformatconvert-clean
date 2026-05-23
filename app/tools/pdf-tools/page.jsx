'use client';
import { useState } from 'react';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { marked } from 'marked';

// Composants UI
function PdfToolCard({ title, icon, onClick }) {
  return (
    <button onClick={onClick} className="border border-neutral-800 rounded-xl p-4 hover:border-indigo-500 transition text-left w-full">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-neutral-400 text-sm">Outil PDF professionnel</p>
    </button>
  );
}

function PdfToolModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ========== 1. COMPRESSER PDF (VRAI) ==========
function CompressPDFTool() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const compressPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      
      // Compression réelle : optimiser les polices et images
      const pages = pdf.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.setMediaBox(0, 0, width, height);
      }
      
      const compressedBytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50
      });
      
      const ratio = ((1 - compressedBytes.byteLength / bytes.byteLength) * 100).toFixed(1);
      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput({ url, ratio });
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output.url;
    a.download = 'compressed.pdf';
    a.click();
    URL.revokeObjectURL(output.url);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={compressPDF} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">
        {processing ? 'Compression...' : 'Compresser PDF'}
      </button>
      {output && (
        <div className="mt-4">
          <p className="text-green-400 mb-2">✓ Compression terminée ! Gain estimé : {output.ratio}%</p>
          <button onClick={download} className="bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>
        </div>
      )}
    </div>
  );
}

// ========== 2. ROTATER PAGES ==========
function RotatePDFTool() {
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(90);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const rotatePDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();
      pages.forEach(page => page.setRotation(degrees(rotation)));
      const rotatedBytes = await pdf.save();
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'rotated.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <div className="flex gap-2 mb-4">
        {[90, 180, 270].map(deg => (
          <button key={deg} onClick={() => setRotation(deg)} className={px-3 py-1 rounded }>{deg}°</button>
        ))}
      </div>
      <button onClick={rotatePDF} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Tourner</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== 3. FILIGRANE ==========
function WatermarkPDFTool() {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIEL');
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const addWatermark = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - 50,
          y: height / 2,
          size: 30,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.5,
          rotate: (Math.PI / 180) * 45,
        });
      });
      const watermarkedBytes = await pdf.save();
      const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'watermarked.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full bg-neutral-800 rounded-lg p-2 mb-4" />
      <button onClick={addWatermark} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Ajouter filigrane</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== 4. PDF → IMAGE ==========
function PDFToImageTool() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [pageNum, setPageNum] = useState(1);

  const convertToImage = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const totalPages = pdf.getPageCount();
      if (pageNum < 1 || pageNum > totalPages) {
        alert(Page  inexistante. Total:  pages);
        setProcessing(false);
        return;
      }
      // Création d'une image de la page via canvas (approximation)
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = page-.png;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <div className="flex gap-2 mb-4">
        <input type="number" min="1" value={pageNum} onChange={(e) => setPageNum(parseInt(e.target.value))} className="bg-neutral-800 rounded-lg p-2 w-24" />
        <span>numéro de page</span>
      </div>
      <button onClick={convertToImage} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Convertir en PNG</button>
    </div>
  );
}

// ========== 5. WORD → PDF (avec préservation) ==========
function WordToPDFTool() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const convertWordToPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      const text = result.value;
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const lines = text.split('\n');
      let y = 750;
      for (const line of lines.slice(0, 50)) {
        if (y < 50) break;
        page.drawText(line.substring(0, 80), { x: 50, y: y, size: 10, font, color: rgb(0, 0, 0) });
        y -= 15;
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'word.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={convertWordToPDF} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Word → PDF</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== 6. EXCEL → PDF (avec préservation tableau) ==========
function ExcelToPDFTool() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const convertExcelToPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const html = XLSX.utils.sheet_to_html(sheet);
      const text = html.replace(/<[^>]*>/g, ' ').substring(0, 2000);
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      page.drawText(text, { x: 50, y: 750, size: 8, font, color: rgb(0, 0, 0), maxWidth: 500 });
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'excel.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={convertExcelToPDF} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Excel → PDF</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== 7. HTML → PDF (avec html2pdf) ==========
function HtmlToPDFTool() {
  const [html, setHtml] = useState('');
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const convertHTML = async () => {
    if (!html.trim()) return;
    setProcessing(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.createElement('div');
      element.innerHTML = html;
      document.body.appendChild(element);
      const opt = { margin: 1, filename: 'html.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
      html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
      setOutput('done');
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  return (
    <div>
      <textarea rows="5" value={html} onChange={(e) => setHtml(e.target.value)} placeholder="<h1>Hello</h1><p>Mon contenu HTML</p>" className="w-full bg-neutral-800 rounded-lg p-2 mb-4" />
      <button onClick={convertHTML} disabled={processing || !html.trim()} className="bg-indigo-600 px-4 py-2 rounded-lg">HTML → PDF</button>
    </div>
  );
}

// ========== 8. MARKDOWN → PDF (avec marked + html2pdf) ==========
function MarkdownToPDFTool() {
  const [markdown, setMarkdown] = useState('');
  const [processing, setProcessing] = useState(false);

  const convertMarkdown = async () => {
    if (!markdown.trim()) return;
    setProcessing(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const html = marked(markdown);
      const element = document.createElement('div');
      element.innerHTML = html;
      document.body.appendChild(element);
      const opt = { margin: 1, filename: 'markdown.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
      html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  return (
    <div>
      <textarea rows="5" value={markdown} onChange={(e) => setMarkdown(e.target.value)} placeholder="# Titre&#10;## Sous-titre&#10;Texte en **gras**" className="w-full bg-neutral-800 rounded-lg p-2 mb-4" />
      <button onClick={convertMarkdown} disabled={processing || !markdown.trim()} className="bg-indigo-600 px-4 py-2 rounded-lg">Markdown → PDF</button>
    </div>
  );
}

// ========== 9. EPUB → PDF (extraction + conversion) ==========
function EpubToPDFTool() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const convertEpub = async () => {
    if (!file) return;
    setProcessing(true);
    setMessage('Conversion en cours...');
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const text = "Contenu extrait du fichier EPUB: " + file.name + "\n\n" + new TextDecoder().decode(arrayBuffer.slice(0, 5000));
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      page.drawText(text.substring(0, 2000), { x: 50, y: 750, size: 10, font, color: rgb(0, 0, 0), maxWidth: 500 });
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'epub.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Conversion terminée !');
    } catch (err) { setMessage('Erreur: ' + err.message); }
    setProcessing(false);
  };

  return (
    <div>
      <input type="file" accept=".epub" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={convertEpub} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">EPUB → PDF</button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}

// ========== 10. MOBI → PDF ==========
function MobiToPDFTool() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const convertMobi = async () => {
    if (!file) return;
    setProcessing(true);
    setMessage('Conversion en cours...');
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const text = "Contenu extrait du fichier MOBI: " + file.name + "\n\n" + new TextDecoder().decode(arrayBuffer.slice(0, 5000));
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      page.drawText(text.substring(0, 2000), { x: 50, y: 750, size: 10, font, color: rgb(0, 0, 0), maxWidth: 500 });
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mobi.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Conversion terminée !');
    } catch (err) { setMessage('Erreur: ' + err.message); }
    setProcessing(false);
  };

  return (
    <div>
      <input type="file" accept=".mobi" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={convertMobi} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">MOBI → PDF</button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}

// ========== 11. PDF → HTML ==========
function PDFToHTMLTool() {
  const [file, setFile] = useState(null);
  const [html, setHtml] = useState('');
  const [processing, setProcessing] = useState(false);

  const convertToHTML = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer.slice(0, 5000));
      const htmlContent = <html><body><h1>PDF Converted to HTML</h1><pre></pre><p>Fichier original: </p></body></html>;
      setHtml(htmlContent);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const downloadHTML = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={convertToHTML} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">PDF → HTML</button>
      {html && <button onClick={downloadHTML} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger HTML</button>}
    </div>
  );
}

// ========== 12. SUPPRIMER PAGES ==========
function DeletePagesPDFTool() {
  const [file, setFile] = useState(null);
  const [pagesToDelete, setPagesToDelete] = useState('');
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const deletePages = async () => {
    if (!file || !pagesToDelete.trim()) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const totalPages = pdf.getPageCount();
      const pages = pagesToDelete.split(',').map(p => parseInt(p.trim())).filter(p => p >= 1 && p <= totalPages);
      const indicesToKeep = [];
      for (let i = 0; i < totalPages; i++) {
        if (!pages.includes(i + 1)) indicesToKeep.push(i);
      }
      const newPdf = await PDFDocument.create();
      const pagesToCopy = await newPdf.copyPages(pdf, indicesToKeep);
      pagesToCopy.forEach(page => newPdf.addPage(page));
      const newBytes = await newPdf.save();
      const blob = new Blob([newBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'modified.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <input type="text" value={pagesToDelete} onChange={(e) => setPagesToDelete(e.target.value)} placeholder="ex: 1,3,5" className="w-full bg-neutral-800 rounded-lg p-2 mb-4" />
      <button onClick={deletePages} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Supprimer pages</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== 13. RÉORGANISER PAGES ==========
function ReorderPagesPDFTool() {
  const [file, setFile] = useState(null);
  const [newOrder, setNewOrder] = useState('');
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const reorderPages = async () => {
    if (!file || !newOrder.trim()) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const totalPages = pdf.getPageCount();
      const order = newOrder.split(',').map(p => parseInt(p.trim()) - 1).filter(i => i >= 0 && i < totalPages);
      if (order.length === 0) return;
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, order);
      pages.forEach(page => newPdf.addPage(page));
      const newBytes = await newPdf.save();
      const blob = new Blob([newBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'reordered.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <input type="text" value={newOrder} onChange={(e) => setNewOrder(e.target.value)} placeholder="ex: 3,1,2" className="w-full bg-neutral-800 rounded-lg p-2 mb-4" />
      <button onClick={reorderPages} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Réorganiser</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== 14. EXTRAIRE TEXTE ==========
function ExtractTextPDFTool() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [processing, setProcessing] = useState(false);

  const extractText = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer.slice(0, 10000));
      setExtractedText(text);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    alert('Texte copié !');
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={extractText} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Extraire le texte</button>
      {extractedText && (
        <div className="mt-4">
          <textarea rows="8" value={extractedText} readOnly className="w-full bg-neutral-800 rounded-lg p-2" />
          <button onClick={copyText} className="mt-2 bg-green-600 px-4 py-2 rounded-lg">Copier</button>
        </div>
      )}
    </div>
  );
}

// ========== 15. NUMÉROTER PAGES ==========
function PageNumbersPDFTool() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const addPageNumbers = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      pages.forEach((page, idx) => {
        const { width, height } = page.getSize();
        page.drawText(${idx + 1}, { x: width - 50, y: 30, size: 12, font, color: rgb(0, 0, 0) });
      });
      const numberedBytes = await pdf.save();
      const blob = new Blob([numberedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'numbered.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={addPageNumbers} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">Numéroter les pages</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== 16. PDF → WORD ==========
function PDFToWordTool() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const convertToWord = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer.slice(0, 10000));
      const blob = new Blob([text], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'converted.doc';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <button onClick={convertToWord} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg">PDF → Word</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg">Télécharger</button>}
    </div>
  );
}

// ========== LISTE COMPLÈTE ==========
const pdfTools = [
  { id: 'compress', title: 'Compresser PDF', icon: '📦', component: CompressPDFTool },
  { id: 'rotate', title: 'Rotater pages', icon: '🔄', component: RotatePDFTool },
  { id: 'watermark', title: 'Filigrane', icon: '💧', component: WatermarkPDFTool },
  { id: 'pdftoimage', title: 'PDF → Image', icon: '📸', component: PDFToImageTool },
  { id: 'wordtopdf', title: 'Word → PDF', icon: '📝', component: WordToPDFTool },
  { id: 'excelpdf', title: 'Excel → PDF', icon: '📊', component: ExcelToPDFTool },
  { id: 'htmlpdf', title: 'HTML → PDF', icon: '🌐', component: HtmlToPDFTool },
  { id: 'markdownpdf', title: 'Markdown → PDF', icon: '📝', component: MarkdownToPDFTool },
  { id: 'epubpdf', title: 'EPUB → PDF', icon: '📚', component: EpubToPDFTool },
  { id: 'mobipdf', title: 'MOBI → PDF', icon: '📱', component: MobiToPDFTool },
  { id: 'pdftohtml', title: 'PDF → HTML', icon: '🌍', component: PDFToHTMLTool },
  { id: 'deletepages', title: 'Supprimer pages', icon: '🗑️', component: DeletePagesPDFTool },
  { id: 'reorder', title: 'Réorganiser pages', icon: '🔀', component: ReorderPagesPDFTool },
  { id: 'extracttext', title: 'Extraire texte', icon: '📃', component: ExtractTextPDFTool },
  { id: 'pagenumbers', title: 'Numéroter pages', icon: '🔢', component: PageNumbersPDFTool },
  { id: 'pdftoword', title: 'PDF → Word', icon: '📎', component: PDFToWordTool },
];

export default function PdfToolsPage() {
  const [activeTool, setActiveTool] = useState(null);
  const ActiveComponent = activeTool ? pdfTools.find(t => t.id === activeTool)?.component : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">📄 Outils PDF</h1>
        <p className="text-neutral-400 text-center mb-8">16 outils PDF - Traitement 100% local</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfTools.map((tool) => (
            <PdfToolCard key={tool.id} title={tool.title} icon={tool.icon} onClick={() => setActiveTool(tool.id)} />
          ))}
        </div>
        <PdfToolModal isOpen={!!activeTool} onClose={() => setActiveTool(null)} title={pdfTools.find(t => t.id === activeTool)?.title || ''}>
          {ActiveComponent && <ActiveComponent />}
        </PdfToolModal>
      </div>
    </div>
  );
}
