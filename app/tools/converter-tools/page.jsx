'use client';
import Link from 'next/link';

const tools = [
  { icon: '💱', title: 'Currency Converter', description: 'Convert between world currencies', href: '/tools/converter-tools/currency-converter' },
  { icon: '📏', title: 'Unit Converter', description: 'Convert length, weight, temperature', href: '/tools/converter-tools/unit-converter' },
  { icon: '🎨', title: 'Color Converter', description: 'Convert HEX, RGB, HSL colors', href: '/tools/converter-tools/color-converter' },
  { icon: '📚', title: 'MOBI to EPUB', description: 'Convert MOBI ebooks to EPUB', href: '/tools/converter-tools/mobi-to-epub' },
];

export default function ConverterToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🔄 Converter Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your converter tools in one place - {tools.length} tools</p>
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
