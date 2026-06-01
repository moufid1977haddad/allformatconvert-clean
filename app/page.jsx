'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

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
  { icon: '📄', color: 'text-red-400',    title: 'PDF Tools',        description: 'Merge, split, compress, and convert PDFs',        href: '/tools/pdf-tools',           tools: ['Merge PDF', 'Split PDF', 'Compress PDF'],                          count: 39 },
  { icon: '🖼️', color: 'text-pink-400',   title: 'Image Tools',      description: 'Convert, compress, and edit images',               href: '/tools/image-tools',         tools: ['Image Compressor', 'Image Converter', 'Image Resizer'],            count: 36 },
  { icon: '🎞️', color: 'text-purple-500', title: 'GIF Tools',        description: 'Convert videos and images to GIF format',          href: '/tools/gif-tools',           tools: ['Video to GIF', 'MP4 to GIF', 'GIF to MP4'],                        count: 9  },
  { icon: '📝', color: 'text-green-400',  title: 'Text Tools',       description: 'Word count, case conversion, text formatting',     href: '/tools/text-tools',          tools: ['Word Counter', 'Case Converter', 'Text Reverser'],                 count: 17 },
  { icon: '🎵', color: 'text-yellow-500', title: 'Audio Tools',      description: 'Convert, compress, and edit audio files',          href: '/tools/audio-tools',         tools: ['Audio Converter', 'Audio Trimmer', 'Audio Compressor'],           count: 11 },
  { icon: '🎬', color: 'text-blue-400',   title: 'Media Tools',      description: 'Convert, compress, and extract from videos',       href: '/tools/media-tools',         tools: ['Video to Audio', 'Video Compressor', 'Video Converter'],           count: 28 },
  { icon: '📁', color: 'text-orange-400', title: 'File Tools',       description: 'ZIP compression, file conversion, Base64',         href: '/tools/file-tools',          tools: ['ZIP Extractor', 'ZIP Creator', 'TAR Extractor'],                   count: 9  },
  { icon: '📱', color: 'text-teal-400',   title: 'QR & Barcodes',   description: 'Generate and scan QR codes and barcodes',          href: '/tools/qr-barcodes-tools',   tools: ['QR Generator', 'Barcode Generator', 'QR Scanner'],                count: 3  },
  { icon: '🔄', color: 'text-yellow-400', title: 'Converter Tools',  description: 'Convert units, colors, and currencies',            href: '/tools/converter-tools',     tools: ['Currency Converter', 'Unit Converter', 'Color Converter'],         count: 4  },
  { icon: '💻', color: 'text-purple-400', title: 'Developer Tools',  description: 'JSON, Base64, URL encoding, and more',             href: '/tools/developer-tools',     tools: ['XML to JSON', 'JSON Formatter', 'Hash Generator'],                 count: 54 },
  { icon: '🔢', color: 'text-indigo-400', title: 'Math Tools',       description: 'Number conversion, percentage calculator',         href: '/tools/math-tools',          tools: ['Number Base Converter', 'Percentage Calculator', 'Roman Numeral Converter'], count: 6 },
  { icon: '🤖', color: 'text-cyan-400',   title: 'AI Tools',         description: 'AI-powered image and text tools',                  href: '/tools/ai-tools',            tools: ['Background Remover', 'Image Upscaler', 'Grammar Fixer'],          count: 16 },
];

const stats = [
  { value: 232, label: 'Free Tools',  suffix: '+', icon: '🛠️' },
  { value: 12,  label: 'Categories',  suffix: '',  icon: '📂' },
  { value: 13,  label: 'Languages',   suffix: '',  icon: '🌍' },
  { value: 190, label: 'Countries',   suffix: '+', icon: '🌐' },
];

const badges = [
  { icon: '⚡', text: 'No signup required' },
  { icon: '🔒', text: '100% secure & private' },
  { icon: '📱', text: 'Works on all devices' },
  { icon: '☁️', text: 'No installation needed' },
];

const floatingIcons = [
  { icon: '📄', label: 'PDF',     color: '#fef2f2', border: '#fca5a5', anim: 'floatA', dur: '3.2s', delay: '0s'    },
  { icon: '🖼️', label: 'Image',   color: '#fdf4ff', border: '#e879f9', anim: 'floatB', dur: '3.8s', delay: '0.3s'  },
  { icon: '🎬', label: 'Video',   color: '#eff6ff', border: '#93c5fd', anim: 'floatC', dur: '3.5s', delay: '0.1s'  },
  { icon: '🤖', label: 'AI',      color: '#ecfeff', border: '#67e8f9', anim: 'floatA', dur: '4.0s', delay: '0.5s'  },
  { icon: '🎵', label: 'Audio',   color: '#fefce8', border: '#fde047', anim: 'floatB', dur: '3.3s', delay: '0.2s'  },
  { icon: '💻', label: 'Dev',     color: '#f5f3ff', border: '#c4b5fd', anim: 'floatC', dur: '3.7s', delay: '0.4s'  },
  { icon: '📁', label: 'Files',   color: '#fff7ed', border: '#fdba74', anim: 'floatA', dur: '4.2s', delay: '0.6s'  },
  { icon: '🔢', label: 'Math',    color: '#eef2ff', border: '#a5b4fc', anim: 'floatB', dur: '3.6s', delay: '0.35s' },
  { icon: '🎞️', label: 'GIF',     color: '#faf5ff', border: '#d8b4fe', anim: 'floatC', dur: '3.9s', delay: '0.15s' },
  { icon: '📝', label: 'Text',    color: '#f0fdf4', border: '#86efac', anim: 'floatA', dur: '3.4s', delay: '0.55s' },
  { icon: '📱', label: 'QR',      color: '#f0fdfa', border: '#5eead4', anim: 'floatB', dur: '4.1s', delay: '0.25s' },
  { icon: '🔄', label: 'Convert', color: '#fffbeb', border: '#fcd34d', anim: 'floatC', dur: '3.6s', delay: '0.45s' },
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

function StatCard({ value, label, suffix, icon, animate, dark }) {
  const count = useCountUp(value, 1600, animate);
  return (
    <div style={{ background: dark ? '#111111' : '#ffffff', border: dark ? '1px solid #222222' : '1px solid #e2e8f0', borderRadius:'16px', padding:'20px 24px', textAlign:'center' }}>
      <div style={{ fontSize:'28px', marginBottom:'4px' }}>{icon}</div>
      <div style={{ fontSize:'32px', fontWeight:'800', color: dark ? '#f1f5f9' : '#0f172a', lineHeight:1 }}>{animate ? count : value}{suffix}</div>
      <div style={{ fontSize:'12px', color: dark ? '#94a3b8' : '#64748b', marginTop:'4px', letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</div>
    </div>
  );
}

export default function Home() {
  const dark = useDarkMode();
  const [statsVisible, setStatsVisible] = useState(false);
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
        @keyframes floatA  { 0%,100% { transform:translateY(0px) rotate(-2deg); } 50% { transform:translateY(-12px) rotate(2deg);  } }
        @keyframes floatB  { 0%,100% { transform:translateY(0px) rotate(3deg);  } 50% { transform:translateY(-16px) rotate(-1deg); } }
        @keyframes floatC  { 0%,100% { transform:translateY(0px) rotate(-1deg); } 50% { transform:translateY(-10px) rotate(3deg);  } }
        .badge-pill:hover  { background: #e2e8f0 !important; }
      `}</style>

      {/* ═══ HERO ═══ */}
      <section style={{ background: dark ? '#111111' : '#f8fafc', padding:'80px 24px 60px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'400px', height:'400px', background: dark ? 'transparent' : 'rgba(226,232,240,0.5)', borderRadius:'50%', filter:'blur(60px)' }} />
          <div style={{ position:'absolute', bottom:'-100px', left:'-60px', width:'350px', height:'350px', background: dark ? 'transparent' : 'rgba(226,232,240,0.3)', borderRadius:'50%', filter:'blur(80px)' }} />
        </div>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', gap:'48px', alignItems:'center', position:'relative', zIndex:1 }}>

          {/* LEFT */}
          <div style={{ flex:1, animation:'fadeUp 0.7s ease both' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background: dark ? '#111111' : '#e2e8f0', border: dark ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius:'999px', padding:'6px 16px', marginBottom:'24px', fontSize:'13px', color: dark ? '#94a3b8' : '#475569' }}>
              ✨ 232+ free tools · No signup · No limits
            </div>
            <h1 style={{ fontSize:'clamp(36px,5vw,58px)', fontWeight:'800', color: dark ? '#f1f5f9' : '#0f172a', lineHeight:'1.1', marginBottom:'20px', letterSpacing:'-0.02em' }}>
              Convert anything.<br /><span style={{ color:'#6366f1' }}>Instantly. Free.</span>
            </h1>
            <p style={{ fontSize:'18px', color: dark ? '#94a3b8' : '#475569', lineHeight:'1.7', marginBottom:'32px', maxWidth:'480px' }}>
              The fastest way to convert, compress, and transform your files — 232 tools, zero installation, completely free.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'40px' }}>
              {badges.map(b => (
                <span key={b.text} className="badge-pill" style={{ display:'flex', alignItems:'center', gap:'6px', background: dark ? '#111111' : '#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'999px', padding:'7px 14px', fontSize:'13px', color: dark ? '#94a3b8' : '#475569', transition:'background 0.2s' }}>
                  {b.icon} {b.text}
                </span>
              ))}
            </div>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <Link href="/tools/pdf-tools" style={{ display:'flex', alignItems:'center', gap:'6px', background: dark ? '#111111' : '#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'999px', padding:'7px 14px', fontSize:'13px', color: dark ? '#94a3b8' : '#475569', textDecoration:'none', fontWeight:'500' }}>🚀 Explore PDF Tools</Link>
              <Link href="/tools/ai-tools"  style={{ display:'flex', alignItems:'center', gap:'6px', background: dark ? '#111111' : '#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'999px', padding:'7px 14px', fontSize:'13px', color: dark ? '#94a3b8' : '#475569', textDecoration:'none', fontWeight:'500' }}>🤖 Try AI Tools</Link>
            </div>
          </div>

          {/* RIGHT — 12 floating icons */}
          <div style={{ flex:'0 0 360px', display:'grid', gridTemplateColumns:'repeat(3, 110px)', gap:'12px', justifyContent:'center', animation:'fadeUp 0.9s ease 0.2s both' }}>
            {floatingIcons.map(item => (
              <div key={item.label} style={{ width:'110px', height:'88px', background: dark ? '#1c1c1e' : item.color, border: dark ? '1.5px solid #2c2c2e' : `1.5px solid ${item.border}`, borderRadius:'18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px', animation:`${item.anim} ${item.dur} ease-in-out ${item.delay} infinite`, boxShadow:'0 6px 20px rgba(0,0,0,0.10)' }}>
                <span style={{ fontSize:'28px' }}>{item.icon}</span>
                <span style={{ fontSize:'11px', fontWeight:'600', color: dark ? '#94a3b8' : '#374151' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section ref={statsRef} style={{ background: dark ? '#111111' : '#f1f5f9', padding:'48px 24px' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px' }}>
          {stats.map(s => <StatCard key={s.label} {...s} animate={statsVisible} dark={dark} />)}
        </div>
      </section>

      {/* ═══ QUOTE ═══ */}
      <section style={{ background: dark ? '#111111' : '#fff', padding:'56px 24px', textAlign:'center', borderBottom: dark ? '1px solid #222222' : '1px solid #e2e8f0' }}>
        <div style={{ maxWidth:'720px', margin:'0 auto' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px', lineHeight:1, color: dark ? '#475569' : '#9ca3af' }}>"</div>
          <p style={{ fontSize:'clamp(18px,2.5vw,24px)', fontWeight:'600', color: dark ? '#e2e8f0' : '#1e1b4b', lineHeight:'1.6', marginBottom:'20px', fontStyle:'italic' }}>
            The fastest way to convert, compress, and transform your files — 232 tools, zero installation, completely free.
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
            <div style={{ width:'40px', height:'2px', background: dark ? '#475569' : '#9ca3af' }} />
            <span style={{ fontSize:'13px', color: dark ? '#64748b' : '#9ca3af', fontWeight:'500', letterSpacing:'0.05em', textTransform:'uppercase' }}>AllFormatConvert · Trusted in 190+ countries</span>
            <div style={{ width:'40px', height:'2px', background: dark ? '#475569' : '#9ca3af' }} />
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES — FORMAT 100% ORIGINAL ═══ */}
      <div className="p-6 dark:bg-black">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800 dark:text-white">All Tools</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center mb-10">Everything you need in one place</p>
          <div className="flex flex-wrap gap-5 justify-center">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <div className="flex justify-between items-center w-full mb-3">
                  <div className={`text-3xl ${cat.color}`}>{cat.icon}</div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-700 rounded-full px-2 py-1">{cat.count} tools</span>
                </div>
                <h2 className="font-bold text-lg mb-1 text-neutral-800 dark:text-white group-hover:text-indigo-600 transition">{cat.title}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">{cat.description}</p>
                <div className="space-y-1 w-full text-center">
                  {cat.tools.map(tool => (
                    <div key={tool} className="text-neutral-500 dark:text-neutral-400 text-xs">• {tool}</div>
                  ))}
                  <div className="text-indigo-500 text-xs font-semibold mt-2">+{cat.count - cat.tools.length} more tools</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ AI SECTION ═══ */}
      <section style={{ background: dark ? '#111111' : '#f8fafc', padding:'72px 24px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>🤖</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:'800', color: dark ? '#f1f5f9' : '#0f172a', marginBottom:'16px', letterSpacing:'-0.02em' }}>Powered by AI</h2>
          <p style={{ fontSize:'18px', color: dark ? '#94a3b8' : '#64748b', marginBottom:'40px', maxWidth:'580px', margin:'0 auto 40px', lineHeight:'1.7' }}>
            16 AI-powered tools including background removal, image upscaling, grammar fixing, translation, transcription, and more.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', justifyContent:'center', marginBottom:'40px' }}>
            {['✨ Grammar Fixer','🌍 AI Translator','📝 Text Summarizer','🎨 Background Remover','🔍 Image Upscaler','🎙️ Audio Transcriber','💬 AI Chatbot','📧 Email Generator'].map(t => (
              <span key={t} style={{ background: dark ? '#111111' : '#e2e8f0', border: dark ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius:'999px', padding:'8px 18px', fontSize:'13px', color: dark ? '#cbd5e1' : '#334155', fontWeight:'500' }}>{t}</span>
            ))}
          </div>
          <Link href="/tools/ai-tools" style={{ display:'inline-block', background:'#6366f1', color:'#fff', padding:'16px 36px', borderRadius:'14px', fontWeight:'700', fontSize:'16px', textDecoration:'none', boxShadow:'0 8px 30px rgba(99,102,241,0.25)' }}>
            🚀 Explore AI Tools
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER STRIP ═══ */}
      <section style={{ background: dark ? '#111111' : '#fff', padding:'32px 24px', textAlign:'center', borderTop: dark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
        <p style={{ fontSize:'14px', color:'#6366f1' }}>
          🌍 Available in <strong style={{ color:'#4338ca' }}>13 languages</strong> · ⚡ <strong style={{ color:'#4338ca' }}>232+</strong> free tools · 🔒 <strong style={{ color:'#4338ca' }}>No data stored</strong> · 💸 <strong style={{ color:'#4338ca' }}>Always free</strong>
        </p>
      </section>

    </div>
  );
}
