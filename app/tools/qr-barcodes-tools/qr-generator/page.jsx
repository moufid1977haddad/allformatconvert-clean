'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { QR_TYPES, buildPayload } from '../../../lib/qrPayload';
import { qrMatrix, drawCanvas, toSvg, toPdf, readsBackAs, contrast } from '../../../lib/qrRender';

// Features from QRCode Monkey, the free reference (read 2026-09-23): content types, colours, logo, error
// correction, up to 2000 px, PNG/SVG/PDF. What it does not do and this page does: every code is read back
// by a decoder before it can be downloaded (docs/audit/RAPPORT-licence-et-ameliorations.md §5).
const MIN_SIZE = 200, MAX_SIZE = 2000;
const ECL = [
  { id: 'L', label: 'Low (7 %)' }, { id: 'M', label: 'Medium (15 %)' }, { id: 'Q', label: 'Quartile (25 %)' }, { id: 'H', label: 'High (30 %)' },
];
const SHAPES = [{ id: 'square', label: 'Squares' }, { id: 'rounded', label: 'Rounded' }, { id: 'dots', label: 'Dots' }];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const FIELDS = {
  url: [['url', 'Web address', 'https://example.com']],
  text: [['text', 'Text', 'Any text', 'textarea']],
  email: [['to', 'Email address', 'name@example.com'], ['subject', 'Subject (optional)', ''], ['body', 'Message (optional)', '', 'textarea']],
  phone: [['phone', 'Phone number', '+1 555 010 2030']],
  sms: [['phone', 'Phone number', '+1 555 010 2030'], ['message', 'Message (optional)', '', 'textarea']],
  wifi: [['ssid', 'Network name (SSID)', 'MyWiFi'], ['password', 'Password', '']],
  vcard: [['firstName', 'First name', ''], ['lastName', 'Last name', ''], ['org', 'Company', ''], ['title', 'Job title', ''], ['phone', 'Phone', ''], ['email', 'Email', ''], ['website', 'Website', ''], ['street', 'Street', ''], ['city', 'City', ''], ['zip', 'Postcode', ''], ['country', 'Country', '']],
  geo: [['lat', 'Latitude', '48.8584'], ['lng', 'Longitude', '2.2945']],
};

export default function QrGeneratorPage() {
  const [type, setType] = useState('url');
  const [fields, setFields] = useState({ encryption: 'WPA' });
  const [size, setSize] = useState(1000);
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [shape, setShape] = useState('square');
  const [ecl, setEcl] = useState('M');
  const [logo, setLogo] = useState(null); // { img, dataUrl, png, aspect, name }
  const [out, setOut] = useState(null);   // { png, svg, pdf, version }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const logoInput = useRef(null);

  useEffect(() => { setOut(null); setError(''); }, [type, fields, size, fg, bg, shape, ecl, logo]);
  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const effectiveEcl = logo ? 'H' : ecl; // a logo hides modules: level H is the one that can rebuild them

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) { setError('The logo is larger than 2 MB. Use a smaller image.'); return; }
    const dataUrl = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(file); });
    const img = new Image();
    try { await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = dataUrl; }); } catch { setError('This logo could not be opened. Use a PNG, JPG, GIF, WebP or SVG image.'); return; }
    const w = img.naturalWidth || 512, h = img.naturalHeight || 512;
    // PNG copy for the PDF (pdf-lib embeds PNG/JPG only), at most 512 px.
    const k = Math.min(1, 512 / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const png = new Uint8Array(await (await new Promise((ok) => c.toBlob(ok, 'image/png'))).arrayBuffer());
    setLogo({ img, dataUrl, png, aspect: w / h, name: file.name });
  };

  const generate = async () => {
    const built = buildPayload(type, fields);
    if (built.error) { setError(built.error); return; }
    const ct = contrast(fg, bg);
    if (!ct.darkOnLight) { setError('The code must be darker than its background: most phone cameras cannot read a light code on a dark background. Swap the two colours.'); return; }
    if (ct.ratio < 3) { setError(`These two colours are too close (contrast ${ct.ratio.toFixed(1)}:1, at least 3:1 is needed to scan reliably). Pick a darker code colour or a lighter background.`); return; }
    setBusy(true); setError('');
    try {
      let m;
      try { m = await qrMatrix(built.payload, effectiveEcl); } catch { throw new Error('This is too much content for one QR code. Shorten it, or lower the error correction.'); }
      const canvas = canvasRef.current;
      drawCanvas(canvas, m, { size, fg, bg, shape, logo: logo?.img });
      // Never hand over a code that does not scan back to exactly what was typed.
      if (!(await readsBackAs(canvas, built.payload))) {
        throw new Error(logo
          ? 'With this logo the code no longer scans reliably. Try a simpler or smaller logo, or remove it.'
          : 'This code did not scan back correctly with these settings. Try the "Squares" shape or stronger colours.');
      }
      const png = await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
      if (!png || png.size === 0) throw new Error('Your browser could not create the PNG image.');
      const svg = new Blob([toSvg(m, { size, fg, bg, shape, logoDataUrl: logo?.dataUrl, logoAspect: logo?.aspect })], { type: 'image/svg+xml' });
      const pdf = new Blob([await toPdf(m, { fg, bg, shape, pngLogo: logo?.png, logoAspect: logo?.aspect })], { type: 'application/pdf' });
      setOut({ png: URL.createObjectURL(png), svg: URL.createObjectURL(svg), pdf: URL.createObjectURL(pdf), version: m.version });
    } catch (e) {
      setError(e.message || 'The QR code could not be created.');
    }
    setBusy(false);
  };

  const input = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">QR Code Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Links, Wi-Fi, contacts and more — colours, logo, up to 2000 px, PNG, SVG or PDF. Every code is scanned back before you download it.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Content type">
            {QR_TYPES.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={type === t.id} onClick={() => setType(t.id)}
                className={`rounded-lg py-2 text-sm font-medium transition ${type === t.id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{t.label}</button>
            ))}
          </div>
          <div className={type === 'vcard' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}>
            {FIELDS[type].map(([k, label, ph, kind]) => (
              <div key={type + k}>
                <label htmlFor={`qr-${k}`} className="block text-sm text-neutral-500 mb-1">{label}</label>
                {kind === 'textarea'
                  ? <textarea id={`qr-${k}`} value={fields[k] || ''} onChange={set(k)} placeholder={ph} className={input + ' h-24 resize-none'} />
                  : <input id={`qr-${k}`} type={k === 'password' ? 'text' : 'text'} value={fields[k] || ''} onChange={set(k)} placeholder={ph} className={input} />}
              </div>
            ))}
            {type === 'wifi' && (
              <div className="flex flex-wrap gap-4 items-center text-sm text-neutral-700">
                <label htmlFor="qr-enc">Security</label>
                <select id="qr-enc" value={fields.encryption} onChange={set('encryption')} className="bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                  <option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">No password</option>
                </select>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!fields.hidden} onChange={set('hidden')} /> Hidden network</label>
              </div>
            )}
          </div>

          <details className="border border-neutral-200 rounded-lg p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-neutral-700">Design</summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
              <label className="flex items-center justify-between gap-2">Code colour <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} aria-label="Code colour" /></label>
              <label className="flex items-center justify-between gap-2">Background <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} aria-label="Background colour" /></label>
              <div>
                <span className="block text-neutral-500 mb-1">Shape</span>
                <div className="flex gap-2">{SHAPES.map((s) => (
                  <button key={s.id} type="button" onClick={() => setShape(s.id)} aria-pressed={shape === s.id} className={`flex-1 rounded-lg py-1.5 ${shape === s.id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700'}`}>{s.label}</button>
                ))}</div>
              </div>
              <div>
                <label htmlFor="qr-ecl" className="block text-neutral-500 mb-1">Error correction</label>
                <select id="qr-ecl" value={effectiveEcl} onChange={(e) => setEcl(e.target.value)} disabled={!!logo} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                  {ECL.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
                {logo && <p className="text-xs text-neutral-500 mt-1">High is required with a logo.</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="qr-size" className="block text-neutral-500 mb-1">PNG size: {size} × {size} px</label>
                <input id="qr-size" type="range" min={MIN_SIZE} max={MAX_SIZE} step={50} value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} className="w-full" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => logoInput.current.click()} className="bg-neutral-100 hover:bg-neutral-200 rounded-lg px-3 py-1.5">{logo ? 'Change logo' : 'Add a logo (optional)'}</button>
                {logo && <><span className="truncate text-neutral-600">{logo.name}</span><button type="button" onClick={() => setLogo(null)} className="text-red-600">Remove</button></>}
                <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden" onChange={onLogo} />
              </div>
            </div>
          </details>

          <button onClick={generate} disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{busy ? 'Creating and checking…' : 'Generate QR Code'}</button>
          {error && <p className="text-center text-red-600 text-sm" role="alert">{error}</p>}
          <div className="flex justify-center">
            <canvas ref={canvasRef} className={`rounded-xl border border-neutral-200 w-64 h-64 ${out ? '' : 'hidden'}`} />
          </div>
          {out && (
            <>
              <p className="text-center text-green-700 text-sm font-semibold">✓ Scanned back successfully (version {out.version}, error correction {effectiveEcl}).</p>
              <div className="grid grid-cols-3 gap-2">
                <a href={out.png} download="qrcode.png" className="block text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">PNG</a>
                <a href={out.svg} download="qrcode.svg" className="block text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">SVG</a>
                <a href={out.pdf} download="qrcode.pdf" className="block text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">PDF</a>
              </div>
            </>
          )}
        </div>
      </div>
      <SeoContent
        title="QR Code Generator"
        description="QR Code Generator creates QR codes for links, text, email, phone calls, SMS, Wi-Fi networks, contact cards (vCard) and map locations, with your own colours, a choice of module shapes, adjustable error correction and an optional logo, up to 2000 × 2000 px, as PNG, SVG or vector PDF. Everything runs in your browser — nothing you type is uploaded. Unlike most generators, every code is read back by a QR decoder before you can download it, so a bad colour choice or an oversized logo is caught before it reaches print."
        howTo={[
          "Choose what the code should hold — URL, text, email, phone, SMS, Wi-Fi, contact or location — and fill in the fields.",
          "Optionally pick colours, a module shape, the error-correction level, the PNG size and a logo.",
          "Click \"Generate QR Code\": the code is drawn, then scanned back to check it holds exactly what you typed.",
          "Download it as PNG, SVG (any size, for print) or PDF."
        ]}
        faqs={[
          { q: "Is QR Code Generator free to use?", a: "Yes, it's completely free with no signup, no watermark and no limit on how many QR codes you create. The codes are static: they never expire." },
          { q: "What can I put in a QR code?", a: "A web link, plain text, an email (with subject and message), a phone number, an SMS, Wi-Fi login details (phones join the network when they scan it), a contact card (vCard 3.0) or a map location." },
          { q: "Can I change the colours or add a logo?", a: "Yes. The code must stay darker than its background, with enough contrast — the tool refuses combinations most cameras cannot read. A logo switches error correction to High and is kept small enough in the centre for the code to be rebuilt around it; if a logo still stops the code from scanning, the tool tells you instead of offering the file." },
          { q: "How do I know the code works?", a: "After drawing it, the tool decodes it with a QR reader, the way a phone camera does, and only offers the downloads if the result is exactly what you entered. Testing with your own phone before printing is still a good idea." },
          { q: "Which format should I download?", a: "PNG for screens and documents (up to 2000 px), SVG or PDF for print: both are vector files that stay sharp at any size." },
          { q: "Is my data private?", a: "Yes. The QR code is generated entirely in your browser — nothing you type, and not your logo, is sent to a server." }
        ]}
        tips={[
          "Use SVG or PDF for anything printed, especially posters — they stay crisp at any size.",
          "Shorter content makes a simpler code that scans from further away: use a short link where you can.",
          "Keep the quiet white border around the code when you place it on a design; scanners need it.",
          "Dark code on a light background scans everywhere; light on dark does not."
        ]}
      />
    </div>
  );
}
