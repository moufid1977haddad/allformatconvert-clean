'use client';
import { useState, useRef } from 'react';

export default function QrScannerPage() {
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const scanFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setStatus('Scanning...');
    setResult('');
    try {
      const jsQR = (await import('jsqr')).default;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setResult(code.data);
          setStatus('');
        } else {
          setStatus('No QR code found in image');
        }
        setLoading(false);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">QR Code Scanner</h1>
        <p className="text-neutral-500 text-center mb-8">Scan and decode QR codes from images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop a QR code image here</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={scanFile} />
          </div>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 space-y-3">
              <div className="text-green-400 text-xl font-bold text-center">QR Code Found!</div>
              <p className="text-center break-all">{result}</p>
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Qr Scanner</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">QR Scanner is a free online tool that instantly decodes QR codes without requiring any software installation or registration. Simply upload an image or scan a QR code directly from your device to retrieve the encoded information in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Qr Scanner</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the QR Scanner website and choose between uploading an image file or using your device's camera</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>If uploading, select a QR code image from your computer or mobile device and wait for processing</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>If using the camera option, allow browser permissions and point your device at the QR code</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>View the decoded information instantly, including URLs, text, contact details, or any other encoded data</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is QR Scanner free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, QR Scanner is completely free and requires no registration or payment to decode unlimited QR codes.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to download any software?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, QR Scanner is a web-based tool that works directly in your browser without any downloads or installations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of QR codes can it scan?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">QR Scanner can decode standard QR codes containing URLs, text, phone numbers, emails, contact information, Wi-Fi credentials, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using QR Scanner?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, QR Scanner processes data locally in your browser and does not store or transmit your scanned information to external servers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure the QR code image is clear, well-lit, and not distorted or damaged</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If using the camera feature, hold your device steady and allow adequate lighting for accurate scanning</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>You can scan multiple QR codes in succession without needing to refresh the page</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always verify URLs and contact information decoded from QR codes before clicking or saving them</li>
          </ul>
        </div>
      </div>
    </div>
  );
}