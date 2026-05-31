'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const categories = [
  { href: '/tools/pdf-tools', label: 'PDF' },
  { href: '/tools/image-tools', label: 'Image' },
  { href: '/tools/gif-tools', label: 'GIF' },
  { href: '/tools/media-tools', label: 'Media' },
  { href: '/tools/text-tools', label: 'Text' },
  { href: '/tools/file-tools', label: 'File' },
  { href: '/tools/qr-barcodes-tools', label: 'QR & Barcodes' },
  { href: '/tools/converter-tools', label: 'Converter' },
  { href: '/tools/developer-tools', label: 'Developer' },
  { href: '/tools/math-tools', label: 'Math' },
  { href: '/tools/ai-tools', label: 'AI Tools' },
];

const allTools = [
  { name: 'Merge PDF', href: '/tools/pdf-tools/pdf-merge' },
  { name: 'Split PDF', href: '/tools/pdf-tools/pdf-split' },
  { name: 'Compress PDF', href: '/tools/pdf-tools/pdf-compress' },
  { name: 'PDF to Image', href: '/tools/pdf-tools/pdf-to-image' },
  { name: 'PDF to Word', href: '/tools/pdf-tools/pdf-to-word' },
  { name: 'Image Compressor', href: '/tools/image-tools/image-compressor' },
  { name: 'Image Converter', href: '/tools/image-tools/image-converter' },
  { name: 'Image Resizer', href: '/tools/image-tools/image-resizer' },
  { name: 'Background Remover', href: '/tools/ai-tools/background-remover' },
  { name: 'Image Upscaler', href: '/tools/ai-tools/image-upscaler' },
  { name: 'GIF Maker', href: '/tools/gif-tools/gif-maker' },
  { name: 'Video to GIF', href: '/tools/gif-tools/video-to-gif' },
  { name: 'Video Converter', href: '/tools/media-tools/video-converter' },
  { name: 'Video Compressor', href: '/tools/media-tools/video-compressor' },
  { name: 'Word Counter', href: '/tools/text-tools/word-counter' },
  { name: 'Case Converter', href: '/tools/text-tools/case-converter' },
  { name: 'Grammar Fixer', href: '/tools/ai-tools/grammar-fixer' },
  { name: 'AI Translator', href: '/tools/ai-tools/ai-translator' },
  { name: 'Text Summarizer', href: '/tools/ai-tools/text-summarizer' },
  { name: 'ZIP Extractor', href: '/tools/file-tools/zip-extractor' },
  { name: 'QR Generator', href: '/tools/qr-barcodes-tools/qr-generator' },
  { name: 'Currency Converter', href: '/tools/converter-tools/currency-converter' },
  { name: 'JSON Formatter', href: '/tools/developer-tools/json-formatter' },
  { name: 'Hash Generator', href: '/tools/developer-tools/hash-generator' },
  { name: 'AI Chatbot', href: '/tools/ai-tools/ai-chatbot' },
  { name: 'Email Generator', href: '/tools/ai-tools/email-generator' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length > 1) {
      setResults(allTools.filter(t => t.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
    } else {
      setResults([]);
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="w-full px-6 py-3 flex items-center">
        <Link href="/" className="text-lg font-bold text-indigo-600 tracking-tight w-48 shrink-0">
          AllFormatConvert
        </Link>
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`text-xs font-medium px-2 py-1 rounded-lg transition hover:bg-indigo-50 hover:text-indigo-600 ${
                pathname.startsWith(cat.href) ? 'text-indigo-600 bg-indigo-50' : 'text-neutral-600'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </nav>
        <div className="relative w-64 shrink-0">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search tools..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
          />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50">
              {results.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={() => { setSearch(''); setResults([]); }}
                  className="block px-4 py-2 text-sm text-neutral-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setDark(!dark)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition text-neutral-600"
            title="Toggle dark mode"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <Link href="/login" className="text-sm font-medium text-neutral-700 hover:text-indigo-600 transition px-2 py-1">
            Login
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
