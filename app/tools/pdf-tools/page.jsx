'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Merge PDF', description: 'Join PDFs, images and Office files into one PDF', href: '/tools/pdf-tools/pdf-merge', group: 'Organize' },
  { title: 'Split PDF', description: 'Split by ranges, every N pages or bookmarks', href: '/tools/pdf-tools/pdf-split', group: 'Organize' },
  { title: 'Compress PDF', description: 'Make a PDF smaller at one of three levels', href: '/tools/pdf-tools/pdf-compress', group: 'Optimize' },
  { title: 'Protect PDF', description: 'Encrypt with AES-128 and set permissions', href: '/tools/pdf-tools/pdf-protect', group: 'Security' },
  { title: 'Unlock PDF', description: 'Remove a password you know, or restrictions', href: '/tools/pdf-tools/pdf-unlock', group: 'Security' },
  { title: 'Rotate PDF', description: 'Turn all or chosen pages by 90° or 180°', href: '/tools/pdf-tools/pdf-rotate', group: 'Edit' },
  { title: 'Watermark PDF', description: 'Text or image watermark, placed or tiled', href: '/tools/pdf-tools/pdf-watermark', group: 'Edit' },
  { title: 'Image to PDF', description: 'JPG, PNG, HEIC, WebP, TIFF and more to PDF', href: '/tools/pdf-tools/image-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to Image', description: 'Pages to PNG, JPG, WebP, TIFF or BMP', href: '/tools/pdf-tools/pdf-to-image', group: 'Convert from PDF' },
  { title: 'PDF to JPG', description: 'Pages to JPG, or extract the images as JPG', href: '/tools/pdf-tools/pdf-to-jpg', group: 'Convert from PDF' },
  { title: 'JPG to PDF', description: 'Combine JPG photos into one PDF', href: '/tools/pdf-tools/jpg-to-pdf', group: 'Convert to PDF' },
  { title: 'Word to PDF', description: 'DOCX, DOC, ODT and RTF documents to PDF', href: '/tools/pdf-tools/word-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to Word', description: 'Editable DOCX, DOC or RTF via ConvertAPI', href: '/tools/pdf-tools/pdf-to-word', group: 'Convert from PDF' },
  { title: 'Excel to PDF', description: 'XLSX, CSV and ODS spreadsheets to PDF', href: '/tools/pdf-tools/excel-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to Excel', description: 'PDF tables to an XLSX workbook', href: '/tools/pdf-tools/pdf-to-excel', group: 'Convert from PDF' },
  { title: 'PDF to PPT', description: 'Each page as an editable PowerPoint slide', href: '/tools/pdf-tools/pdf-to-ppt', group: 'Convert from PDF' },
  { title: 'PPT to PDF', description: 'PowerPoint and ODP presentations to PDF', href: '/tools/pdf-tools/ppt-to-pdf', group: 'Convert to PDF' },
  { title: 'HTML to PDF', description: 'Print a web page, HTML file or code to PDF', href: '/tools/pdf-tools/html-to-pdf', group: 'Convert to PDF' },
  { title: 'Text to PDF', description: 'Plain text to PDF with Noto fonts', href: '/tools/pdf-tools/text-to-pdf', group: 'Convert to PDF' },
  { title: 'Markdown to PDF', description: 'Render Markdown with GFM tables as a PDF', href: '/tools/pdf-tools/markdown-to-pdf', group: 'Convert to PDF' },
  { title: 'EPUB to PDF', description: 'Print an EPUB ebook as a PDF', href: '/tools/pdf-tools/epub-to-pdf', group: 'Convert to PDF' },
  { title: 'MOBI to PDF', description: 'Print a Kindle MOBI or AZW3 book as a PDF', href: '/tools/pdf-tools/mobi-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to HTML', description: 'Each page\'s text in a simple HTML page', href: '/tools/pdf-tools/pdf-to-html', group: 'Convert from PDF' },
  { title: 'Delete Pages', description: 'Remove pages by number or range', href: '/tools/pdf-tools/pdf-delete-pages', group: 'Organize' },
  { title: 'Reorder Pages', description: 'Type the new page order, such as 3, 1, 2', href: '/tools/pdf-tools/pdf-reorder-pages', group: 'Organize' },
  { title: 'Organize PDF', description: 'Move, rotate, duplicate or remove pages', href: '/tools/pdf-tools/pdf-organize', group: 'Organize' },
  { title: 'Extract Text', description: 'Copy the text layer of a PDF as plain text', href: '/tools/pdf-tools/pdf-extract-text', group: 'Optimize' },
  { title: 'Number Pages', description: 'Page numbers in 5 formats and 6 positions', href: '/tools/pdf-tools/pdf-number-pages', group: 'Edit' },
  { title: 'PDF Editor', description: 'Rearrange pages, add text, pictures, pen and highlights', href: '/tools/pdf-tools/pdf-editor', group: 'Edit' },
  { title: 'Sign PDF', description: 'Draw, type or upload a signature and place it', href: '/tools/pdf-tools/pdf-sign', group: 'Security' },
  { title: 'PDF OCR', description: 'Make scanned PDFs searchable, 102 languages', href: '/tools/pdf-tools/pdf-ocr', group: 'Optimize' },
  { title: 'PDF Forms', description: 'Fill in the fields of an existing PDF form', href: '/tools/pdf-tools/pdf-forms', group: 'Edit' },
  { title: 'Redact PDF', description: 'Black out words, emails, phone and card numbers', href: '/tools/pdf-tools/pdf-redact', group: 'Security' },
  { title: 'Crop PDF', description: 'Trim the visible margins of pages', href: '/tools/pdf-tools/pdf-crop', group: 'Edit' },
  { title: 'Compare PDF', description: 'Show the text differences between two PDFs', href: '/tools/pdf-tools/pdf-compare', group: 'Security' },
  { title: 'PDF to PDF/A', description: 'PDF/A-1b to 3a, checked with veraPDF', href: '/tools/pdf-tools/pdf-to-pdfa', group: 'Convert from PDF' },
  { title: 'Repair PDF', description: 'Rebuild the structure of a damaged PDF', href: '/tools/pdf-tools/pdf-repair', group: 'Optimize' },
  { title: 'AI PDF Summary', description: 'Summarize the text of a PDF with OpenAI', href: '/tools/pdf-tools/pdf-ai-summary', group: 'AI & Content' },
  { title: 'Translate PDF', description: 'Translate a PDF\'s text, or the whole file when offered', href: '/tools/pdf-tools/pdf-translate', group: 'AI & Content' },
];

export default function PdfToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800 flex items-center justify-center gap-2"><CategoryIcon slug="pdf-tools" className={`w-8 h-8 ${categoryColors['pdf-tools']}`} /> PDF Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Organize, edit, convert and protect PDF files - {tools.filter(t => !t.comingSoon).length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              {tool.comingSoon && <span className="mb-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Coming soon</span>}
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About PDF Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Most of these tools edit the PDF in your browser with pdf-lib and PDF.js. Excel, PowerPoint, HTML, Markdown, EPUB and MOBI to PDF, Text to PDF when the text needs a font we do not have, Compress, Repair and PDF to PDF/A send the file or its prepared pages to our own servers, which run LibreOffice and Chromium through Gotenberg, and our pdf-tools service. PDF to Word, Excel and PowerPoint, and .docx to PDF, go through our server to ConvertAPI; other Word formats go to our LibreOffice. AI PDF Summary and Translate PDF send text to OpenAI, and the whole-PDF mode of Translate PDF, when offered, sends the file to Google Cloud Translation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use PDF Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Pick the tool for the job: page order (Merge, Split, Organize), content (Editor, Watermark, Sign), security (Protect, Unlock, Redact) or a conversion.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Check where the tool works before choosing a file: most page edits happen in your browser, Office and ebook conversions on our servers, PDF to Office conversions at ConvertAPI.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Type page numbers and ranges where asked, such as 1, 3, 5-7 in Delete Pages or 3, 1, 2 in Reorder Pages.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the PDF or the converted file; Split PDF can package its parts in a ZIP.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit on how much I can use the PDF tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, for some server tools. ConvertAPI conversions, AI PDF Summary and text translation share an hourly and daily allowance per connection and a monthly site budget. Whole-PDF translation, web-address HTML to PDF and iPhone and iPad fallbacks have their own counts, and our media service counts files over 4 MB. Other files of 4 MB or less sent to our LibreOffice, Chromium or pdf-tools service are not counted.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which PDF tools upload my file?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">These upload the file: the Office and HTML converters, Compress, Repair, PDF to PDF/A, Merge PDF's Office files and whole-PDF translation. EPUB, MOBI, Markdown and, for characters our fonts lack, Text to PDF send HTML built on the page; AI PDF Summary and text translation send extracted text. On iPhone and iPad, OCR sends the whole PDF to our pdf-tools service, and Redact, PDF to Image and PDF to JPG may send it there.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the largest PDF I can use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The maximum shown on each tool page, which depends on where the tool runs. For example, Compress PDF uses our server for files up to 200 MB, and Word and PowerPoint to PDF accept up to 100 MB.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Redact PDF really remove the text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes. Each page with a match is replaced by an image in which the matches are blacked out in the pixels, so the hidden words cannot be selected or copied; an invisible text layer keeps most of the other words searchable.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For a scanned PDF, run PDF OCR first; Extract Text and Compare PDF can then read its words.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Unlock PDF needs the open password when the file has one; a PDF with restrictions only is unlocked without a password.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For archiving, PDF to PDF/A delivers a file only when veraPDF validates it and its text is unchanged.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Sign PDF places an image of your signature; it does not add a certificate-based digital signature.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}