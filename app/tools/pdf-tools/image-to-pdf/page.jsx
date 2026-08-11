'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import SeoContent from '../../../components/SeoContent';

export default function ImageToPdfPage() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
    setStatus('');
    setDownloadUrl(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convert = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          continue;
        }
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
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
        <h1 className="text-3xl font-bold text-center mb-2">Image to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG and PNG images to a PDF file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add images (JPG, PNG)</p>
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-neutral-500 text-sm w-6">{index + 1}.</span>
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={convert} disabled={files.length === 0 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download="images.pdf" className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download PDF</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image to PDF"
        description="Image to PDF turns any mix of JPG and PNG files into one downloadable PDF, processed locally with the pdf-lib library so nothing ever reaches a server. Build your file list across as many uploads as you like, drop any image you change your mind about with its ✕ button, then convert — each page comes out at that source image's exact pixel size."
        howTo={[
          "Click the upload area and select one or more JPG or PNG images from your device.",
          "Remove any image you don't want by clicking the ✕ next to it — files appear in the order you added them.",
          "Click 'Convert to PDF' to combine them into a single PDF.",
          "Click 'Download PDF' to save the file."
        ]}
        faqs={[
          { q: "What image formats does Image to PDF support?", a: "JPG and PNG only — other formats you select, such as GIF or WebP, are silently skipped during conversion." },
          { q: "Is there a limit to how many images I can convert?", a: "There's no fixed limit — it's bound only by your device's available memory." },
          { q: "Is my data secure when using this tool?", a: "Yes, everything happens locally in your browser. Your images are never uploaded to a server." },
          { q: "Can I reorder images before converting?", a: "No, images appear in the PDF in the order you selected them — there's no drag-and-drop reordering or arrow buttons." }
        ]}
        tips={[
          "Add your images in the order you want them to appear, since there's no reordering step after upload.",
          "Each page is sized to match its source image's exact pixel dimensions, so mixing very different image sizes will produce pages of different sizes.",
          "Stick to JPG or PNG — other formats you upload will be silently skipped, not converted.",
          "Remove an image with the ✕ button before converting if you added the wrong one."
        ]}
      />
    </div>
  );
}