'use client';
import { useState, useRef } from 'react';

export default function BarcodeGeneratorPage() {
  const [text, setText] = useState('');
  const [format, setFormat] = useState('CODE128');
  const [status, setStatus] = useState('');
  const [barcodeUrl, setBarcodeUrl] = useState('');
  const canvasRef = useRef(null);

  const generate = async () => {
    if (!text) return;
    setStatus('Generating...');
    setBarcodeUrl('');
    try {
      const JsBarcode = (await import('jsbarcode')).default;
      const canvas = canvasRef.current;
      JsBarcode(canvas, text, {
        format,
        width: 2,
        height: 100,
        displayValue: true,
        background: '#ffffff',
        lineColor: '#000000',
      });
      setBarcodeUrl(canvas.toDataURL());
      setStatus('');
    } catch (err) {
      if (format === 'EAN13') setStatus('EAN13 requires exactly 12 or 13 digits');
else if (format === 'EAN8') setStatus('EAN8 requires exactly 7 or 8 digits');
else if (format === 'UPC') setStatus('UPC requires exactly 11 or 12 digits');
else setStatus('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Barcode Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate barcodes for products</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Text or Number</label>
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Enter text or number..." />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <option value="CODE128">CODE128</option>
              <option value="EAN13">EAN13</option>
              <option value="EAN8">EAN8</option>
              <option value="UPC">UPC</option>
              <option value="CODE39">CODE39</option>
            </select>
          </div>
          <button onClick={generate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Generate Barcode</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          <div className="flex justify-center bg-white rounded-xl p-4">
            <canvas ref={canvasRef} />
          </div>
          {barcodeUrl && (
            <a href={barcodeUrl} download="barcode.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download Barcode</a>
          )}
        </div>
      </div>
    </div>
  );
}