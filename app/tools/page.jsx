'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CategoryIcon } from '../lib/toolIcons';

const categories = [
  {
    color: 'text-red-500', title: 'PDF Tools',
    description: 'Merge, split, compress, and convert PDFs',
    href: '/tools/pdf-tools', tools: ['Merge PDF', 'Split PDF', 'Compress PDF'], count: 39,
  },
  {
    color: 'text-pink-500', title: 'Image Tools',
    description: 'Convert, compress, and edit images',
    href: '/tools/image-tools', tools: ['Image Compressor', 'Image Converter', 'Image Resizer'], count: 37,
  },
  {
    color: 'text-purple-500', title: 'GIF Tools',
    description: 'Convert videos and images to GIF format',
    href: '/tools/gif-tools', tools: ['Video to GIF', 'MP4 to GIF', 'GIF Maker'], count: 11,
  },
  {
    color: 'text-green-500', title: 'Text Tools',
    description: 'Word count, case conversion, text formatting',
    href: '/tools/text-tools', tools: ['Word Counter', 'Case Converter', 'Text Reverser'], count: 17,
  },
  {
    color: 'text-blue-500', title: 'Video Tools',
    description: 'Convert, compress, and edit videos',
    href: '/tools/video-tools', tools: ['Video Converter', 'Video Compressor', 'Video Trimmer'], count: 15,
  },
  {
    color: 'text-yellow-500', title: 'Audio Tools',
    description: 'Convert, compress, and edit audio files',
    href: '/tools/audio-tools', tools: ['Audio Converter', 'Audio Trimmer', 'Voice Recorder'], count: 11,
  },
  {
    color: 'text-orange-500', title: 'File Tools',
    description: 'ZIP compression, file conversion, Base64',
    href: '/tools/file-tools', tools: ['ZIP Extractor', 'ZIP Creator', 'TAR Extractor'], count: 9,
  },
  {
    color: 'text-teal-500', title: 'QR & Barcodes Tools',
    description: 'Generate and scan QR codes and barcodes',
    href: '/tools/qr-barcodes-tools', tools: ['QR Generator', 'Barcode Generator', 'QR Scanner'], count: 3,
  },
  {
    color: 'text-amber-500', title: 'Converter Tools',
    description: 'Convert units, colors, and currencies',
    href: '/tools/converter-tools', tools: ['Currency Converter', 'Unit Converter', 'Color Converter'], count: 4,
  },
  {
    color: 'text-violet-500', title: 'Developer Tools',
    description: 'JSON, Base64, URL encoding, and more',
    href: '/tools/developer-tools', tools: ['JSON Formatter', 'XML to JSON', 'Hash Generator'], count: 57,
  },
  {
    color: 'text-indigo-500', title: 'Math Tools',
    description: 'Number conversion, percentage calculator',
    href: '/tools/math-tools', tools: ['Scientific Calculator', 'Percentage Calculator', 'Fraction Calculator'], count: 6,
  },
  {
    color: 'text-cyan-500', title: 'AI Tools',
    description: 'AI-powered image and text tools',
    href: '/tools/ai-tools', tools: ['Background Remover', 'Image Upscaler', 'Grammar Fixer'], count: 16,
  },
];

export default function ToolsPage() {
  const [toolCounts, setToolCounts] = useState({});
  useEffect(() => {
    fetch('/api/tool-counts').then(r => r.json()).then(data => setToolCounts(data.counts || {})).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">All Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Everything you need in one place</p>
        <div className="flex flex-wrap gap-5 justify-center">
          {categories.map((cat) => {
            const count = toolCounts[cat.href.replace('/tools/', '')] || cat.count;
            return (
              <Link key={cat.href} href={cat.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <div className="flex justify-between items-center w-full mb-3">
                  <CategoryIcon slug={cat.href.replace('/tools/', '')} className={`w-8 h-8 ${cat.color}`} />
                  <span className="text-xs text-neutral-400 bg-neutral-100 rounded-full px-2 py-1">{count} tools</span>
                </div>
                <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{cat.title}</h2>
                <p className="text-neutral-500 text-sm mb-4">{cat.description}</p>
                <div className="space-y-1 w-full text-center">
                  {cat.tools.map(tool => (
                    <div key={tool} className="text-neutral-500 text-xs">• {tool}</div>
                  ))}
                  <div className="text-indigo-500 text-xs font-semibold mt-2">+{Math.max(0, count - cat.tools.length)} more tools</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
