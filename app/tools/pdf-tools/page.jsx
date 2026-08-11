'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Merge PDF', description: 'Combine multiple PDFs into one', href: '/tools/pdf-tools/pdf-merge', group: 'Organize' },
  { title: 'Split PDF', description: 'Extract specific pages from PDF', href: '/tools/pdf-tools/pdf-split', group: 'Organize' },
  { title: 'Compress PDF', description: 'Reduce PDF file size', href: '/tools/pdf-tools/pdf-compress', group: 'Optimize' },
  { title: 'Protect PDF', description: 'Encrypt PDF with password', href: '/tools/pdf-tools/pdf-protect', group: 'Security' },
  { title: 'Unlock PDF', description: 'Remove password from PDF', href: '/tools/pdf-tools/pdf-unlock', group: 'Security' },
  { title: 'Rotate PDF', description: 'Rotate pages 90, 180, 270', href: '/tools/pdf-tools/pdf-rotate', group: 'Edit' },
  { title: 'Watermark PDF', description: 'Add text watermark to PDF', href: '/tools/pdf-tools/pdf-watermark', group: 'Edit' },
  { title: 'Image to PDF', description: 'Convert images to PDF', href: '/tools/pdf-tools/image-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to Image', description: 'Convert PDF pages to images', href: '/tools/pdf-tools/pdf-to-image', group: 'Convert from PDF' },
  { title: 'PDF to JPG', description: 'Convert PDF pages to JPG', href: '/tools/pdf-tools/pdf-to-jpg', group: 'Convert from PDF' },
  { title: 'JPG to PDF', description: 'Convert JPG images to PDF', href: '/tools/pdf-tools/jpg-to-pdf', group: 'Convert to PDF' },
  { title: 'Word to PDF', description: 'Convert DOCX to PDF', href: '/tools/pdf-tools/word-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to Word', description: 'Convert PDF to DOCX', href: '/tools/pdf-tools/pdf-to-word', group: 'Convert from PDF' },
  { title: 'Excel to PDF', description: 'Convert XLSX to PDF', href: '/tools/pdf-tools/excel-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to Excel', description: 'Convert PDF tables to Excel', href: '/tools/pdf-tools/pdf-to-excel', group: 'Convert from PDF' },
  { title: 'PDF to PPT', description: 'Convert PDF to PowerPoint', href: '/tools/pdf-tools/pdf-to-ppt', group: 'Convert from PDF' },
  { title: 'PPT to PDF', description: 'Convert PowerPoint to PDF', href: '/tools/pdf-tools/ppt-to-pdf', group: 'Convert to PDF' },
  { title: 'HTML to PDF', description: 'Convert HTML to PDF', href: '/tools/pdf-tools/html-to-pdf', group: 'Convert to PDF' },
  { title: 'Text to PDF', description: 'Convert plain text to PDF', href: '/tools/pdf-tools/text-to-pdf', group: 'Convert to PDF' },
  { title: 'Markdown to PDF', description: 'Convert Markdown to PDF', href: '/tools/pdf-tools/markdown-to-pdf', group: 'Convert to PDF' },
  { title: 'EPUB to PDF', description: 'Convert EPUB ebooks to PDF', href: '/tools/pdf-tools/epub-to-pdf', group: 'Convert to PDF' },
  { title: 'MOBI to PDF', description: 'Convert MOBI ebooks to PDF', href: '/tools/pdf-tools/mobi-to-pdf', group: 'Convert to PDF' },
  { title: 'PDF to HTML', description: 'Convert PDF to HTML file', href: '/tools/pdf-tools/pdf-to-html', group: 'Convert from PDF' },
  { title: 'Delete Pages', description: 'Remove specific pages from PDF', href: '/tools/pdf-tools/pdf-delete-pages', group: 'Organize' },
  { title: 'Reorder Pages', description: 'Change the order of PDF pages', href: '/tools/pdf-tools/pdf-reorder-pages', group: 'Organize' },
  { title: 'Organize PDF', description: 'Reorder and remove PDF pages', href: '/tools/pdf-tools/pdf-organize', group: 'Organize' },
  { title: 'Extract Text', description: 'Extract all text from PDF', href: '/tools/pdf-tools/pdf-extract-text', group: 'Optimize' },
  { title: 'Number Pages', description: 'Add page numbers to PDF', href: '/tools/pdf-tools/pdf-number-pages', group: 'Edit' },
  { title: 'PDF Editor', description: 'Edit text and images in PDF', href: '/tools/pdf-tools/pdf-editor', group: 'Edit' },
  { title: 'Sign PDF', description: 'Add electronic signature to PDF', href: '/tools/pdf-tools/pdf-sign', group: 'Security' },
  { title: 'PDF OCR', description: 'Make scanned PDFs searchable', href: '/tools/pdf-tools/pdf-ocr', group: 'Optimize' },
  { title: 'PDF Forms', description: 'Fill and create PDF forms', href: '/tools/pdf-tools/pdf-forms', group: 'Edit' },
  { title: 'Redact PDF', description: 'Censor sensitive text in PDF', href: '/tools/pdf-tools/pdf-redact', group: 'Security' },
  { title: 'Crop PDF', description: 'Crop and resize PDF pages', href: '/tools/pdf-tools/pdf-crop', group: 'Edit' },
  { title: 'Compare PDF', description: 'Compare two PDF documents', href: '/tools/pdf-tools/pdf-compare', group: 'Security' },
  { title: 'PDF to PDF/A', description: 'Convert PDF for archiving', href: '/tools/pdf-tools/pdf-to-pdfa', group: 'Convert from PDF' },
  { title: 'Repair PDF', description: 'Fix corrupted PDF files', href: '/tools/pdf-tools/pdf-repair', group: 'Optimize' },
  { title: 'AI PDF Summary', description: 'Summarize PDF with AI', href: '/tools/pdf-tools/pdf-ai-summary', group: 'AI & Content' },
  { title: 'Translate PDF', description: 'Translate PDF to any language', href: '/tools/pdf-tools/pdf-translate', group: 'AI & Content' },
];

export default function PdfToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800 flex items-center justify-center gap-2"><CategoryIcon slug="pdf-tools" className="w-8 h-8 text-red-500" /> PDF Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your PDF tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Tools is a free online platform that allows users to edit, convert, merge, and manipulate PDF files without requiring software installation or paid subscriptions. Whether you need to compress, split, rotate, or watermark PDFs, this comprehensive toolkit handles all your document management needs instantly in your browser.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Tools website and select the specific tool you need from the menu options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your PDF file by clicking the upload button or dragging and dropping it into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Configure your preferences such as output format, quality settings, or specific actions like page ranges</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the process button and download your converted or edited file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Tools really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Tools is completely free with no hidden charges, registration requirements, or premium tier needed for basic functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are my uploaded files secure and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Tools processes files securely on encrypted servers and automatically deletes uploaded files after processing to protect your privacy.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does PDF Tools have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Tools supports files up to 100MB, making it suitable for most standard documents, presentations, and image collections.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use PDF Tools on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Tools is fully responsive and works on smartphones, tablets, and desktop browsers without requiring any app installation.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch process multiple PDF files by uploading them sequentially to save time on repetitive editing tasks</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress large PDF files before sharing via email to reduce file size while maintaining acceptable quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the merge tool to combine multiple PDFs into a single document for easier organization and sharing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Add watermarks or password protection to sensitive PDFs to maintain security and prevent unauthorized distribution</li>
          </ul>
        </div>
      </div>
    </div>
  );
}