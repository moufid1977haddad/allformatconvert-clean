'use client';
import Link from 'next/link';

const categories = [
  {
    icon: 'PDF',
    color: 'text-red-400',
    title: 'PDF Tools',
    description: 'Merge, split, compress, and convert PDFs',
    href: '/tools/pdf-tools',
    tools: ['Merge PDF', 'Split PDF', 'Compress PDF'],
    count: 21,
  },
  {
    icon: 'IMG',
    color: 'text-pink-400',
    title: 'Image Tools',
    description: 'Convert, compress, and edit images',
    href: '/tools/image-tools',
    tools: ['Image Compressor', 'Image Converter', 'Image Resizer'],
    count: 36,
  },
  {
    icon: 'GIF',
    color: 'text-purple-500',
    title: 'GIF Tools',
    description: 'Convert videos and images to GIF format',
    href: '/tools/gif-tools',
    tools: ['Video to GIF', 'MP4 to GIF', 'GIF to MP4'],
    count: 9,
  },
  {
    icon: 'VID',
    color: 'text-blue-400',
    title: 'Media Tools',
    description: 'Convert, compress, and extract from videos',
    href: '/tools/media-tools',
    tools: ['Video to Audio', 'Video Compressor', 'Video Converter'],
    count: 28,
  },
  {
    icon: 'TXT',
    color: 'text-green-400',
    title: 'Text Tools',
    description: 'Word count, case conversion, text formatting',
    href: '/tools/text-tools',
    tools: ['Word Counter', 'Case Converter', 'Text Reverser'],
    count: 17,
  },
  {
    icon: 'ZIP',
    color: 'text-orange-400',
    title: 'File Tools',
    description: 'ZIP compression, file conversion, Base64',
    href: '/tools/file-tools',
    tools: ['ZIP Extractor', 'ZIP Creator', 'TAR Extractor'],
    count: 9,
  },
  {
    icon: 'QR',
    color: 'text-teal-400',
    title: 'QR & Barcodes Tools',
    description: 'Generate and scan QR codes and barcodes',
    href: '/tools/qr-barcodes-tools',
    tools: ['QR Generator', 'Barcode Generator', 'QR Scanner'],
    count: 3,
  },
  {
    icon: 'CNV',
    color: 'text-yellow-400',
    title: 'Converter Tools',
    description: 'Convert units, colors, and currencies',
    href: '/tools/converter-tools',
    tools: ['Currency Converter', 'Unit Converter', 'Color Converter'],
    count: 4,
  },
  {
    icon: 'DEV',
    color: 'text-purple-400',
    title: 'Developer Tools',
    description: 'JSON, Base64, URL encoding, and more',
    href: '/tools/developer-tools',
    tools: ['XML to JSON', 'JSON Formatter', 'Hash Generator'],
    count: 54,
  },
  {
    icon: 'MTH',
    color: 'text-indigo-400',
    title: 'Math Tools',
    description: 'Number conversion, percentage calculator',
    href: '/tools/math-tools',
    tools: ['Number Base Converter', 'Percentage Calculator', 'Roman Numeral Converter'],
    count: 6,
  },
  {
    icon: 'AI',
    color: 'text-cyan-400',
    title: 'AI Tools',
    description: 'AI-powered image and text tools',
    href: '/tools/ai-tools',
    tools: ['Background Remover', 'Image Upscaler', 'Grammar Fixer'],
    count: 16,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">All Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Everything you need in one place</p>
        <div className="flex flex-wrap gap-5 justify-center">
          {categories.map((cat) => (
            <Link key={cat.href} href={cat.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
              <div className="flex justify-between items-center w-full mb-3">
                <div className={`text-3xl ${cat.color}`}>{cat.icon}</div>
                <span className="text-xs text-neutral-400 bg-neutral-100 rounded-full px-2 py-1">{cat.count} tools</span>
              </div>
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{cat.title}</h2>
              <p className="text-neutral-500 text-sm mb-4">{cat.description}</p>
              <div className="space-y-1 w-full text-center">
                {cat.tools.map(tool => (
                  <div key={tool} className="text-neutral-500 text-xs flex items-center justify-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-neutral-500"></span>{tool}</div>
                ))}
                <div className="text-indigo-500 text-xs font-semibold mt-2">+{cat.count - cat.tools.length} more tools</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}