'use client';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import PdfToImages from '../../../components/PdfToImages';

// P21 (02/10): pages AND embedded pictures, chosen pages, resolution and format — at the level of iLovePDF's "Page to
// JPG / Extract images" and CloudConvert's DPI and page range (app/components/PdfToImages.jsx).
export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Turn PDF pages into JPG images, or extract the pictures inside a PDF</p>
        <PdfToImages tool="pdf-to-jpg" formats={['jpg']} defaultFormat="jpg" />
      </div>
      <SeoContent
        title="PDF to JPG"
        description={'PDF to JPG saves PDF pages as JPG pictures, or extracts the photos and pictures embedded in a PDF as JPG files. You pick a quality, High (92) or Medium (80) for smaller files, and for pages a resolution of 150, 300 or 72 dpi. JPG has no transparency; for lossless pictures or another format, PDF to Image adds PNG, WebP, TIFF and BMP. PDF.js reads the file on your device, and on iPhone and iPad a slow page can be drawn by our PDF service.'}
        howToTitle="How to convert PDF to JPG"
        howTo={[
          'Click or drop the PDF to turn into JPG pictures.',
          'Keep "Pages to images" for one JPG per page, or pick "Extract images" in "Mode".',
          'Choose a "Resolution" and a "Quality", and type page numbers in "Pages" to convert only some.',
          'Click "Convert pages" (or "Extract images") and save each JPG with "Download", or all of them with "Download all".',
        ]}
        specs={[
          { label: 'Output format', value: 'JPG' },
          { label: 'Quality', value: 'High (92) or Medium (80)' },
          { label: 'Resolution for pages', value: '150 dpi (Normal), 300 dpi (High) or 72 dpi (Screen)' },
          { label: 'On iPhone and iPad', value: 'A page that fails or is not drawn within 20 seconds, and every page after it, is drawn by our service, up to 300 pages an hour and 1,000 a day per visitor, for PDFs up to 44 MB' },
        ]}
        privacy={'Your PDF is opened by PDF.js in the browser and is not uploaded from a computer or an Android device. On iPhone and iPad, a page the device fails to draw, or has not drawn after 20 seconds, is drawn with the following pages by our own PDF service from a copy of the PDF, which is deleted afterwards; a note says when that happened. Extracting images always stays on the device.'}
        faqs={[
          { q: 'Can I pull the photos out of a PDF as JPG files?', a: 'Yes. Choose "Extract images" in "Mode" and every picture embedded in the pages is saved as a separate JPG at the size it was stored at, which can be sharper than the page itself. Text and drawings are not included.' },
          { q: 'What resolution do the pages get?', a: '150 dpi by default. Choose 300 dpi for printing or 72 dpi for the smallest files. A page larger than your device can draw at once is rendered at the highest resolution it can manage, and a note tells you.' },
          { q: 'Does Medium quality make smaller files?', a: 'Yes. Medium encodes each JPG at quality 80 instead of 92, so the files are smaller and the compression is a little stronger.' },
          { q: 'Does it work on iPhone and iPad?', a: 'Yes. The device tries the pages first; after a failure or 20 seconds without a result, our PDF service draws that page and the following ones, within 300 pages an hour and 1,000 a day per visitor. A note below the button explains this before you start.' },
        ]}
        tips={['Need PNG, transparency or TIFF? Use PDF to Image, which offers five formats.']}
      />
    </div>
  );
}
