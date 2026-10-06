'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { unreadableImageMessage } from '../../../lib/fileChecks';
import { reportShownMessage } from '../../../lib/useToolError';

// Scans a QR code from an image (file, drop, paste) or, added 26/09/2026, live from the camera -- what the
// reference scanners offer first (their page opens on the camera). The box used to say "drop" without handling it.
const SCAN_EVERY_MS = 100; // ~10 reads a second
const SCAN_MAX_SIDE = 800; // frames downscaled for jsQR: a phone camera's 1920 px frame is slow and no easier to read

export default function QrScannerPage() {
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [camera, setCamera] = useState(false); // live camera on
  const [cameras, setCameras] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const videoRef = useRef();
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const jsqrRef = useRef(null);

  const found = (text) => { setResult(text); setStatus(''); };
  const [others, setOthers] = useState([]); // P24: the other codes zxing found in the same picture
  const zxingRead = (imageData) => new Promise((resolve) => {
    const w = new Worker(new URL('./scan.worker.js', import.meta.url), { type: 'module' });
    const t = setTimeout(() => { w.terminate(); resolve(null); }, 20000);
    w.onmessage = ({ data }) => { clearTimeout(t); w.terminate(); resolve(data.ok ? data.codes : null); };
    w.onerror = () => { clearTimeout(t); w.terminate(); resolve(null); };
    w.postMessage({ id: 1, image: imageData });
  });
  const stopCamera = () => {
    clearTimeout(timerRef.current); timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamera(false);
  };
  useEffect(() => () => stopCamera(), []);

  const decode = async (source, w, h) => {
    jsqrRef.current ??= (await import('jsqr')).default;
    const k = Math.min(1, SCAN_MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsqrRef.current(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' });
  };

  const scanFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus(`"${file.name}" is not an image.`); return; }
    stopCamera(); setLoading(true); setStatus('Scanning...'); setResult(''); setOthers([]);
    const url = URL.createObjectURL(file);
    let opened = false; // the picture itself opened: a later failure is not the file's fault
    try {
      const img = new Image();
      await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = url; });
      opened = true;
      // Full resolution first (small or distant codes), then downscaled.
      jsqrRef.current ??= (await import('jsqr')).default;
      // At most 12 Mpx (30/09): a 24/48 MP iPhone photo on one canvas fails on iOS (16.7 Mpx per canvas at most);
      // a QR code in such a photo stays several pixels per module at 12 Mpx.
      const iw = img.naturalWidth || 1024, ih = img.naturalHeight || 1024; // an SVG without width / height reports 0
      const k = Math.min(1, Math.sqrt(12e6 / (iw * ih)));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(iw * k)); c.height = Math.max(1, Math.round(ih * k));
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      // zxing first: every format and every code in the picture; jsQR (QR only) if zxing finds nothing or cannot load
      const codes = await zxingRead(d);
      if (codes && codes.length) { found(codes[0].text); setOthers(codes); }
      else {
        const code = jsqrRef.current(d.data, d.width, d.height) || await decode(img, iw, ih);
        if (code) found(code.data); else setStatus('No QR code or barcode found in this image');
      }
    } catch (e) {
      reportShownMessage(e);
      // P23: why the picture did not open, or what failed after it did (not just "could not load")
      setStatus(opened ? `Could not scan this image: ${e?.message || e}. Please try again.` : await unreadableImageMessage(file).catch(() => 'This image could not be opened.'));
    } finally { URL.revokeObjectURL(url); setLoading(false); }
  };

  const startCamera = async (id = deviceId) => {
    setResult(''); setStatus('');
    if (!navigator.mediaDevices?.getUserMedia) { setStatus(window.isSecureContext ? 'This browser does not give web pages access to a camera. Upload a photo of the code instead.' : 'This browser cannot use a camera here (a camera needs a secure https page). Upload a photo of the code instead.'); return; }
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: id ? { deviceId: { exact: id } } : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream; setCamera(true);
      const v = videoRef.current; v.srcObject = stream; await v.play();
      const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
      setCameras(list); setDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId || id || '');
      setStatus('Point the camera at a QR code…');
      const tick = async () => {
        if (!streamRef.current) return;
        if (v.videoWidth) {
          const code = await decode(v, v.videoWidth, v.videoHeight);
          if (code && code.data !== '') { found(code.data); stopCamera(); return; }
        }
        timerRef.current = setTimeout(tick, SCAN_EVERY_MS);
      };
      tick();
    } catch (e) {
      reportShownMessage(e);
      stopCamera();
      const n = e?.name;
      setStatus(n === 'NotAllowedError' ? 'Camera access was refused. Allow the camera for this site in your browser settings, or upload a photo of the code.'
        : n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'NotSupportedError' ? 'No camera was found. Upload a photo of the code instead.'
          : n === 'NotReadableError' ? 'The camera is in use by another app. Close it and try again, or upload a photo of the code.'
            : `The camera could not be started (${e?.message || n || 'unknown error'}). Upload a photo of the code instead.`);
    }
  };

  useEffect(() => { // paste an image (screenshot) anywhere on the page
    const onPaste = (e) => {
      const cd = e.clipboardData; if (!cd) return;
      const f = [...(cd.files || [])].find((x) => x.type.startsWith('image/'))
        || [...(cd.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'))?.getAsFile();
      if (f) { e.preventDefault(); scanFile(f); }
    };
    window.addEventListener('paste', onPaste); return () => window.removeEventListener('paste', onPaste);
  }, []);

  // iPhone (owner, 30/09): a long press on the drop zone offered no "Paste" -- iOS only shows it on editable
  // fields. So, as QR scanners with a paste feature do (scanqr.org, qrcodescan.in: a "Paste" button, and an
  // editable box), two ways: the button reads the clipboard (Async Clipboard API, Safari 13.1+: iOS shows its own
  // "Paste" confirmation), and the box below is editable, so a long press there offers "Paste".
  const pasteButton = async () => {
    setResult(''); setStatus('');
    if (!navigator.clipboard?.read) { setStatus('This browser does not let pages read an image from the clipboard. Long-press (or right-click) the paste box below and choose Paste, or upload the image.'); return; }
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) { const blob = await item.getType(type); scanFile(new File([blob], 'pasted.' + type.split('/')[1], { type })); return; }
      }
      setStatus('The clipboard holds no image. Copy the QR code image first (in Photos: Share, then Copy), then tap Paste image again.');
    } catch (e) {
      reportShownMessage(e);
      setStatus(e?.name === 'NotAllowedError' ? 'Pasting was not allowed. Tap Paste image again and choose Paste when your browser asks, or long-press the paste box below.' : 'The clipboard could not be read. Long-press the paste box below and choose Paste, or upload the image.');
    }
  };
  const onPasteBox = (e) => {
    e.preventDefault(); e.stopPropagation();
    const cd = e.clipboardData;
    const f = [...(cd?.files || [])].find((x) => x.type.startsWith('image/'))
      || [...(cd?.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'))?.getAsFile();
    e.currentTarget.textContent = '';
    if (f) scanFile(f); else setStatus('What you pasted is not an image. Copy the QR code image itself, then paste it here.');
  };

  const isLink = /^https?:\/\/\S+$/i.test(result);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">QR Code Scanner</h1>
        <p className="text-neutral-500 text-center mb-8">Scan QR codes with your camera, or QR codes and barcodes from an image</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {camera
              ? <button type="button" onClick={stopCamera} className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold">Stop camera</button>
              : <button type="button" onClick={() => startCamera()} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold">Scan with camera</button>}
            <button type="button" onClick={() => inputRef.current.click()} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl py-3 font-semibold">Upload an image</button>
            <button type="button" onClick={pasteButton} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl py-3 font-semibold">Paste image</button>
          </div>
          <div className={camera ? 'space-y-2' : 'hidden'}>
            <video ref={videoRef} playsInline muted className="w-full rounded-xl bg-black" aria-label="Camera view" />
            {cameras.length > 1 && <label className="flex items-center gap-2 text-sm text-neutral-600">Camera
              <select id="qs-camera" value={deviceId} onChange={(e) => { setDeviceId(e.target.value); startCamera(e.target.value); }} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                {cameras.map((c, i) => <option key={c.deviceId || i} value={c.deviceId}>{c.label || `Camera ${i + 1}`}</option>)}
              </select></label>}
          </div>
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-500'}`}
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); scanFile(e.dataTransfer.files?.[0]); }}
            data-dropzone
          >
            <p className="text-neutral-500">Click, drop or paste (Ctrl+V) a QR code image here</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; scanFile(f); }} />
          </div>
          <div
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Paste box: paste a QR code image here"
            data-pastebox
            onPaste={onPasteBox}
            onInput={(e) => { e.currentTarget.textContent = ''; }}
            className="border border-neutral-200 rounded-xl px-4 py-3 text-center text-sm text-neutral-400 focus:outline-none focus:border-indigo-500 empty:before:content-[attr(data-placeholder)]"
            data-placeholder="Paste box — on a phone, long-press here and choose Paste"
          />
          {status && <p className="text-center text-amber-700 text-sm" role="status">{loading ? 'Scanning...' : status}</p>}
          {others.length > 1 && (
            <div className="text-sm text-left bg-neutral-50 border border-neutral-200 rounded-lg p-3" data-codes>
              <div className="font-semibold text-neutral-700 mb-1">{others.length} codes found in this picture</div>
              <ul className="space-y-1">{others.map((c, k) => <li key={k} className="break-all"><span className="text-neutral-500">{c.format}:</span> <button type="button" className="text-indigo-600 hover:underline text-left" onClick={() => found(c.text)}>{c.text}</button></li>)}</ul>
            </div>
          )}
          {others.length === 1 && <p className="text-xs text-neutral-500" data-codes>Read as {others[0].format}.</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 space-y-3" data-result>
              <div className="text-green-700 text-xl font-bold text-center">{others.some((c) => !/QR/i.test(c.format)) ? 'Code Found!' : 'QR Code Found!'}</div>
              <p className="text-center break-all" data-text>{result}</p>
              <div className={`grid gap-2 ${isLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy</button>
                {isLink && <a href={result} target="_blank" rel="noopener noreferrer nofollow" className="block text-center bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-2 font-semibold">Open link</a>}
              </div>
              {isLink && <p className="text-xs text-neutral-500 text-center">Check the address before opening it: QR codes can hide malicious links.</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="QR Code Scanner"
        description={`QR Code Scanner reads codes in three ways: live from your phone or laptop camera, from a picture you upload or drop, or from a screenshot you paste. The camera reads QR codes with jsQR. A picture goes to zxing-cpp first, which also finds barcodes such as EAN-13, UPC, Code 128, Data Matrix, PDF417 and Aztec, up to 20 in one image, then to jsQR if nothing was found. The decoded text appears with a Copy button, and web addresses get an Open link button. Pictures and camera frames are decoded in your browser.`}
        howToTitle="How to scan a QR code from the camera or a picture"
        howTo={[
          `Click "Scan with camera" and allow the camera; scanning stops by itself once a QR code is read, and "Camera" switches lenses when you have several.`,
          `Or click "Upload an image", drop a picture on the dashed box, or press Ctrl+V to paste a screenshot.`,
          `On a phone, copy the picture (in Photos: Share, then Copy), then tap "Paste image" or long-press the paste box and choose Paste.`,
          `Read the text, pick another code if several were found, then use "Copy" or "Open link".`,
        ]}
        specs={[
          { label: 'Image input', value: 'Any picture your browser can open (image/*); pictures above 12 megapixels are reduced to 12 before reading' },
          { label: 'Formats read in pictures', value: 'QR Code, Micro QR, Data Matrix, Aztec, PDF417, EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Code 93, ITF, Codabar and the other formats of zxing-cpp' },
          { label: 'Codes per picture', value: 'Up to 20, each listed with its format' },
          { label: 'Live camera', value: 'QR codes only, about ten reads a second; needs an https page and your permission' },
          { label: 'Time limit', value: 'zxing-cpp gives up after 20 seconds, then jsQR tries the picture' },
        ]}
        privacyTitle="Where your image is processed"
        privacy="Pictures and camera frames are decoded on your device, by zxing-cpp, a WebAssembly file served from this site, and by jsQR; no image, frame or decoded text is uploaded. When a camera, clipboard or picture error is shown, its message, cleaned of names and long numbers, is sent to our error log with the tool's name and your browser's name and major version."
        faqs={[
          { q: 'Can it read barcodes, not only QR codes?', a: 'Yes, from a picture: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Code 93, ITF, Codabar, Data Matrix, PDF417, Aztec and Micro QR among others, up to 20 in one image, each shown with its format. The live camera reads QR codes only.' },
          { q: 'Can I scan without giving camera access?', a: 'Yes. Upload, drop or paste a photo or a screenshot instead. The camera needs a secure https page and your permission; when access is refused, no camera is found or another app is using it, the page says which and suggests a photo.' },
          { q: 'Can it read a light code on a dark background?', a: 'Yes. Pictures are also tried with their colors inverted, and the camera reader tries every frame both as it is and inverted, so white codes on black screens or dark labels are found too.' },
          { q: 'Is it safe to open the link from a QR code?', a: 'No, not blindly: a code can hide a harmful address. The page shows the full text first, offers "Open link" only for http and https addresses, and opens it in a new tab without telling that site which page sent you.' },
        ]}
        tips={[
          'If a large photo fails, crop tightly around the code: a picture above 12 megapixels is reduced before reading, which shrinks a small code with it.',
          'To make a code of your own, use the QR Code Generator for QR codes or the Barcode Generator for EAN, UPC and the other types.',
        ]}
      />
    </div>
  );
}
