'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

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
    const canvas = canvasRef.current;
    try {
      const JsBarcode = (await import('jsbarcode')).default;
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
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const message = typeof err === 'string' ? err : err.message;
      setStatus(message || 'Failed to generate barcode');
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
          <button onClick={generate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Generate Barcode</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          <div className="flex justify-center bg-white rounded-xl p-4">
            <canvas ref={canvasRef} />
          </div>
          {barcodeUrl && (
            <a href={barcodeUrl} download="barcode.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download Barcode</a>
          )}
        </div>
      </div>
      <SeoContent
        title="Barcode Generator"
        description="Barcode Generator is a free online tool that creates scannable barcodes directly in your browser — no software installation, no signup, and no data ever leaves your device. Choose from the most common retail and inventory formats (CODE128, EAN-13, EAN-8, UPC, and CODE39) to label products, track stock, or generate codes for shipping and asset management."
        howTo={[
          "Type the text or number you want to encode into the input field.",
          "Choose a barcode format that matches your use case: CODE128, EAN-13, EAN-8, UPC, or CODE39.",
          "Click \"Generate Barcode\" to render it instantly in your browser.",
          "Download the barcode as a PNG image and use it in labels, packaging, or documents."
        ]}
        faqs={[
          { q: "Is Barcode Generator free to use?", a: "Yes, it's completely free with no signup and no limit on how many barcodes you can generate." },
          { q: "Which barcode formats are supported?", a: "CODE128, EAN-13, EAN-8, UPC, and CODE39 — the formats most commonly used for retail products, inventory, and shipping labels." },
          { q: "Why do I get an error when generating an EAN or UPC barcode?", a: "EAN-13 requires exactly 12–13 digits, EAN-8 requires 7–8 digits, and UPC requires 11–12 digits. Double-check your input matches the format's required length." },
          { q: "Is my data private?", a: "Yes. The barcode is rendered entirely in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "Use CODE128 for general-purpose alphanumeric data — it's the most widely compatible format across scanners.",
          "For EAN-13, EAN-8, or UPC, count your digits carefully before generating to avoid format errors.",
          "Always test a printed barcode with a real scanner before printing large batches of labels.",
          "Download the barcode at a large size for the clearest print quality on physical labels."
        ]}
      />
    </div>
  );
}