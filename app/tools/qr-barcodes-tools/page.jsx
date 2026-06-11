'use client';
import Link from 'next/link';

const tools = [
  { icon: '📱', title: 'QR Generator', description: 'Generate QR codes instantly', href: '/tools/qr-barcodes-tools/qr-generator' },
  { icon: '🔍', title: 'QR Scanner', description: 'Scan and decode QR codes', href: '/tools/qr-barcodes-tools/qr-scanner' },
  { icon: '📊', title: 'Barcode Generator', description: 'Generate barcodes for products', href: '/tools/qr-barcodes-tools/barcode-generator' },
];

export default function QrBarcodesToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">📱 QR & Barcodes Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your QR and barcode tools in one place - {tools.length} tools</p>
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
