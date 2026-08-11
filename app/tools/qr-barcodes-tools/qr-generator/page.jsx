'use client';
import { useState, useEffect, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function QrGeneratorPage() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);
  const [qrUrl, setQrUrl] = useState('');
  const [status, setStatus] = useState('');
  const canvasRef = useRef(null);

  const generate = async () => {
    if (!text) return;
    setStatus('');
    setQrUrl('');
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = canvasRef.current;
      await QRCode.toCanvas(canvas, text, { width: size, margin: 2 });
      setQrUrl(canvas.toDataURL());
    } catch (err) {
      setStatus(err.message || 'Failed to generate QR code');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">QR Code Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate QR codes instantly</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Text or URL</label>
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter text or URL..." />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Size: {size}px</label>
            <input type="range" min="100" max="400" value={size} onChange={e => setSize(parseInt(e.target.value))} className="w-full" />
          </div>
          <button onClick={generate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Generate QR Code</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>
          {qrUrl && (
            <a href={qrUrl} download="qrcode.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download QR Code</a>
          )}
        </div>
      </div>
      <SeoContent
        title="QR Code Generator"
        description="QR Code Generator is a free online tool that instantly turns any text or URL into a scannable QR code, right in your browser. There's nothing to install and nothing is uploaded to a server — adjust the size to fit your use case, from business cards to large-format posters, and download it in seconds."
        howTo={[
          "Type or paste the text, URL, or data you want to encode into the input field.",
          "Use the slider to set the QR code size (100–400px) to match how it will be printed or displayed.",
          "Click \"Generate QR Code\" to render it instantly.",
          "Download the QR code as a PNG image and use it wherever you need."
        ]}
        faqs={[
          { q: "Is QR Code Generator free to use?", a: "Yes, it's completely free with no signup and no limit on how many QR codes you can generate." },
          { q: "What can I encode in a QR code?", a: "Any text string — URLs, plain messages, or formatted data like WiFi credentials or vCard text — just enter it exactly as you want it decoded." },
          { q: "Can I customize the color or add a logo to my QR code?", a: "Currently you can adjust the size only; color and logo customization aren't supported yet." },
          { q: "Is my data private?", a: "Yes. The QR code is generated entirely in your browser — nothing you type is sent to a server." }
        ]}
        tips={[
          "Use a larger size (300px or more) for QR codes that will be printed small or viewed from a distance, like on posters.",
          "Keep the encoded text as short as possible — shorter data produces a simpler, more reliably scannable code.",
          "Test the QR code with your phone's camera before printing or publishing it widely.",
          "Regenerate and re-download the code any time you edit the text, since it doesn't update automatically."
        ]}
      />
    </div>
  );
}