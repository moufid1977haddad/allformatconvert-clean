'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { addImagePage, PHONE_MAX_MP, MAX_DECODED_MP_COMPUTER } from '../../../lib/pdfImages';
import { FileDownload } from '../../../components/FileDownload';
import ImagePageLayout, { DEFAULT_IMAGE_LAYOUT } from '../../../components/ImagePageLayout';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import SizePreflight from '../../../components/SizePreflight';

export default function Page() {
  const [files, setFiles] = useState([]);
  const [layout, setLayout] = useState(DEFAULT_IMAGE_LAYOUT); // P24: page size, orientation, margin
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(''); // P33: 'Reducing photo.webp to 48 MP… 40%'
  const [notes, setNotes] = useState([]); // P33: 'photo.webp: reduced from … to … pixels'
  const [error, setError] = useToolError('');
  const fileRef = useRef();

  const handleFiles = (e) => { const newFiles = Array.from(e.target.files); e.target.value = ''; setFiles(newFiles); setResult(null); setNotes([]); };

  // P33 (05/10): reduce = the visitor chose 'Reduce to 48 MP then convert to PDF' (phone, a picture over the bound)
  const convert = async (reduce = false) => {
    if (!files.length) return;
    setLoading(true);
    setError('');
    setResult(null);
    setNotes([]);
    const done = [];
    try {
      const { PDFDocument } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        // Upright (EXIF orientation) and never silently skipped (29/09).
        const note = await addImagePage(pdfDoc, file, layout, { reduce, onProgress: (pct) => setProgress(`Reducing ${file.name} to ${PHONE_MAX_MP} MP… ${Math.round(pct)}%`) });
        setProgress('');
        if (note) done.push(note);
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(blob);
      setNotes(done);
    } catch(e) { setError('Conversion failed: ' + e.message); }
    setProgress('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">JPG to PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Convert JPG, PNG, HEIC, WebP, GIF, BMP, TIFF or AVIF images to one PDF</p>
        <p className="text-neutral-500 text-xs text-center mb-8">JPEG photos go into the PDF as they are, without being decoded (measured up to 200 megapixels); other images up to {MAX_DECODED_MP_COMPUTER} megapixels each on a computer, {PHONE_MAX_MP} on a phone (a larger one can be reduced to {PHONE_MAX_MP} MP first).</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {files.length > 0 ? <p className="text-neutral-700 font-medium">{files.length} image(s) selected</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="images" /> (JPG, PNG, HEIC, WebP, GIF, BMP, TIFF, AVIF)</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/*,.jpg,.jpeg,.jfif,.png,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff" multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => <div key={i} className="text-xs text-neutral-600 bg-neutral-50 rounded p-2 truncate border border-neutral-200">{f.name}</div>)}
            </div>
          )}
          <ImagePageLayout value={layout} onChange={setLayout} disabled={loading} />
          <SizePreflight files={files} onReduce={() => convert(true)} busy={loading} />
          <button onClick={() => convert(false)} disabled={!files.length || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? (progress || 'Converting...') : 'Convert to PDF'}
          </button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && notes.map((n) => <p key={n} className="text-neutral-600 text-center text-xs" data-reduced-note>{n}</p>)}
          {result && <FileDownload blob={result} name={files[0] ? `${files[0].name.replace(/\.[^.]+$/, '')}${files.length > 1 ? `-and-${files.length - 1}-more` : ''}.pdf` : 'images.pdf'} />}
        </div>
      </div>
      <SeoContent
        title="JPG to PDF"
        description="JPG to PDF is a one-shot batch converter: select your photos and images — JPG, PNG, HEIC (iPhone), WebP, GIF, BMP, TIFF or AVIF — and pdf-lib stitches them into a single PDF right in your browser, with no server upload involved. Picking a new set of files replaces whatever was previously selected, so grab everything you need in one pass — the output keeps each source image's original pixel dimensions, one per page."
        howTo={[
          "Click the upload area and select one or more images (JPG, PNG, HEIC, WebP, GIF, BMP, TIFF, AVIF) from your device.",
          "Review the selected files listed below the upload area.",
          "Click 'Convert to PDF' to combine them into a single PDF.",
          "Click 'Download' to save the PDF."
        ]}
        faqs={[
          { q: "Is JPG to PDF really free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I convert multiple JPG images at once?", a: "Yes, you can select multiple images at once, and they're combined into one multi-page PDF." },
          { q: "Can I choose the page size and margins?", a: "Yes. Keep \"Fit to each picture\" for pages the size of each picture, or choose A4, US Letter, US Legal or A5, with an automatic, portrait or landscape orientation and no, small (10 mm) or big (20 mm) margin. Each picture is scaled to fit inside the margins and centred, never cropped or stretched." },
          { q: "Is there a size limit for each image?", a: `JPEG photos are put in the PDF as they are, without being decoded: their memory use follows the size of the file, not its pixels (measured in WebKit, Safari's engine, up to a 200-megapixel, 103 MB JPEG: under 800 MB of memory). Every other image must be decoded first, so it can be up to ${MAX_DECODED_MP_COMPUTER} megapixels on a computer and ${PHONE_MAX_MP} on a phone (48 MP phone photos fit; measured memory use, a phone browser reloads a page that goes beyond). On a phone a larger one (a 63 MP HEIC panorama, a 108 MP photo) is named as soon as you choose it, and one button reduces it to ${PHONE_MAX_MP} MP and converts it in the same step.` },
          { q: "Will my files be uploaded to a server?", a: "No. Conversion happens entirely in your browser — your images are never uploaded anywhere." },
          { q: "What image formats besides JPG can be converted?", a: "PNG, HEIC / HEIF (iPhone photos), WebP, GIF (first frame), BMP, TIFF and AVIF. JPG photos are put in the PDF as they are, turned upright; the other formats are drawn upright first (JPEG for photos, PNG when the image has transparency). An image that cannot be read is named in a message — it is never skipped silently." }
        ]}
        tips={[
          "Select your images in the order you want them to appear, since there's no reordering step after upload.",
          "Each page matches its source image's exact pixel dimensions, so very differently sized images will produce pages of different sizes.",
          "iPhone photos can stay in HEIC: they are converted in your browser, upright, at full size.",
          "Download the result right away; it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}