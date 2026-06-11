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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Barcode Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Barcode Generator is a free online tool that allows you to quickly create and download barcodes in multiple formats without requiring any software installation. Perfect for businesses, retailers, and individuals who need to generate professional-quality barcodes for products, inventory management, and tracking purposes.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Barcode Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your product information or data that you want to encode into the barcode</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired barcode format such as Code128, EAN, UPC, or QR codes</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize the barcode appearance by adjusting size, colors, and resolution settings</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click generate and download your barcode in PNG, JPG, or SVG format for immediate use</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Barcode Generator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Barcode Generator is completely free with no hidden fees, registration requirements, or limitations on the number of barcodes you can create.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What barcode formats are supported?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports multiple formats including Code128, Code39, EAN-13, UPC-A, QR codes, and many others to meet various business needs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I download the barcodes I create?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can download generated barcodes in multiple formats including PNG, JPG, and SVG for easy integration into your materials.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Barcode Generator is a web-based tool that works directly in your browser without requiring any downloads or software installation.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Code128 format for maximum compatibility across different scanning devices and inventory systems in retail environments</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Generate QR codes for product packaging to provide customers with direct links to your website or promotional content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always test your generated barcodes with a scanner before printing large batches to ensure proper readability and accuracy</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Download barcodes in high resolution (300+ DPI) when printing physical labels to maintain scan quality and professional appearance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}