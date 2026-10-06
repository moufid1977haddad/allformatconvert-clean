'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { addImagePage, PHONE_MAX_MP, MAX_DECODED_MP_COMPUTER, MAX_PAGE_POINTS } from '../../../lib/pdfImages';
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
        <p className="text-neutral-500 text-center mb-2">Put a batch of photos in one PDF without recompressing the JPEGs</p>
        <p className="text-neutral-500 text-xs text-center mb-8">JPEG photos, measured up to 200 megapixels, are placed in the PDF without being decoded unless they are mirrored. Other formats: up to {MAX_DECODED_MP_COMPUTER} megapixels on a computer and {PHONE_MAX_MP} on phones and tablets, where all but a TIFF can be reduced first.</p>
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
        description={`JPG to PDF makes one PDF from a batch of photos, one photo per page. JPEG files (.jpg, .jpeg, .jfif) are copied into the PDF without recompression; a photo with an EXIF rotation is turned on the page, and only mirrored ones are redrawn. PNG, HEIC, WebP, GIF, BMP, TIFF and AVIF are accepted as well. Pick every photo in one go, since a new selection replaces the previous one. pdf-lib builds the PDF on your device, and nothing is uploaded.`}
        howToTitle="How to convert JPG photos to PDF"
        howTo={[
          `Click or drop all your photos at once on the upload area; their names are listed below it.`,
          `Choose a "Page size", or keep "Fit to each picture" for a page as large as each photo.`,
          `Click "Convert to PDF", then save the result with "Download".`,
        ]}
        specs={[
          { label: 'Input formats', value: `JPG, JPEG, JFIF, PNG, HEIC, HEIF, WebP, GIF, BMP, AVIF, TIFF` },
          { label: 'Output', value: `One PDF, one page per photo` },
          { label: 'JPEG photos', value: `Not decoded (mirrored photos excepted), so not limited by pixels; tested up to 200 megapixels in Safari's engine` },
          { label: 'Other formats', value: `${MAX_DECODED_MP_COMPUTER} MP on a computer, ${PHONE_MAX_MP} MP on phones and tablets` },
          { label: 'Selection', value: `One selection at a time; choosing files again replaces the list` },
        ]}
        privacy={`The photos remain on your device. The PDF is put together by pdf-lib in this browser tab, HEIC photos are decoded by heic2any when the browser has no HEIC decoder of its own, and the result exists only in the tab until you download it.`}
        faqs={[
          { q: `Can I combine several JPGs into one PDF?`, a: `Yes. Select all of them in the file picker at once; each becomes one page, in the order listed under the upload area. Choosing files again starts a new selection, so pick the whole set in one go, or use Image to PDF to add photos in several rounds.` },
          { q: `Are my photos recompressed?`, a: `No. A JPEG is copied into the PDF as it is, and a photo with an EXIF rotation is turned on the page instead of being redrawn. Only mirrored JPEGs and WebP, GIF, BMP or AVIF pictures, plus HEIC in Safari, are drawn again; PNG and TIFF keep their pixels.` },
          { q: `Can I convert iPhone HEIC photos?`, a: `Yes. HEIC and HEIF photos are read in the browser and placed upright. On phones and tablets, a picture above ${PHONE_MAX_MP} megapixels has to be reduced first; the page names it and offers to reduce it in the same step as the conversion.` },
          { q: `Can I set the page size and margins?`, a: `Yes. Choose A4, US Letter, US Legal or A5 with automatic, portrait or landscape orientation and a margin of None, Small or Big, or keep "Fit to each picture", where a page matches its photo, scaled down only beyond ${MAX_PAGE_POINTS.toLocaleString('en-US')} points per side.` },
        ]}
        tips={[
          `Download the PDF before leaving the page: it is kept only in this browser tab.`,
        ]}
      />
    </div>
  );
}