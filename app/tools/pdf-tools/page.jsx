'use client';
import Link from 'next/link';

const tools = [
  { icon: '🔗', title: 'Merge PDF', description: 'Combine multiple PDFs into one', href: '/tools/pdf-tools/pdf-merge' },
  { icon: '✂️', title: 'Split PDF', description: 'Extract specific pages from PDF', href: '/tools/pdf-tools/pdf-split' },
  { icon: '📦', title: 'Compress PDF', description: 'Reduce PDF file size', href: '/tools/pdf-tools/pdf-compress' },
  { icon: '🔒', title: 'Protect PDF', description: 'Encrypt PDF with password', href: '/tools/pdf-tools/pdf-protect' },
  { icon: '🔓', title: 'Unlock PDF', description: 'Remove password from PDF', href: '/tools/pdf-tools/pdf-unlock' },
  { icon: '🔄', title: 'Rotate PDF', description: 'Rotate pages 90, 180, 270', href: '/tools/pdf-tools/pdf-rotate' },
  { icon: '💧', title: 'Watermark PDF', description: 'Add text watermark to PDF', href: '/tools/pdf-tools/pdf-watermark' },
  { icon: '🖼️', title: 'Image to PDF', description: 'Convert images to PDF', href: '/tools/pdf-tools/image-to-pdf' },
  { icon: '📷', title: 'PDF to Image', description: 'Convert PDF pages to images', href: '/tools/pdf-tools/pdf-to-image' },
  { icon: '📷', title: 'PDF to JPG', description: 'Convert PDF pages to JPG', href: '/tools/pdf-tools/pdf-to-jpg' },
  { icon: '📸', title: 'JPG to PDF', description: 'Convert JPG images to PDF', href: '/tools/pdf-tools/jpg-to-pdf' },
  { icon: '📝', title: 'Word to PDF', description: 'Convert DOCX to PDF', href: '/tools/pdf-tools/word-to-pdf' },
  { icon: '📎', title: 'PDF to Word', description: 'Convert PDF to DOCX', href: '/tools/pdf-tools/pdf-to-word' },
  { icon: '📊', title: 'Excel to PDF', description: 'Convert XLSX to PDF', href: '/tools/pdf-tools/excel-to-pdf' },
  { icon: '📊', title: 'PDF to Excel', description: 'Convert PDF tables to Excel', href: '/tools/pdf-tools/pdf-to-excel' },
  { icon: '📤', title: 'PDF to PPT', description: 'Convert PDF to PowerPoint', href: '/tools/pdf-tools/pdf-to-ppt' },
  { icon: '📥', title: 'PPT to PDF', description: 'Convert PowerPoint to PDF', href: '/tools/pdf-tools/ppt-to-pdf' },
  { icon: '🌐', title: 'HTML to PDF', description: 'Convert HTML to PDF', href: '/tools/pdf-tools/html-to-pdf' },
  { icon: '📄', title: 'Text to PDF', description: 'Convert plain text to PDF', href: '/tools/pdf-tools/text-to-pdf' },
  { icon: '📋', title: 'Markdown to PDF', description: 'Convert Markdown to PDF', href: '/tools/pdf-tools/markdown-to-pdf' },
  { icon: '📚', title: 'EPUB to PDF', description: 'Convert EPUB ebooks to PDF', href: '/tools/pdf-tools/epub-to-pdf' },
  { icon: '📱', title: 'MOBI to PDF', description: 'Convert MOBI ebooks to PDF', href: '/tools/pdf-tools/mobi-to-pdf' },
  { icon: '🌐', title: 'PDF to HTML', description: 'Convert PDF to HTML file', href: '/tools/pdf-tools/pdf-to-html' },
  { icon: '🗑️', title: 'Delete Pages', description: 'Remove specific pages from PDF', href: '/tools/pdf-tools/pdf-delete-pages' },
  { icon: '🔀', title: 'Reorder Pages', description: 'Change the order of PDF pages', href: '/tools/pdf-tools/pdf-reorder-pages' },
  { icon: '📂', title: 'Organize PDF', description: 'Reorder and remove PDF pages', href: '/tools/pdf-tools/pdf-organize' },
  { icon: '📃', title: 'Extract Text', description: 'Extract all text from PDF', href: '/tools/pdf-tools/pdf-extract-text' },
  { icon: '🔢', title: 'Number Pages', description: 'Add page numbers to PDF', href: '/tools/pdf-tools/pdf-number-pages' },
  { icon: '✏️', title: 'PDF Editor', description: 'Edit text and images in PDF', href: '/tools/pdf-tools/pdf-editor' },
  { icon: '✍️', title: 'Sign PDF', description: 'Add electronic signature to PDF', href: '/tools/pdf-tools/pdf-sign' },
  { icon: '🔍', title: 'PDF OCR', description: 'Make scanned PDFs searchable', href: '/tools/pdf-tools/pdf-ocr' },
  { icon: '📋', title: 'PDF Forms', description: 'Fill and create PDF forms', href: '/tools/pdf-tools/pdf-forms' },
  { icon: '⬛', title: 'Redact PDF', description: 'Censor sensitive text in PDF', href: '/tools/pdf-tools/pdf-redact' },
  { icon: '✂️', title: 'Crop PDF', description: 'Crop and resize PDF pages', href: '/tools/pdf-tools/pdf-crop' },
  { icon: '📐', title: 'Compare PDF', description: 'Compare two PDF documents', href: '/tools/pdf-tools/pdf-compare' },
  { icon: '📁', title: 'PDF to PDF/A', description: 'Convert PDF for archiving', href: '/tools/pdf-tools/pdf-to-pdfa' },
  { icon: '🔧', title: 'Repair PDF', description: 'Fix corrupted PDF files', href: '/tools/pdf-tools/pdf-repair' },
  { icon: '🤖', title: 'AI PDF Summary', description: 'Summarize PDF with AI', href: '/tools/pdf-tools/pdf-ai-summary' },
  { icon: '🌐', title: 'Translate PDF', description: 'Translate PDF to any language', href: '/tools/pdf-tools/pdf-translate' },
];

export default function PdfToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">PDF Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your PDF tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
