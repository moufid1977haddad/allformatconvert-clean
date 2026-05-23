'use client';
import { useState } from 'react';

function PdfToolCard({ title, description, icon, onClick }) {
  return (
    <button onClick={onClick} className="border border-neutral-800 rounded-xl p-4 hover:border-indigo-500 transition text-left w-full">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-neutral-400 text-sm mt-1">{description}</p>
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

// ========== OUTILS FONCTIONNELS ==========

function MergePDFTool() {
  const [files, setFiles] = useState([]);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const pdfs = dropped.filter(f => f.type === 'application/pdf');
    setFiles(pdfs);
    setOutput(null);
  };

  const mergePDFs = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'fusion.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
        <p>📁 Glissez vos PDF ici</p>
        <p className="text-neutral-500 text-sm mt-1">2 fichiers minimum</p>
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-sm mb-2">{files.length} fichier(s) sélectionné(s)</p>
          {files.map((f, i) => <div key={i} className="text-sm text-neutral-400">• {f.name}</div>)}
          <button onClick={mergePDFs} disabled={processing || files.length < 2} className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50">
            {processing ? 'Fusion en cours...' : 'Fusionner'}
          </button>
          {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500">Télécharger</button>}
        </div>
      )}
    </div>
  );
}

function SplitPDFTool() {
  const [file, setFile] = useState(null);
  const [ranges, setRanges] = useState('1-2,4');
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const splitPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const totalPages = pdf.getPageCount();
      const rangesArray = [];
      const parts = ranges.replace(/\s/g, '').split(',');
      for (const part of parts) {
        if (part.includes('-')) {
          const [s, e] = part.split('-').map(Number);
          if (s >= 1 && e <= totalPages && s <= e) rangesArray.push([s, e]);
        } else {
          const p = Number(part);
          if (p >= 1 && p <= totalPages) rangesArray.push([p, p]);
        }
      }
      if (rangesArray.length === 0) return;
      const newPdf = await PDFDocument.create();
      for (const [s, e] of rangesArray) {
        const pageIndices = Array.from({ length: e - s + 1 }, (_, i) => s + i - 1);
        const pages = await newPdf.copyPages(pdf, pageIndices);
        pages.forEach(page => newPdf.addPage(page));
      }
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
    a.download = 'decoupe.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      {file && <p className="text-sm mb-2">Fichier : {file.name}</p>}
      <label className="block text-sm mb-1">Plages (ex: 1-2,4,6-7)</label>
      <input type="text" value={ranges} onChange={(e) => setRanges(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 mb-4" />
      <button onClick={splitPDF} disabled={processing || !file} className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50">
        {processing ? 'Découpe en cours...' : 'Découper'}
      </button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500">Télécharger</button>}
    </div>
  );
}

function ProtectPDFTool() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState(null);

  const protectPDF = async () => {
    if (!file || !password) return;
    const { PDFDocument } = await import('pdf-lib');
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    pdf.encrypt({ userPassword: password, ownerPassword: password });
    const protectedBytes = await pdf.save();
    const blob = new Blob([protectedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setOutput(url);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'protected.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="mb-4" />
      <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 mb-4" />
      <button onClick={protectPDF} disabled={!file || !password} className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50">Protéger</button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500">Télécharger</button>}
    </div>
  );
}

function ImageToPDFTool() {
  const [images, setImages] = useState([]);
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const imgs = dropped.filter(f => f.type.startsWith('image/'));
    setImages(imgs);
    setOutput(null);
  };

  const convertToPDF = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      for (const img of images) {
        const bytes = await img.arrayBuffer();
        let image;
        if (img.type === 'image/jpeg') image = await pdf.embedJpg(bytes);
        else if (img.type === 'image/png') image = await pdf.embedPng(bytes);
        else continue;
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'images.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
        <p>📁 Glissez vos images ici</p>
        <p className="text-neutral-500 text-sm mt-1">PNG, JPG</p>
      </div>
      {images.length > 0 && (
        <div className="mt-4">
          <p className="text-sm mb-2">{images.length} image(s) sélectionnée(s)</p>
          <button onClick={convertToPDF} disabled={processing} className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50">
            {processing ? 'Conversion...' : 'Convertir en PDF'}
          </button>
          {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500">Télécharger PDF</button>}
        </div>
      )}
    </div>
  );
}

function TextToPDFTool() {
  const [text, setText] = useState('');
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(false);

  const convertToPDF = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      page.drawText(text, { x: 50, y: 750, size: 12, font, color: rgb(0, 0, 0), maxWidth: 500 });
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutput(url);
    } catch (err) { console.error(err); }
    setProcessing(false);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'texte.pdf';
    a.click();
    URL.revokeObjectURL(output);
    setOutput(null);
  };

  return (
    <div>
      <textarea rows="5" value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre texte ici..." className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 mb-4" />
      <button onClick={convertToPDF} disabled={processing || !text.trim()} className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50">
        {processing ? 'Conversion...' : 'Convertir en PDF'}
      </button>
      {output && <button onClick={download} className="mt-2 ml-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500">Télécharger PDF</button>}
    </div>
  );
}

// ========== TEMPLATES POUR OUTILS À VENIR ==========
const ComingSoon = ({ title }) => <div className="text-center py-8">{title} - Fonctionnalité à venir</div>;

// ========== LISTE COMPLÈTE DES 21 OUTILS ==========
const pdfTools = [
  { id: 'merge', title: 'Fusion PDF', description: 'Combinez plusieurs PDF en un seul', icon: '🔗', component: MergePDFTool },
  { id: 'split', title: 'Découpe PDF', description: 'Extrayez des pages spécifiques', icon: '✂️', component: SplitPDFTool },
  { id: 'compress', title: 'Compresser PDF', description: 'Réduisez la taille du fichier', icon: '📦', component: () => <ComingSoon title="Compresser PDF" /> },
  { id: 'protect', title: 'Protéger PDF', description: 'Chiffrez avec mot de passe', icon: '🔒', component: ProtectPDFTool },
  { id: 'rotate', title: 'Rotater pages', description: 'Tournez les pages à 90°, 180°, 270°', icon: '🔄', component: () => <ComingSoon title="Rotater pages" /> },
  { id: 'watermark', title: 'Filigrane', description: 'Ajoutez un texte en watermark', icon: '💧', component: () => <ComingSoon title="Filigrane" /> },
  { id: 'imagetopdf', title: 'Image → PDF', description: 'Convertissez des images en PDF', icon: '🖼️', component: ImageToPDFTool },
  { id: 'pdftoimage', title: 'PDF → Image', description: 'Convertissez PDF en images', icon: '📸', component: () => <ComingSoon title="PDF → Image" /> },
  { id: 'wordtopdf', title: 'Word → PDF', description: 'Convertissez DOCX en PDF', icon: '📝', component: () => <ComingSoon title="Word → PDF" /> },
  { id: 'excelpdf', title: 'Excel → PDF', description: 'Convertissez XLSX en PDF', icon: '📊', component: () => <ComingSoon title="Excel → PDF" /> },
  { id: 'htmlpdf', title: 'HTML → PDF', description: 'Convertissez du HTML en PDF', icon: '🌐', component: () => <ComingSoon title="HTML → PDF" /> },
  { id: 'textpdf', title: 'Texte → PDF', description: 'Convertissez du texte en PDF', icon: '📄', component: TextToPDFTool },
  { id: 'markdownpdf', title: 'Markdown → PDF', description: 'Convertissez Markdown en PDF', icon: '📝', component: () => <ComingSoon title="Markdown → PDF" /> },
  { id: 'epubpdf', title: 'EPUB → PDF', description: 'Convertissez EPUB en PDF', icon: '📚', component: () => <ComingSoon title="EPUB → PDF" /> },
  { id: 'mobipdf', title: 'MOBI → PDF', description: 'Convertissez MOBI en PDF', icon: '📱', component: () => <ComingSoon title="MOBI → PDF" /> },
  { id: 'pdftohtml', title: 'PDF → HTML', description: 'Convertissez PDF en HTML', icon: '🌍', component: () => <ComingSoon title="PDF → HTML" /> },
  { id: 'deletepages', title: 'Supprimer pages', description: 'Supprimez des pages spécifiques', icon: '🗑️', component: () => <ComingSoon title="Supprimer pages" /> },
  { id: 'reorder', title: 'Réorganiser pages', description: 'Changez l ordre des pages', icon: '🔀', component: () => <ComingSoon title="Réorganiser pages" /> },
  { id: 'extracttext', title: 'Extraire texte', description: 'Extrayez tout le texte', icon: '📃', component: () => <ComingSoon title="Extraire texte" /> },
  { id: 'pagenumbers', title: 'Numéroter pages', description: 'Ajoutez des numéros', icon: '🔢', component: () => <ComingSoon title="Numéroter pages" /> },
  { id: 'pdftoword', title: 'PDF → Word', description: 'Convertissez PDF en DOCX', icon: '📎', component: () => <ComingSoon title="PDF → Word" /> },
];

export default function PdfToolsPage() {
  const [activeTool, setActiveTool] = useState(null);
  const ActiveComponent = activeTool ? pdfTools.find(t => t.id === activeTool)?.component : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">📄 Outils PDF</h1>
        <p className="text-neutral-400 text-center mb-8">Tous vos outils PDF en un seul endroit - 21 outils</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfTools.map((tool) => (
            <PdfToolCard key={tool.id} title={tool.title} description={tool.description} icon={tool.icon} onClick={() => setActiveTool(tool.id)} />
          ))}
        </div>
        <PdfToolModal isOpen={!!activeTool} onClose={() => setActiveTool(null)} title={pdfTools.find(t => t.id === activeTool)?.title || ''}>
          {ActiveComponent && <ActiveComponent />}
        </PdfToolModal>
      </div>
    </div>
  );
}
