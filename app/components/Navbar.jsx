'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const categories = [
  { href: '/tools/pdf-tools', label: 'PDF' },
  { href: '/tools/image-tools', label: 'Image' },
  { href: '/tools/gif-tools', label: 'GIF' },
  { href: '/tools/audio-tools', label: 'Audio' },
  { href: '/tools/media-tools', label: 'Media' },
  { href: '/tools/text-tools', label: 'Text' },
  { href: '/tools/file-tools', label: 'File' },
  { href: '/tools/qr-barcodes-tools', label: 'QR' },
  { href: '/tools/converter-tools', label: 'Convert' },
  { href: '/tools/developer-tools', label: 'Dev' },
  { href: '/tools/math-tools', label: 'Math' },
  { href: '/tools/ai-tools', label: 'AI' },
];

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'zh-CN', label: 'Chinese', short: 'CN' },
  { code: 'ar', label: 'العربية', short: 'AR' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'pt', label: 'Português', short: 'PT' },
  { code: 'ja', label: 'Japanese', short: 'JP' },
  { code: 'ru', label: 'Russian', short: 'RU' },
  { code: 'it', label: 'Italiano', short: 'IT' },
  { code: 'ko', label: 'Korean', short: 'KO' },
  { code: 'hi', label: 'Hindi', short: 'HI' },
  { code: 'tr', label: 'Türkçe', short: 'TR' },
];

const allTools = [
  { name: 'Merge PDF', href: '/tools/pdf-tools/pdf-merge' },
  { name: 'Split PDF', href: '/tools/pdf-tools/pdf-split' },
  { name: 'Compress PDF', href: '/tools/pdf-tools/pdf-compress' },
  { name: 'PDF to Word', href: '/tools/pdf-tools/pdf-to-word' },
  { name: 'Image Compressor', href: '/tools/image-tools/image-compressor' },
  { name: 'Image Converter', href: '/tools/image-tools/image-converter' },
  { name: 'Image Resizer', href: '/tools/image-tools/image-resizer' },
  { name: 'Background Remover', href: '/tools/ai-tools/background-remover' },
  { name: 'GIF Maker', href: '/tools/gif-tools/gif-maker' },
  { name: 'Video Converter', href: '/tools/media-tools/video-converter' },
  { name: 'Audio Converter', href: '/tools/audio-tools/audio-converter' },
  { name: 'Voice Recorder', href: '/tools/audio-tools/voice-recorder' },
  { name: 'Word Counter', href: '/tools/text-tools/word-counter' },
  { name: 'Grammar Fixer', href: '/tools/ai-tools/grammar-fixer' },
  { name: 'AI Translator', href: '/tools/ai-tools/ai-translator' },
  { name: 'QR Generator', href: '/tools/qr-barcodes-tools/qr-generator' },
  { name: 'Currency Converter', href: '/tools/converter-tools/currency-converter' },
  { name: 'JSON Formatter', href: '/tools/developer-tools/json-formatter' },
  { name: 'AI Chatbot', href: '/tools/ai-tools/ai-chatbot' },
  { name: 'PDF Sign', href: '/tools/pdf-tools/pdf-sign' },
];

const tickerTools = [
  '📄 Merge PDF', '🖼️ Resize Image', '🎬 Convert Video', '🤖 Remove Background',
  '🎵 Trim Audio', '📊 Format JSON', '🔒 Encrypt PDF', '🎞️ Make GIF',
  '📝 Count Words', '🔄 Convert Units', '💻 Encode Base64', '📱 Generate QR Code',
  '🗜️ Compress Files', '🎨 Convert Colors', '🔊 Extract Audio', '✨ Fix Grammar',
];

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const langRef = useRef(null);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length > 1) {
      setResults(allTools.filter(t => t.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
    } else {
      setResults([]);
    }
  };

  const changeLanguage = (lang) => {
    setCurrentLang(lang);
    setLangOpen(false);
    document.documentElement.dir = lang.code === 'ar' ? 'rtl' : 'ltr';
    const tryTranslate = (attempts) => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = lang.code;
        select.dispatchEvent(new Event('change'));
      } else if (attempts > 0) {
        setTimeout(() => tryTranslate(attempts - 1), 500);
      }
    };
    tryTranslate(10);
  };

  const doubled = [...tickerTools, ...tickerTools];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 28s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">

        {/* ── Main navbar ── */}
        <div className="w-full px-4 py-2 flex items-center gap-2" style={{ minHeight: '52px' }}>

          {/* Logo */}
          <div className="shrink-0" style={{ width: '140px' }}>
            <Link href="/" className="text-base font-bold text-indigo-600 tracking-tight notranslate">
              AllFormatConvert
            </Link>
          </div>

          {/* Categories */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-0.5 overflow-hidden">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`text-xs font-medium px-1.5 py-1 rounded-lg transition hover:bg-indigo-50 hover:text-indigo-600 whitespace-nowrap ${
                  pathname.startsWith(cat.href) ? 'text-indigo-600 bg-indigo-50' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="shrink-0 flex items-center gap-1.5" style={{ width: '320px', justifyContent: 'flex-end' }}>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search tools..."
                className="w-36 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-indigo-400 dark:text-white"
              />
              {results.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-50">
                  {results.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => { setSearch(''); setResults([]); }}
                      className="block px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      {r.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative notranslate" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-700 dark:text-neutral-200 text-xs font-bold"
              >
                <span>{currentLang.short}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-indigo-50 hover:text-indigo-600 transition text-left ${currentLang.code === lang.code ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-neutral-700 dark:text-neutral-200'}`}
                    >
                      <span className="font-bold w-5">{lang.short}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button
              onClick={() => setDark(!dark)}
              className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-300 shrink-0"
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

            {/* Sign In */}
            <Link href="/signin" className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 transition whitespace-nowrap">
              Sign In
            </Link>

            {/* Sign Up */}
            <Link href="/signup" className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg transition whitespace-nowrap">
              Sign Up
            </Link>

          </div>
        </div>

        {/* ── Ticker strip — juste sous la navbar ── */}
        <div style={{
          background: '#eef2ff',
          padding: '7px 0',
          overflow: 'hidden',
          borderTop: '1px solid #e0e7ff',
        }}>
          <div className="ticker-track">
            {doubled.map((tool, i) => (
              <span key={i} style={{
                whiteSpace: 'nowrap',
                padding: '0 24px',
                fontSize: '12px',
                color: '#4338ca',
                fontWeight: '500',
                borderRight: '1px solid #c7d2fe',
              }}>
                {tool}
              </span>
            ))}
          </div>
        </div>

      </header>
    </>
  );
}
