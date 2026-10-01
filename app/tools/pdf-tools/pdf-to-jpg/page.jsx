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
        description={'PDF to JPG turns each page of your PDF into a JPG picture, or extracts the photos and images embedded in it, in your browser with PDF.js — the PDF is not uploaded. Choose Normal (150 dpi), High (300 dpi, for printing) or Screen (72 dpi), the JPG quality, and all pages or only some. Download each picture, or all of them in one ZIP.'}
        howTo={['Click or drop a PDF on the upload area.', 'Choose "Pages to images" to turn each page into a picture, or "Extract images" to take out the photos and pictures inside the PDF.', 'Pick the format, the resolution (Normal 150 dpi, High 300 dpi for printing, or Screen 72 dpi) and, if you want, only some pages, like 1-3, 5.', 'Click "Convert pages" (or "Extract images"), then "Download" under each picture or "Download all" for one ZIP file.']}
        faqs={[
          { q: 'Is PDF to JPG free?', a: 'Yes, free and with no sign-up. It runs in your browser, so there is no upload and no daily limit.' },
          { q: 'What is the difference between the two modes?', a: '"Pages to images" makes one JPG per page, exactly as the page looks. "Extract images" takes out the pictures placed inside the PDF (photos, scans, logos) at their own resolution, one file per picture — text and drawings are not included.' },
          { q: 'Which resolution should I choose?', a: 'Normal (150 dpi) is sharp on screens and keeps files small. High (300 dpi) is for printing. A page too large for your device to draw at once is rendered at the highest resolution that fits, and the page says so.' },
          { q: 'Can I convert only some pages?', a: 'Yes: type pages and ranges such as 1-3, 5, 8- in the Pages box. Leave it empty for every page.' },
          { q: 'My PDF has a password. What can I do?', a: 'A password-protected PDF cannot be read until it is unlocked. Use our PDF Unlock tool with the password, then convert the unlocked file.' },
          { q: 'Is my PDF uploaded?', a: 'No. Pages are rendered and saved as JPG in your browser; your file is not sent to a server.' }
        ]}
        tips={['Need lossless pictures, transparency or another format? Use PDF to Image: PNG, JPG, WebP, TIFF or BMP.', '"Extract images" gives the pictures at the resolution they were stored at, which can be higher than the page itself.', 'Very long PDFs: convert a range of pages at a time to keep your device responsive.']}
      />
    </div>
  );
}
