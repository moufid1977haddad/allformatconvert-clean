'use client';
import { useState, useEffect, useRef } from 'react';

export default function QrGeneratorPage() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);
  const [qrUrl, setQrUrl] = useState('');
  const canvasRef = useRef(null);

  const generate = async () => {
    if (!text) return;
    const QRCode = (await import('qrcode')).default;
    const canvas = canvasRef.current;
    await QRCode.toCanvas(canvas, text, { width: size, margin: 2 });
    setQrUrl(canvas.toDataURL());
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
          <button onClick={generate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Generate QR Code</button>
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>
          {qrUrl && (
            <a href={qrUrl} download="qrcode.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download QR Code</a>
          )}
        </div>
      </div>
    </div>
  );
}