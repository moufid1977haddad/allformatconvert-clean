'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { addImagePage } from '../../../lib/pdfImages';
import { FileDownload } from '../../../components/FileDownload';
import ImagePageLayout, { DEFAULT_IMAGE_LAYOUT } from '../../../components/ImagePageLayout';
import { reportShownMessage } from '../../../lib/useToolError';

export default function ImageToPdfPage() {
  const [files, setFiles] = useState([]);
  const [layout, setLayout] = useState(DEFAULT_IMAGE_LAYOUT); // P24: page size, orientation, margin
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
      const { PDFDocument } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        // Upright (EXIF orientation), any format the browser can display, and
        // never silently skipped (29/09).
        await addImagePage(pdfDoc, file, layout);
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      reportShownMessage(err);
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG, PNG, HEIC, WebP, GIF, BMP, TIFF or AVIF images to a PDF file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add images (JPG, PNG, HEIC, WebP, GIF, BMP, TIFF, AVIF)</p>
            <input ref={inputRef} type="file" accept="image/*,.heic,.heif,.tif,.tiff" multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-neutral-500 text-sm w-6">{index + 1}.</span>
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <button onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`} className="text-red-500 hover:text-red-400 px-2 min-w-[44px] min-h-[44px]">✕</button>
                </div>
              ))}
            </div>
          )}
          <ImagePageLayout value={layout} onChange={setLayout} disabled={loading} />
          <button onClick={convert} disabled={files.length === 0 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p role={status.startsWith('Error') ? 'alert' : 'status'} className={`text-center text-sm ${status.startsWith('Error') ? 'text-red-600' : 'text-neutral-600'}`}>{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={files[0] ? `${files[0].name.replace(/\.[^.]+$/, '')}${files.length > 1 ? `-and-${files.length - 1}-more` : ''}.pdf` : 'images.pdf'} />
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
          "Click 'Download' to save the PDF."
        ]}
        faqs={[
          { q: "What image formats does Image to PDF support?", a: "JPG, PNG, HEIC / HEIF (iPhone photos), WebP, GIF (first frame), BMP, TIFF (every page) and AVIF. A file that cannot be read is named in an error message, never skipped silently." },
          { q: "Can I choose the page size and margins?", a: "Yes. Keep \"Fit to each picture\" for pages the size of each picture, or choose A4, US Letter, US Legal or A5, with an automatic, portrait or landscape orientation and no, small (10 mm) or big (20 mm) margin. Each picture is scaled to fit inside the margins and centred, never cropped or stretched." },
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