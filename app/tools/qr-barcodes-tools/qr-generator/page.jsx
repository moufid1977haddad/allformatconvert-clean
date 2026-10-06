'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { QR_TYPES, buildPayload } from '../../../lib/qrPayload';
import { qrMatrix, drawCanvas, toSvg, toPdf, readsBackAs, contrast } from '../../../lib/qrRender';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { imageHeaderSize, OPENABLE_PIXELS } from '../../../lib/fileChecks';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
  const [error, setError] = useToolError('');
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
    if (!file.size) { setError('This logo file is empty (0 bytes). Choose the image again.'); return; }
    if (file.size > MAX_LOGO_BYTES) { setError('The logo is larger than 2 MB. Use a smaller image.'); return; }
    // P23: a 30 000 × 30 000 PNG is 1.8 MB on disk; opened, it is 3.6 GB and the page went silent. The size is read
    // from the header first (the same 100-megapixel bound as the image tools; a logo is drawn a few hundred pixels wide).
    const dims = await imageHeaderSize(file);
    if (dims && dims.width * dims.height > OPENABLE_PIXELS) { setError(`This logo is ${dims.width.toLocaleString('en-US')} × ${dims.height.toLocaleString('en-US')} pixels (${Math.round(dims.width * dims.height / 1e6)} megapixels): too large to open. Use a smaller version of the logo — it is drawn at most a few hundred pixels wide.`); return; }
    try {
    const dataUrl = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(file); });
    const img = new Image();
    try { await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = dataUrl; }); } catch { setError('This logo could not be opened. Use a PNG, JPG, GIF, WebP or SVG image.'); return; }
    const w = img.naturalWidth || 512, h = img.naturalHeight || 512;
    // PNG copy for the PDF (pdf-lib embeds PNG/JPG only), at most 512 px.
    const k = Math.min(1, 512 / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const pngBlob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    if (!pngBlob || !pngBlob.size) throw new Error('no png');
    const png = new Uint8Array(await pngBlob.arrayBuffer());
    setLogo({ img, dataUrl, png, aspect: w / h, name: file.name });
    } catch { setError('This logo could not be opened. Use a PNG, JPG, GIF, WebP or SVG image.'); }
  };

  const generate = async () => {
    const built = buildPayload(type, fields);
    if (built.error) { setError(built.error); return; }
    const ct = contrast(fg, bg);
    if (!ct.darkOnLight) { setError('The code must be darker than its background: most phone cameras cannot read a light code on a dark background. Swap the two colors.'); return; }
    if (ct.ratio < 3) { setError(`These two colors are too close (contrast ${ct.ratio.toFixed(1)}:1, at least 3:1 is needed to scan reliably). Pick a darker code color or a lighter background.`); return; }
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
          : 'This code did not scan back correctly with these settings. Try the "Squares" shape or stronger colors.');
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
        <p className="text-neutral-500 text-center mb-8">Links, Wi-Fi, contacts and more — colors, logo, up to 2000 px, PNG, SVG or PDF. The PNG drawing is scanned back before you can download the files.</p>
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
                  ? <TextArea id={`qr-${k}`} value={fields[k] || ''} onChange={set(k)} placeholder={ph} className={input + ' h-24 resize-none'} />
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
              <label className="flex items-center justify-between gap-2">Code color <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} aria-label="Code color" /></label>
              <label className="flex items-center justify-between gap-2">Background <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} aria-label="Background color" /></label>
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
              <DownloadGroup zipName="qrcode.zip" alternatives>
                <FileDownload href={out.png} name="qrcode.png" />
                <FileDownload href={out.svg} name="qrcode.svg" />
                <FileDownload href={out.pdf} name="qrcode.pdf" />
              </DownloadGroup>
            </>
          )}
        </div>
      </div>
      <SeoContent
        title="QR Code Generator"
        description={`QR Code Generator builds what a QR code should hold from simple fields — a web link, text, an email, a phone number, an SMS, Wi-Fi login details, a vCard 3.0 contact or a map location — and draws it with your colors, square, rounded or dot modules, an error-correction level and an optional logo. The PNG is ${MIN_SIZE} to ${MAX_SIZE} pixels wide; SVG and PDF are vector. Before the downloads appear, the PNG drawing is decoded with jsQR and must give back exactly the content built from your fields. Codes are static, with no redirect, expiry or scan counting, and your Wi-Fi password or contact details stay on the page that drew them.`}
        example={{
          caption: 'What the code holds for two sets of fields (the page\'s own buildPayload function, run in Node on October 6, 2026).',
          inputLabel: 'You fill in',
          input: 'Wi-Fi — Network name (SSID): Cafe Wi-Fi\n  Password: tea;time\n  Security: WPA / WPA2 / WPA3\nURL — Web address: example.com/menu',
          outputLabel: 'Text inside the QR code',
          output: 'WIFI:T:WPA;S:Cafe Wi-Fi;P:tea\\;time;;\nhttps://example.com/menu',
        }}
        howToTitle="How to create a QR code"
        howTo={[
          `Pick what the code should hold — "URL", "Wi-Fi", "Contact (vCard)", "Location" or one of the four other types — and fill in its fields.`,
          `Under "Design", set "Code color", "Background", the "Shape" and the "Error correction" level, and move the "PNG size" slider.`,
          `Optionally click "Add a logo (optional)" and choose a PNG, JPG, GIF, WebP or SVG image of up to ${MAX_LOGO_BYTES / 1024 / 1024} MB.`,
          `Click "Generate QR Code"; once "Scanned back successfully" appears, use "Download" for PNG, SVG or PDF, or "Download all" for a ZIP of the three.`,
        ]}
        specs={[
          { label: 'Content types', value: 'URL, text, email with subject and message, phone, SMS, Wi-Fi (WPA, WEP or open, hidden networks too), vCard 3.0 contact, map location' },
          { label: 'Output formats', value: `PNG from ${MIN_SIZE} to ${MAX_SIZE} pixels wide; SVG; PDF on a 4-inch square page` },
          { label: 'Logo', value: `PNG, JPG, GIF, WebP or SVG up to ${MAX_LOGO_BYTES / 1024 / 1024} MB; it switches error correction to High and covers at most 22 % of the code width` },
          { label: 'In the PDF', value: 'Rounded modules are drawn as squares, and a logo is embedded as a PNG of at most 512 px' },
        ]}
        privacyTitle="Where your QR code is made"
        privacy="The content is encoded by the qrcode library, drawn and checked with jsQR in your browser, and the PDF is written by pdf-lib on the page. Your text, your Wi-Fi password and your logo are not uploaded. If an error message is shown, its text, which never contains your content, is sent cleaned to our error log with the tool's name and your browser's name and major version."
        faqs={[
          { q: 'Do these QR codes expire?', a: 'No. The content is written into the code itself, with no redirect through our site, so the code works as long as it can be read. The other side of that: you cannot change where it points later, you make a new code instead.' },
          { q: 'Can I add a logo without breaking the code?', a: 'Yes. A logo switches error correction to High and sits on a plain pad in the center, at most 22 % of the code width. If the drawing no longer decodes, the page offers no file and asks for a simpler or smaller logo, or none.' },
          { q: 'Can I make a white QR code on a black background?', a: 'No. The page accepts only a code darker than its background, with a contrast of at least 3:1; light-on-dark codes and colors that are too close are refused before drawing. Swap the two colors, or pick a darker code color.' },
          { q: 'Can I print the QR code large?', a: 'Yes. Download the SVG or the PDF: their modules are vector shapes that stay sharp at any size. A logo inside stays the image you gave, and the PDF holds a copy of at most 512 px, so start from a large logo for posters.' },
          { q: 'Is my Wi-Fi password stored?', a: 'No. The password is written into the code as plain WIFI: text and nowhere else; the page does not send it or keep it once you leave. Anyone who scans the printed code can read the password, so print it only where guests should have it.' },
        ]}
        tips={[
          'Keep the blank border of four modules around the code when you place it on a design; readers need it to find the code.',
        ]}
      />
    </div>
  );
}
