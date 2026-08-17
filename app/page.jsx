'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Sparkles, Rocket, Bot, Globe, Zap, Lock, DollarSign, ShieldCheck, Smartphone,
  Wrench, LayoutGrid, Languages, Laptop, ArrowUpRight, UploadCloud, X, Search,
} from 'lucide-react';
import { CategoryIcon, ToolIcon, categoryColors, toolBgColors } from './lib/toolIcons';
import { ALL_TOOLS, getSuggestions } from './lib/toolsRegistry';

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const categories = [
  { title: 'PDF Tools',        description: 'Merge, split, compress, and convert PDFs',        href: '/tools/pdf-tools',           slug: 'pdf-tools',           tools: ['Merge PDF', 'Split PDF', 'Compress PDF'],                                    count: 39 },
  { title: 'Image Tools',      description: 'Convert, compress, and edit images',               href: '/tools/image-tools',         slug: 'image-tools',         tools: ['Image Compressor', 'Image Converter', 'Image Resizer'],                      count: 37 },
  { title: 'GIF Tools',        description: 'Convert videos and images to GIF format',          href: '/tools/gif-tools',           slug: 'gif-tools',           tools: ['Video to GIF', 'MP4 to GIF', 'GIF Maker'],                                   count: 11 },
  { title: 'Text Tools',       description: 'Word count, case conversion, text formatting',     href: '/tools/text-tools',          slug: 'text-tools',          tools: ['Word Counter', 'Case Converter', 'Text Reverser'],                            count: 17 },
  { title: 'Audio Tools',      description: 'Convert, compress, and edit audio files',          href: '/tools/audio-tools',         slug: 'audio-tools',         tools: ['Audio Converter', 'Audio Trimmer', 'Voice Recorder'],                        count: 11 },
  { title: 'Video Tools',      description: 'Convert, compress, and edit videos',               href: '/tools/video-tools',         slug: 'video-tools',         tools: ['Video Converter', 'Video Compressor', 'Video Trimmer'],                      count: 15 },
  { title: 'File Tools',       description: 'ZIP compression, file conversion, Base64',         href: '/tools/file-tools',          slug: 'file-tools',          tools: ['ZIP Extractor', 'ZIP Creator', 'TAR Extractor'],                              count: 9  },
  { title: 'QR & Barcodes',   description: 'Generate and scan QR codes and barcodes',          href: '/tools/qr-barcodes-tools',   slug: 'qr-barcodes-tools',   tools: ['QR Generator', 'Barcode Generator', 'QR Scanner'],                           count: 3  },
  { title: 'Converter Tools',  description: 'Convert units, colors, and currencies',            href: '/tools/converter-tools',     slug: 'converter-tools',     tools: ['Currency Converter', 'Unit Converter', 'Color Converter'],                    count: 4  },
  { title: 'Developer Tools',  description: 'JSON, Base64, URL encoding, and more',             href: '/tools/developer-tools',     slug: 'developer-tools',     tools: ['JSON Formatter', 'XML to JSON', 'Hash Generator'],                           count: 57 },
  { title: 'Math Tools',       description: 'Number conversion, percentage calculator',         href: '/tools/math-tools',          slug: 'math-tools',          tools: ['Number Base Converter', 'Percentage Calculator', 'Roman Numeral Converter'],  count: 6  },
  { title: 'AI Tools',         description: 'AI-powered image and text tools',                  href: '/tools/ai-tools',            slug: 'ai-tools',            tools: ['Background Remover', 'Image Upscaler', 'Grammar Fixer'],                     count: 16 },
];

const DEFAULT_TOOL_COUNT = 225;

function buildStats(totalTools) {
  return [
    { value: totalTools, label: 'Free Tools', suffix: '+', icon: Wrench },
    { value: 12,  label: 'Categories',  suffix: '',  icon: LayoutGrid },
    { value: 13,  label: 'Languages',   suffix: '',  icon: Languages },
    { value: 190, label: 'Countries',   suffix: '+', icon: Globe },
  ];
}

const badges = [
  { icon: Zap, text: 'No signup required' },
  { icon: Smartphone, text: 'Works on all devices' },
];

// Backgrounds/borders/icon shades for the hero floating cards, one hue per
// Tailwind color family. The hue-per-category assignment itself always comes
// from the shared `categoryColors` map (app/lib/toolIcons.js) via `hueOf()` —
// this table only supplies the hex shades inline styles need, it never
// re-decides which color belongs to which category.
const huePalette = {
  red:    { light100:'#fee2e2', light300:'#fca5a5', light500:'#ef4444', dark950:'#450a0a', dark800:'#991b1b', dark400:'#f87171' },
  pink:   { light100:'#fce7f3', light300:'#f9a8d4', light500:'#ec4899', dark950:'#500724', dark800:'#9d174d', dark400:'#f472b6' },
  purple: { light100:'#f3e8ff', light300:'#d8b4fe', light500:'#a855f7', dark950:'#3b0764', dark800:'#6b21a8', dark400:'#c084fc' },
  green:  { light100:'#dcfce7', light300:'#86efac', light500:'#22c55e', dark950:'#052e16', dark800:'#166534', dark400:'#4ade80' },
  yellow: { light100:'#fef9c3', light300:'#fde047', light500:'#eab308', dark950:'#422006', dark800:'#854d0e', dark400:'#facc15' },
  blue:   { light100:'#dbeafe', light300:'#93c5fd', light500:'#3b82f6', dark950:'#172554', dark800:'#1e40af', dark400:'#60a5fa' },
  orange: { light100:'#ffedd5', light300:'#fdba74', light500:'#f97316', dark950:'#431407', dark800:'#9a3412', dark400:'#fb923c' },
  teal:   { light100:'#ccfbf1', light300:'#5eead4', light500:'#14b8a6', dark950:'#042f2e', dark800:'#115e59', dark400:'#2dd4bf' },
  amber:  { light100:'#fef3c7', light300:'#fcd34d', light500:'#f59e0b', dark950:'#451a03', dark800:'#92400e', dark400:'#fbbf24' },
  violet: { light100:'#ede9fe', light300:'#c4b5fd', light500:'#8b5cf6', dark950:'#2e1065', dark800:'#5b21b6', dark400:'#a78bfa' },
  indigo: { light100:'#e0e7ff', light300:'#a5b4fc', light500:'#6366f1', dark950:'#1e1b4b', dark800:'#3730a3', dark400:'#818cf8' },
  cyan:   { light100:'#cffafe', light300:'#67e8f9', light500:'#06b6d4', dark950:'#083344', dark800:'#155e75', dark400:'#22d3ee' },
};

function hueOf(slug) {
  const match = (categoryColors[slug] || '').match(/text-(\w+)-\d+/);
  return match ? match[1] : 'indigo';
}

// Card background/border, muted a notch in dark mode: dark950/dark800 are
// Tailwind's most *saturated* dark shades (not desaturated — higher numbers
// mean darker AND more vivid), so blending them toward the site's neutral
// card color (#1c1c1e) is what actually tones them down toward the light
// mode's soft-pastel feel while keeping each hue clearly distinct.
function cardBg(pal, dark) {
  return dark ? `color-mix(in srgb, ${pal.dark950} 45%, #1c1c1e)` : pal.light100;
}
function cardBorder(pal, dark) {
  return dark ? `1.5px solid color-mix(in srgb, ${pal.dark800} 60%, #1c1c1e)` : `1.5px solid ${pal.light300}`;
}

// Same links as the Footer's "Popular Tools" column plus one addition
// (Video to GIF), reused here instead of inventing a separate shortlist.
const popularTools = [
  { label: 'Merge PDF',           href: '/tools/pdf-tools/pdf-merge' },
  { label: 'Image Compressor',    href: '/tools/image-tools/image-compressor' },
  { label: 'Background Remover',  href: '/tools/ai-tools/background-remover' },
  { label: 'Grammar Fixer',       href: '/tools/ai-tools/grammar-fixer' },
  { label: 'QR Generator',        href: '/tools/qr-barcodes-tools/qr-generator' },
  { label: 'Video to GIF',        href: '/tools/gif-tools/video-to-gif' },
];

function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, label, suffix, icon: Icon, animate, dark }) {
  const count = useCountUp(value, 1600, animate);
  return (
    <div style={{ background: dark ? '#1c1c1e' : '#ffffff', border: dark ? '1px solid #2c2c2e' : '1px solid #e2e8f0', borderRadius:'16px', padding:'20px 24px', textAlign:'center' }}>
      <Icon size={28} strokeWidth={2} style={{ marginBottom:'6px', color:'#6366f1' }} />
      <div style={{ fontSize:'32px', fontWeight:'800', color: dark ? '#f1f5f9' : '#0f172a', lineHeight:1 }}>{animate ? count : value}{suffix}</div>
      <div style={{ fontSize:'12px', color: dark ? '#94a3b8' : '#64748b', marginTop:'4px', letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</div>
    </div>
  );
}

// Hero drop zone: detects a dropped/chosen file's extension client-side (reads
// only `file.name`, never the file's bytes, and never sends anything over the
// network) and surfaces up to 5 real tool suggestions from app/lib/toolsRegistry.
function FileDropZone({ dark, toolCounts }) {
  const [phase, setPhase] = useState('idle'); // idle | result | unrecognized
  const [suggestions, setSuggestions] = useState(null);
  const [rawExt, setRawExt] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    const result = getSuggestions(file.name);
    if (result) {
      setSuggestions(result);
      setPhase('result');
    } else {
      const m = /\.([a-zA-Z0-9]+)$/.exec(file.name || '');
      setRawExt(m ? m[1].toLowerCase() : '');
      setPhase('unrecognized');
    }
  };

  const reset = () => {
    setPhase('idle');
    setSuggestions(null);
    setQuery('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const searchResults = query.trim().length > 1
    ? ALL_TOOLS.filter(t => t.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  const count = suggestions ? (toolCounts.counts?.[suggestions.category] || suggestions.fallbackCount) : 0;

  const border = dragOver
    ? (dark ? '#5aa6f2' : '#185fa5')
    : (dark ? '#3b6ea8' : '#6fa8dc');
  const panelBg = dark
    ? 'linear-gradient(180deg, #141c28 0%, #1a2333 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)';

  return (
    <div
      className="dropzone"
      onDragOver={(e) => { e.preventDefault(); if (phase === 'idle') setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (phase !== 'idle') return;
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        processFile(file);
      }}
      style={{
        border: `3px dashed ${border}`,
        background: panelBg,
        borderRadius: '28px',
        padding: '40px 28px',
        textAlign: 'center',
        position: 'relative',
        transition: 'border-color 0.2s ease',
        minHeight: '400px',
        boxShadow: dark ? '0 16px 40px rgba(0,0,0,0.45)' : '0 16px 40px rgba(24,95,165,0.14)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => processFile(e.target.files && e.target.files[0])}
        style={{ display: 'none' }}
      />

      {phase === 'idle' && (
        <div>
          <div className="dropzone-upload-badge" style={{ background: dark ? 'rgba(56,138,221,0.18)' : '#dbeafe' }}>
            <UploadCloud size={32} style={{ color: dark ? '#85b7eb' : '#185fa5' }} />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="dropzone-choose-btn"
            style={{ background: dark ? '#378add' : '#185fa5' }}
          >
            Choose a file
          </button>
          <p style={{ fontSize: '14px', color: dark ? '#94a3b8' : '#475569', marginTop: '18px', marginBottom: '8px' }}>
            or drop it here — we&apos;ll suggest the right tool for it
          </p>
          <p style={{ fontSize: '11px', color: dark ? '#64748b' : '#94a3b8', marginBottom: '18px' }}>
            We only read the file type. Your file stays on your device.
          </p>
          <div className="format-pills">
            {['PDF', 'JPG', 'PNG', 'DOCX', 'MP4', 'MP3', 'GIF', 'ZIP'].map((f) => (
              <span
                key={f}
                className="format-pill"
                style={{ background: dark ? '#1c1c1e' : '#ffffff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', color: dark ? '#94a3b8' : '#64748b' }}
              >
                {f}
              </span>
            ))}
            <span
              className="format-pill"
              style={{ background: dark ? '#1c1c1e' : '#ffffff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', color: dark ? '#64748b' : '#94a3b8' }}
            >
              + 40 more
            </span>
          </div>
        </div>
      )}

      {phase === 'result' && suggestions && (
        <div style={{ textAlign: 'left' }}>
          <button type="button" onClick={reset} aria-label="Close" className="dropzone-close" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
            <X size={18} />
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: dark ? '#f1f5f9' : '#0f172a', marginBottom: '14px', paddingRight: '28px' }}>
            {suggestions.ext.toUpperCase()} file detected — what would you like to do?
          </h3>
          <div className="suggestion-grid">
            {suggestions.tools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="suggestion-card"
                style={{ background: dark ? '#1c1c1e' : '#ffffff', border: dark ? '1px solid #2c2c2e' : '1px solid #e2e8f0' }}
              >
                <span className={`icon-badge ${toolBgColors[t.href] || 'bg-neutral-400'}`}>
                  <ToolIcon slug={t.href.split('/').pop()} className="w-4 h-4 text-white" />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="s-name" style={{ display: 'block', color: dark ? '#f1f5f9' : '#0f172a' }}>{t.name}</span>
                  <span className="s-note" style={{ display: 'block', color: dark ? '#94a3b8' : '#64748b' }}>{t.note}</span>
                </span>
              </Link>
            ))}
          </div>
          <Link href={suggestions.categoryHref} style={{ fontSize: '13px', fontWeight: '700', color: dark ? '#85b7eb' : '#185fa5', textDecoration: 'none' }}>
            See all {count} {suggestions.categoryLabel} tools →
          </Link>
        </div>
      )}

      {phase === 'unrecognized' && (
        <div style={{ textAlign: 'left' }}>
          <button type="button" onClick={reset} aria-label="Close" className="dropzone-close" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
            <X size={18} />
          </button>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: dark ? '#f1f5f9' : '#0f172a', marginBottom: '10px', paddingRight: '28px' }}>
            {rawExt ? `We don't recognize ".${rawExt}" files yet.` : "We couldn't detect this file's type."}
          </h3>
          <p style={{ fontSize: '13px', color: dark ? '#94a3b8' : '#64748b', marginBottom: '12px' }}>
            Search our {ALL_TOOLS.length}+ tools instead:
          </p>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: dark ? '#64748b' : '#94a3b8' }} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', borderRadius: '10px',
                border: dark ? '1px solid #334155' : '1px solid #cbd5e1', background: dark ? '#111111' : '#ffffff',
                color: dark ? '#f1f5f9' : '#0f172a', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '160px', overflowY: 'auto' }}>
              {searchResults.map((r) => (
                <Link key={r.href} href={r.href} className="search-result-row" style={{ color: dark ? '#e2e8f0' : '#1e293b' }}>
                  {r.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const dark = useDarkMode();
  const [statsVisible, setStatsVisible] = useState(false);
  const [toolCounts, setToolCounts] = useState({ counts: {}, total: DEFAULT_TOOL_COUNT });
  useEffect(() => {
    fetch('/api/tool-counts').then(r => r.json()).then(data => setToolCounts(data)).catch(() => {});
  }, []);
  const totalTools = toolCounts.total || DEFAULT_TOOL_COUNT;
  const stats = buildStats(totalTools);
  const statsRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black">

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        .badge-pill:hover  { background: #e2e8f0 !important; }

        /* ── DESKTOP : hero côte à côte ── */
        .hero-wrapper      { max-width:1100px; margin:0 auto; display:flex; gap:48px; align-items:center; position:relative; z-index:1; }
        .hero-left         { flex:1; animation:fadeUp 0.7s ease both; }
        .hero-dropzone-wrap { flex:0 0 380px; animation:fadeUp 0.9s ease 0.2s both; }

        /* ── DROP ZONE ── */
        .dropzone-upload-badge { width:72px; height:72px; border-radius:20px; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
        .dropzone-choose-btn { color:#fff; border:none; border-radius:999px; padding:15px 34px; font-size:16px; font-weight:800; cursor:pointer; transition:opacity 0.2s ease, transform 0.15s ease; }
        .dropzone-choose-btn:hover { opacity:0.9; transform:translateY(-1px); }
        .dropzone-close { position:absolute; top:0; right:0; background:transparent; border:none; cursor:pointer; padding:4px; display:flex; }
        .dropzone-close:hover { opacity:0.7; }
        .format-pills { display:flex; flex-wrap:wrap; justify-content:center; gap:6px; }
        .format-pill { font-size:11px; padding:4px 10px; border-radius:999px; font-weight:500; white-space:nowrap; }
        .suggestion-grid { display:flex; flex-direction:column; gap:8px; margin:4px 0 16px; }
        .suggestion-card { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:14px; text-decoration:none; transition:transform 0.15s ease; }
        .suggestion-card:hover { transform:translateX(4px); }
        .icon-badge { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .s-name { font-size:13.5px; font-weight:700; }
        .s-note { font-size:11.5px; }
        .search-result-row { display:block; padding:8px 10px; border-radius:8px; font-size:13px; text-decoration:none; }
        .search-result-row:hover { background: rgba(24,95,165,0.1); }

        /* ── AD SLOT — stays in the DOM at the same position but takes up no
           space while empty (:empty means no ad script has injected anything
           into it yet). Height only reserves once an ad unit actually mounts
           a child element inside, so the placeholder itself never pushes
           Popular Tools and All Tools apart. ── */
        .ad-slot { width:100%; background:transparent; }
        .ad-slot:not(:empty) { min-height:50px; }
        @media (min-width:641px) { .ad-slot:not(:empty) { min-height:90px; } }

        /* ── POPULAR TOOLS: 6-up grid of real clickable cards, distinct from
           the hero's decorative badges ── */
        .popular-tools-grid { display:grid; grid-template-columns:repeat(6, 1fr); gap:16px; max-width:1000px; margin:0 auto; }
        .popular-tool-card  {
          position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:10px; padding:28px 10px; border-radius:18px; text-decoration:none;
          box-shadow:0 2px 6px rgba(0,0,0,0.05);
          transition:transform 0.2s ease, box-shadow 0.2s ease;
        }
        .popular-tool-card:hover { transform:translateY(-5px); box-shadow:0 14px 28px rgba(0,0,0,0.14); }
        .popular-tool-card .ico  { width:30px; height:30px; transition:transform 0.2s ease; }
        .popular-tool-card:hover .ico { transform:scale(1.12); }
        .popular-tool-card .name { font-size:13.5px; font-weight:700; text-align:center; line-height:1.3; }
        .popular-tool-card .arrow { position:absolute; top:10px; right:10px; width:15px; height:15px; opacity:0; transition:opacity 0.2s ease; }
        .popular-tool-card:hover .arrow { opacity:0.7; }

        /* ── MOBILE PORTRAIT ≤ 640px ── */
        @media (max-width: 640px) {
          .hero-wrapper    { flex-direction:column; gap:28px; }
          .hero-left       { width:100%; }
          .hero-dropzone-wrap { flex:none; width:100%; }
          .popular-tools-grid { grid-template-columns:repeat(2, 1fr); gap:10px; }
          .popular-tool-card  { padding:22px 8px; border-radius:14px; }
        }

        /* ── TABLETTE 641–1024px ── */
        @media (min-width:641px) and (max-width:1024px) {
          .hero-dropzone-wrap { flex:0 0 320px; }
          .popular-tools-grid { grid-template-columns:repeat(3, 1fr); }
        }
      `}</style>

      {/* ═══ HERO ═══ */}
      <section style={{ background: dark ? '#111111' : '#f8fafc', padding:'80px 24px 60px', position:'relative', overflow:'hidden', width:'100%', maxWidth:'100vw', boxSizing:'border-box' }}>
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'400px', height:'400px', background: dark ? 'transparent' : 'rgba(226,232,240,0.5)', borderRadius:'50%', filter:'blur(60px)' }} />
          <div style={{ position:'absolute', bottom:'-100px', left:'-60px', width:'350px', height:'350px', background: dark ? 'transparent' : 'rgba(226,232,240,0.3)', borderRadius:'50%', filter:'blur(80px)' }} />
        </div>
        <div className='hero-wrapper'>

          {/* LEFT */}
          <div className='hero-left' style={{ flex:1, animation:'fadeUp 0.7s ease both' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background: dark ? '#111111' : '#e2e8f0', border: dark ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius:'999px', padding:'6px 16px', marginBottom:'24px', fontSize:'13px', color: dark ? '#94a3b8' : '#1e293b' }}>
              <Sparkles size={14} style={{ flexShrink:0 }} /> {totalTools}+ free tools · No signup · No limits
            </div>
            <h1 style={{ fontSize:'clamp(46px,6.4vw,76px)', fontWeight:'800', color: dark ? '#f1f5f9' : '#0f172a', lineHeight:'1.1', marginBottom:'20px', letterSpacing:'-0.02em' }}>
              Convert anything.<br /><span style={{
                backgroundImage: dark ? 'linear-gradient(135deg, #378add, #F4C0D1)' : 'linear-gradient(135deg, #185fa5, #D4537E)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              }}>Instantly. Free.</span>
            </h1>
            <p style={{ fontSize:'18px', color: dark ? '#94a3b8' : '#1e293b', lineHeight:'1.7', marginBottom:'20px', maxWidth:'480px' }}>
              The fastest way to convert, compress, and transform your files — {totalTools} tools, zero installation, completely free.
            </p>
            <div style={{
              display:'flex', alignItems:'flex-start', gap:'8px', maxWidth:'480px', marginBottom:'24px',
              background: dark ? 'rgba(34,197,94,0.08)' : '#f0fdf4',
              border: dark ? '1px solid rgba(34,197,94,0.25)' : '1px solid #bbf7d0',
              borderRadius:'12px', padding:'10px 14px',
            }}>
              <ShieldCheck size={16} style={{ flexShrink:0, marginTop:'2px', color: dark ? '#4ade80' : '#16a34a' }} />
              <span style={{ fontSize:'13px', color: dark ? '#86efac' : '#166534', lineHeight:'1.5' }}>
                Most tools run right in your browser — nothing uploaded
              </span>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'8px' }}>
              {badges.map(b => (
                <span key={b.text} className="badge-pill" style={{ display:'flex', alignItems:'center', gap:'6px', background: dark ? '#111111' : '#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'999px', padding:'7px 14px', fontSize:'13px', color: dark ? '#94a3b8' : '#1e293b', transition:'background 0.2s' }}>
                  <b.icon size={14} style={{ flexShrink:0 }} /> {b.text}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — file drop zone */}
          <div className="hero-dropzone-wrap">
            <FileDropZone dark={dark} toolCounts={toolCounts} />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section ref={statsRef} style={{ background: dark ? '#111111' : '#f1f5f9', padding:'48px 24px' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px' }}>
          {stats.map(s => <StatCard key={s.label} {...s} animate={statsVisible} dark={dark} />)}
        </div>
      </section>

      {/* ═══ POPULAR TOOLS ═══ */}
      <section style={{ background: dark ? '#111111' : '#fff', padding:'56px 24px', textAlign:'center', borderBottom: dark ? '1px solid #222222' : '1px solid #e2e8f0' }}>
        <div style={{ maxWidth:'1040px', margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:'800', color: dark ? '#f1f5f9' : '#0f172a', marginBottom:'8px', letterSpacing:'-0.02em' }}>Popular Tools</h2>
          <p style={{ fontSize:'15px', color: dark ? '#94a3b8' : '#1e293b', marginBottom:'28px' }}>Jump straight to what people use most</p>
          <div className="popular-tools-grid">
            {popularTools.map(t => {
              const catSlug = t.href.split('/')[2];
              const pal = huePalette[hueOf(catSlug)];
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="popular-tool-card"
                  style={{ background: cardBg(pal, dark), border: cardBorder(pal, dark) }}
                >
                  <ArrowUpRight className="arrow" style={{ color: dark ? pal.dark400 : pal.light500 }} />
                  <CategoryIcon slug={catSlug} className="ico" style={{ color: dark ? pal.dark400 : pal.light500 }} />
                  <span className="name" style={{ color: dark ? '#e2e8f0' : '#1e293b' }}>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ AD SLOT — reserved for a responsive AdSense banner, left empty
           until launch. The slot itself only reserves height once it's no
           longer empty (see .ad-slot:not(:empty) above), so this wrapper's
           own padding is what sets the gap between Popular Tools and All
           Tools today -- kept small on purpose to match other section-to-
           section gaps while the ad is inactive. ═══ */}
      <div style={{ maxWidth:'970px', margin:'0 auto', padding:'8px 24px' }}>
        <div id="ad-slot-homepage" className="ad-slot" aria-hidden="true" />
      </div>

      {/* ═══ CATEGORIES — FORMAT 100% ORIGINAL ═══ */}
      <div className="p-6 dark:bg-black">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800 dark:text-white">All Tools</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center mb-10">Everything you need in one place</p>
          <div className="flex flex-wrap gap-5 justify-center">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <div className="flex justify-between items-center w-full mb-3">
                  <span className="flex items-center justify-center shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 w-12 h-12">
                    <CategoryIcon slug={cat.slug} className={`w-6 h-6 ${categoryColors[cat.slug]}`} />
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-700 rounded-full px-2 py-1">{toolCounts.counts[cat.slug] || cat.count} tools</span>
                </div>
                <h2 className="font-extrabold text-2xl mb-1 text-neutral-800 dark:text-white group-hover:text-indigo-600 transition">{cat.title}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">{cat.description}</p>
                <div className="space-y-1 w-full text-center">
                  {cat.tools.map(tool => (
                    <div key={tool} className="text-neutral-500 dark:text-neutral-400 text-xs">• {tool}</div>
                  ))}
                  <div className="text-indigo-500 text-xs font-semibold mt-2">+{Math.max(0, (toolCounts.counts[cat.slug] || cat.count) - cat.tools.length)} more tools</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ AI SECTION ═══ */}
      <section style={{ background: dark ? '#111111' : '#f8fafc', padding:'32px 24px 72px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', textAlign:'center' }}>
          <Bot size={48} style={{ display:'block', margin:'0 auto 16px', color:'#6366f1' }} />
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:'800', color: dark ? '#f1f5f9' : '#0f172a', marginBottom:'16px', letterSpacing:'-0.02em' }}>Powered by AI</h2>
          <p style={{ fontSize:'18px', color: dark ? '#94a3b8' : '#1e293b', marginBottom:'40px', maxWidth:'580px', margin:'0 auto 40px', lineHeight:'1.7' }}>
            16 AI-powered tools including background removal, image upscaling, grammar fixing, translation, transcription, and more.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', justifyContent:'center', marginBottom:'40px' }}>
            {[
              { slug: 'grammar-fixer', label: 'Grammar Fixer' },
              { slug: 'ai-translator', label: 'AI Translator' },
              { slug: 'text-summarizer', label: 'Text Summarizer' },
              { slug: 'background-remover', label: 'Background Remover' },
              { slug: 'image-upscaler', label: 'Image Upscaler' },
              { slug: 'audio-transcriber', label: 'Audio Transcriber' },
              { slug: 'ai-chatbot', label: 'AI Chatbot' },
              { slug: 'email-generator', label: 'Email Generator' },
            ].map(t => (
              <span key={t.slug} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background: dark ? '#1c1c1e' : '#e2e8f0', border: dark ? '1px solid #2c2c2e' : '1px solid #cbd5e1', borderRadius:'999px', padding:'8px 18px', fontSize:'13px', color: dark ? '#cbd5e1' : '#334155', fontWeight:'500' }}>
                <ToolIcon slug={t.slug} className="w-3.5 h-3.5" /> {t.label}
              </span>
            ))}
          </div>
          <Link href="/tools/ai-tools" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#6366f1', color:'#fff', padding:'16px 36px', borderRadius:'14px', fontWeight:'700', fontSize:'16px', textDecoration:'none', boxShadow:'0 8px 30px rgba(99,102,241,0.25)' }}>
            <Rocket size={18} /> Explore AI Tools
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER STRIP ═══ */}
      <section style={{ background: dark ? '#111111' : '#fff', padding:'14px 24px', textAlign:'center', borderTop: dark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
        <p style={{ fontSize:'14px', color:'#6366f1', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'6px' }}>
          <Sparkles size={14} /> <strong style={{ color:'#4338ca' }}>No watermarks</strong> · <Laptop size={14} /> <strong style={{ color:'#4338ca' }}>Works in your browser</strong> · <Lock size={14} /> <strong style={{ color:'#4338ca' }}>No data stored</strong> · <DollarSign size={14} /> <strong style={{ color:'#4338ca' }}>Always free</strong>
        </p>
      </section>

    </div>
  );
}
