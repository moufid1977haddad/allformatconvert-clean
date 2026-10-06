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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Turn PDF pages into PNG, JPG, WebP, TIFF or BMP images, or extract the pictures inside</p>
        <PdfToImages tool="pdf-to-image" formats={['png', 'jpg', 'webp', 'tiff', 'bmp']} defaultFormat="png" />
      </div>
      <SeoContent
        title="PDF to Image"
        description={'PDF to Image turns PDF pages into pictures, or takes out the pictures a PDF contains. Five formats are offered: lossless PNG, the default, JPG and WebP with a quality setting, TIFF and BMP. Pages are drawn at 150, 300 or 72 dpi; extracted pictures keep the size at which they were stored. PDF.js does the work in the browser tab. On iPhone and iPad only, a page the device cannot draw in time is drawn by our own PDF service instead, and the page says so.'}
        howToTitle="How to convert PDF pages to images"
        howTo={[
          'Click or drop the PDF whose pages or pictures you want as image files.',
          'In "Mode", keep "Pages to images" or choose "Extract images".',
          'Set the "Format", the "Resolution", the "Quality" for JPG or WebP, and the "Pages" if you want only some of them.',
          'Click "Convert pages" or "Extract images", then "Download" under a picture, or "Download all" for a ZIP.',
        ]}
        specs={[
          { label: 'Output formats', value: 'PNG, JPG, WebP, TIFF, BMP' },
          { label: 'Several pictures', value: 'One ZIP file with the download-all button' },
          { label: 'Resolution', value: 'Normal 150 dpi, High 300 dpi or Screen 72 dpi, for pages' },
          { label: 'Time per page', value: '60 seconds on a computer or Android device; on iPhone and iPad, 20 seconds, after which, or at once if drawing fails, our service draws that page and the following ones' },
          { label: 'On iPhone and iPad', value: 'Pages drawn by our service: 300 pages an hour and 1,000 a day per visitor; PDF up to 44 MB' },
        ]}
        privacy={'On a computer or an Android device, the PDF is read and drawn inside this browser tab and is not uploaded. On iPhone and iPad, when a page fails or is not drawn within 20 seconds, the PDF is sent to our own PDF service, which draws that page and every page after it with Poppler; the page tells you, and the copy is deleted after the run. "Extract images" never uses the service.'}
        faqs={[
          { q: 'Can I extract the images from a PDF instead of whole pages?', a: 'Yes. Choose "Extract images" in "Mode": each picture placed in the PDF is saved as its own file at the size it was stored at. Text and vector drawings are left out, and tiny pictures under 16 pixels on a side are skipped.' },
          { q: 'Which resolution should I choose?', a: '150 dpi, the "Normal" setting, suits screens. 300 dpi, "High", is meant for printing. 72 dpi, "Screen", gives the smallest files. A page too large for your device to draw at once is rendered at the highest resolution that fits, and the page says so.' },
          { q: 'Can I convert only some pages?', a: 'Yes. Type pages and ranges in the "Pages" box, such as 1-3, 5 or 8- for page eight to the end; leave it empty to convert every page.' },
          { q: 'Can I convert a password-protected PDF?', a: 'No, not until it is unlocked. Remove the password with PDF Unlock, which needs the password, then convert the unlocked file here.' },
        ]}
        tips={['A TIFF result has no preview on the page, but the file is complete and downloads normally.']}
      />
    </div>
  );
}
