'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { addImagePage, PHONE_MAX_MP, MAX_DECODED_MP_COMPUTER, MAX_PAGE_POINTS } from '../../../lib/pdfImages';
import UploadPrompt from '@/app/components/UploadPrompt';
import { FileDownload } from '../../../components/FileDownload';
import ImagePageLayout, { DEFAULT_IMAGE_LAYOUT } from '../../../components/ImagePageLayout';
import { reportShownMessage } from '../../../lib/useToolError';
import SizePreflight from '../../../components/SizePreflight';

export default function ImageToPdfPage() {
  const [files, setFiles] = useState([]);
  const [layout, setLayout] = useState(DEFAULT_IMAGE_LAYOUT); // P24: page size, orientation, margin
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [notes, setNotes] = useState([]); // P33: 'photo.webp: reduced from … to … pixels'
  const inputRef = useRef();

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
    setStatus('');
    setDownloadUrl(null);
    setNotes([]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // P33 (05/10): reduce = the visitor chose 'Reduce to 48 MP then convert to PDF' (phone, a picture over the bound)
  const convert = async (reduce = false) => {
    if (files.length === 0) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    setNotes([]);
    const done = [];
    try {
      const { PDFDocument } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        // Upright (EXIF orientation), any format the browser can display, and
        // never silently skipped (29/09).
        const note = await addImagePage(pdfDoc, file, layout, { reduce, onProgress: (pct) => setStatus(`Reducing ${file.name} to ${PHONE_MAX_MP} MP… ${Math.round(pct)}%`) });
        setStatus('Converting...');
        if (note) done.push(note);
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setNotes(done);
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
        <p className="text-neutral-500 text-center mb-2">Combine JPG, PNG, HEIC, WebP, GIF, BMP, TIFF or AVIF pictures, added in several rounds, into one PDF</p>
        <p className="text-neutral-500 text-xs text-center mb-8">JPEG photos, except mirrored ones, go into the PDF without being decoded; other pictures can have up to {MAX_DECODED_MP_COMPUTER} megapixels each on a computer and {PHONE_MAX_MP} on phones and tablets, where a larger one other than a TIFF can be reduced to {PHONE_MAX_MP} MP first.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500"><UploadPrompt what="images" /> (JPG, PNG, HEIC, WebP, GIF, BMP, TIFF, AVIF)</p>
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
          <SizePreflight files={files} onReduce={() => convert(true)} busy={loading} />
          <button onClick={() => convert(false)} disabled={files.length === 0 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p role={status.startsWith('Error') ? 'alert' : 'status'} className={`text-center text-sm ${status.startsWith('Error') ? 'text-red-600' : 'text-neutral-600'}`}>{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              {notes.map((n) => <p key={n} className="text-neutral-600 text-xs mb-2" data-reduced-note>{n}</p>)}
              <FileDownload href={downloadUrl} name={files[0] ? `${files[0].name.replace(/\.[^.]+$/, '')}${files.length > 1 ? `-and-${files.length - 1}-more` : ''}.pdf` : 'images.pdf'} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image to PDF"
        description={`Image to PDF puts pictures of different formats into one PDF, one picture per page. It reads JPG, PNG, HEIC and HEIF, WebP, GIF (first frame), BMP, TIFF (every page) and AVIF. You can add pictures in several rounds and remove any of them with its ✕ button; the pages follow the order in which you added them. JPEG photos (unless mirrored), PNG pictures and TIFF pages keep their pixels; WebP, GIF, BMP and AVIF, and HEIC in Safari, are first drawn upright, while in other browsers a HEIC becomes a lossless PNG page. The PDF is assembled by pdf-lib right on your device.`}
        howToTitle="How to combine images into one PDF"
        howTo={[
          `Click or drop images on the upload area, and add more the same way if you need to.`,
          `Remove a picture with its ✕ button, then choose a "Page size", an "Orientation" and a "Margin".`,
          `Click "Convert to PDF", and once "Done!" appears, "Download" saves the combined PDF.`,
        ]}
        specs={[
          { label: 'Input formats', value: `JPG, PNG, HEIC, HEIF, WebP, GIF, BMP, TIFF, AVIF` },
          { label: 'Output', value: `One PDF, one page per picture and per TIFF page` },
          { label: 'Picture size on a computer', value: `JPEG: not limited by pixels, since it is not decoded (mirrored photos excepted); other formats: ${MAX_DECODED_MP_COMPUTER} MP each` },
          { label: 'On phones and tablets', value: `${PHONE_MAX_MP} MP for formats other than JPEG; a larger picture other than a TIFF can be reduced to ${PHONE_MAX_MP} MP` },
          { label: 'Page size', value: `"Fit to each picture": one pixel becomes one point, up to ${MAX_PAGE_POINTS.toLocaleString('en-US')} points per side; or A4, US Letter, US Legal, A5` },
        ]}
        privacy={`Your pictures are not uploaded. pdf-lib builds the PDF inside this browser tab, HEIC files are decoded by heic2any where the browser cannot open them, and TIFF files by the site's own decoder. If an error message appears, the cleaned message, the tool's name and your browser's name and version may reach us, never the images.`}
        faqs={[
          { q: `Can I mix JPG, PNG and HEIC in one PDF?`, a: `Yes. Every picture becomes its own page, whatever its format. A GIF gives its first frame and a multi-page TIFF gives one page per frame. A file that cannot be read is named in an error message; it is never dropped silently.` },
          { q: `Will the image quality drop?`, a: `No for JPEG photos, copied into the PDF byte for byte unless they are mirrored, and no for PNG and TIFF, which keep their pixels. WebP, AVIF, BMP and GIF pictures, and HEIC in Safari, are redrawn first, as JPEG for photos or PNG with transparency; in other browsers a HEIC becomes a lossless PNG page.` },
          { q: `Can I use A4 or Letter pages?`, a: `Yes. "Fit to each picture" makes every page the size of its picture. A4, US Letter, US Legal and A5 center each picture inside a margin of None, Small (10 mm) or Big (20 mm), scaled down to fit, never cropped or enlarged.` },
          { q: `Is there a picture size limit on a phone?`, a: `Yes: ${PHONE_MAX_MP} megapixels for formats other than JPEG on phones and tablets, against ${MAX_DECODED_MP_COMPUTER} on a computer. A bigger picture is named as soon as you pick it, and, unless it is a TIFF, the Reduce button shrinks it and converts it in one step.` },
        ]}
        tips={[
          `Add the pictures in the order you want: they cannot be reordered once added.`,
          `For a lighter file made of photos, run the PDF through PDF Compress afterwards.`,
        ]}
      />
    </div>
  );
}