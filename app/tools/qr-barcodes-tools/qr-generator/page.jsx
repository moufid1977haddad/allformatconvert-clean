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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Qr Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">QR Generator is a free online tool that instantly converts text, URLs, and other data into scannable QR codes. Create professional QR codes in seconds without downloading software or paying for subscriptions.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Qr Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your text, URL, or data into the input field on the QR Generator homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Customize your QR code by selecting size, color, and format preferences if desired</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Generate button to create your unique QR code instantly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your QR code as PNG, JPG, or SVG format and use it anywhere you need</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is QR Generator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, QR Generator is completely free with no hidden charges, registration requirements, or premium plans. You can generate unlimited QR codes at no cost.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What information can I encode in a QR code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can encode URLs, text, phone numbers, email addresses, WiFi credentials, vCard contact information, and much more into your QR codes.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the appearance of my QR code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, QR Generator allows you to customize colors, size, and design elements to match your branding while maintaining scannability.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install anything to use QR Generator?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No installation is required. QR Generator is a web-based tool that works directly in your browser on any device with internet access.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use contrasting colors for your QR code to ensure it scans reliably on all devices and in different lighting conditions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your QR code with multiple smartphone cameras before sharing it widely to verify functionality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Include a clear call-to-action near your QR code to encourage people to scan it and understand what it leads to</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Generate QR codes with adequate white space around them for optimal scanning performance and better user experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}