'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors } from '../../lib/toolIcons';

const tools = [
  { title: 'QR Generator', description: 'Generate QR codes instantly', href: '/tools/qr-barcodes-tools/qr-generator' },
  { title: 'QR Scanner', description: 'Scan and decode QR codes', href: '/tools/qr-barcodes-tools/qr-scanner' },
  { title: 'Barcode Generator', description: 'Generate barcodes for products', href: '/tools/qr-barcodes-tools/barcode-generator' },
];

export default function QrBarcodesToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="qr-barcodes-tools" className="w-8 h-8 text-teal-500" /> QR & Barcodes Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your QR and barcode tools in one place - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Qr Barcodes Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">QR Barcodes Tools is a free online platform that allows you to generate, decode, and manage QR codes and barcodes instantly without any software installation. Perfect for businesses, marketers, and individuals who need to create scannable codes for URLs, text, contact information, and more.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Qr Barcodes Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the QR Barcodes Tools website and select whether you want to generate or decode a QR code or barcode</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter the information you want to encode, such as a URL, text, phone number, or email address into the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize your QR code with colors, size, and error correction level if desired</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the generate button and download your QR code in PNG, SVG, or PDF format for immediate use</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is QR Barcodes Tools completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, QR Barcodes Tools is completely free with no hidden charges, registration requirements, or premium features locked behind paywalls.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of data can I encode into a QR code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can encode URLs, plain text, email addresses, phone numbers, SMS messages, WiFi credentials, contact information (vCard), and calendar events.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I track scans of my generated QR codes?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The basic version provides static QR codes without tracking, but advanced features may include analytics in future updates.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats are available for download?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Generated QR codes can be downloaded in PNG, SVG, and PDF formats, ensuring compatibility with various printing and digital applications.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use high contrast colors like black on white for better scanability and faster recognition by mobile devices</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your QR code with multiple devices and QR code scanner apps before distributing to ensure it works correctly</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Add a logo or image to the center of your QR code to maintain brand identity while keeping it scannable with appropriate error correction</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use smaller QR codes for digital displays and larger ones for print materials to ensure they're easily scannable from the intended distance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}