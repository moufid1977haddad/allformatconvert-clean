'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'QR Generator', description: 'Static QR codes for links, Wi-Fi, vCards and more', href: '/tools/qr-barcodes-tools/qr-generator' },
  { title: 'QR Scanner', description: 'Read QR codes and barcodes by camera or image', href: '/tools/qr-barcodes-tools/qr-scanner' },
  { title: 'Barcode Generator', description: '37 barcode types, one by one or in batches', href: '/tools/qr-barcodes-tools/barcode-generator' },
];

export default function QrBarcodesToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="qr-barcodes-tools" className={`w-8 h-8 ${categoryColors['qr-barcodes-tools']}`} /> QR & Barcode Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Create and read QR codes and barcodes - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About QR & Barcode Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">QR Generator makes static QR codes for a link, text, email, phone number, SMS, Wi-Fi network, vCard 3.0 contact or location, with your colors, module shape and an optional logo, and reads the code back before you download it. Barcode Generator covers 37 types, from EAN-13, UPC and Code 128 to GS1 DataBar and 2D codes, one at a time or in batches. QR Scanner reads codes from your camera or from an image. All three work in your browser.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use QR & Barcode Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>To create a code, open QR Generator for links and contact data, or Barcode Generator for EAN, UPC, Code 128 and the other barcode types.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Fill in the content and set colors, size and error correction; colors with too little contrast are refused.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Download PNG, SVG or PDF; Barcode Generator also offers EPS, JPG and GIF, and a ZIP or a PDF sheet of labels for a batch.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>To read a code, open QR Scanner and allow the camera, or choose, drop or paste an image.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do the QR codes expire?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. They are static: the content is stored in the code itself, with no redirect through our site, so a code keeps working as long as the link or data in it is valid.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I track how many times my QR code is scanned?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. A static code has no tracking. To count scans, encode a link to a page whose visits you measure yourself.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many barcodes can I make at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">5,000 per ZIP or per PDF sheet of labels, from a typed list, a numbered series or a CSV or TSV file of up to 5 MB.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can QR Scanner read barcodes too?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, from an image: it finds up to 20 QR codes and barcodes in one picture. The live camera reads QR codes only.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>A logo hides part of the code, so QR Generator switches error correction to High when you add one.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For print, use the SVG or PDF download: both are vector files and stay sharp when enlarged.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Barcode Generator sets the print resolution from 72 to 2400 dpi; match it to your label printer.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If a printed code will not scan, take a photo of it and open it in QR Scanner to see what it reads.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}