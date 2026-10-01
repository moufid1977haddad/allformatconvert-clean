'use client';
import { sizeChangeText, whyLarger } from '../../../lib/sizeChange';
import { decodeSpecialImage, isSpecialImage, SPECIAL_ACCEPT } from '../../../lib/specialImageDecode';
import { isRawFile, RAW_ACCEPT } from '../../../lib/rawFormats';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Lock, Zap, Package, Folder, Image as ImageIcon } from 'lucide-react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_MEGAPIXELS, MOBILE_MAX_MEGAPIXELS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { TIFF_DECODE_TIMEOUT_MS, TIFF_DECODE_TIMEOUT_MESSAGE } from '../../../lib/tiffDecode';
import { reportToolError, extOf } from '../../../lib/reportError';
import { canEncodeImageType, extFromMime } from '../../../lib/mediaSupport';
import { imageDims } from '../../../lib/bigImage';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';

const GENERIC_CONVERSION_ERROR = 'Conversion failed. Please try again, or try a different file.';
const GENERIC_HEIC_ERROR = 'Failed to decode this HEIC/HEIF file. It may be corrupted or use a variant this tool doesn\'t support.';

interface ConvertedFile {
  originalName: string;
  originalSize: number;
  convertedBlob: Blob;
  note?: string;
  convertedSize: number;
}

export default function ImageConverterPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(80);
  const [converted, setConverted] = useState<ConvertedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  // Which output formats THIS browser can really encode. Probed, not assumed: Safari cannot encode WebP from a
  // canvas (it returns a PNG), so there WebP comes from libwebp in WebAssembly, as AVIF does everywhere.
  const [encodable, setEncodable] = useState<Record<string, boolean>>({ webp: true, png: true, jpg: true, avif: true });
  const [nativeWebp, setNativeWebp] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setNativeWebp(canEncodeImageType('image/webp'));
    const support = {
      webp: typeof WebAssembly === 'object' || canEncodeImageType('image/webp'),
      png: true,
      jpg: canEncodeImageType('image/jpeg'),
      // Browsers cannot encode AVIF from a canvas (measured), but the worker encodes it with WebAssembly.
      avif: typeof WebAssembly === 'object',
    };
    setEncodable(support);
    setFormat(prev => (support[prev as keyof typeof support] ? prev : 'png'));
  }, []);

  const maxMegapixels = isMobile ? MOBILE_MAX_MEGAPIXELS : MAX_MEGAPIXELS;
  const maxFileBytes = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxFileLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;

  const isRecognizedImage = (f: File) =>
    f.type.startsWith('image/') || /\.(heic|heif|tif|tiff)$/i.test(f.name) || isSpecialImage(f) || isRawFile(f);

  const addFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter(isRecognizedImage);
    const tooLarge = imageFiles.filter(f => f.size > maxFileBytes);
    const ok = imageFiles.filter(f => f.size <= maxFileBytes);
    setFiles(prev => [...prev, ...ok]);
    setConverted([]);
    if (tooLarge.length > 0) {
      setError(`${tooLarge.length} file${tooLarge.length > 1 ? 's' : ''} skipped for being over the ${maxFileLabel} limit${isMobile ? ' on this device' : ''}:\n` + tooLarge.map(f => f.name).join('\n'));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxFileBytes, isMobile]);

  const stopWorker = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  const cancel = () => {
    stopWorker();
    setProcessing(false);
    setProgress(0);
  };

  useEffect(() => () => stopWorker(), []);

  const isHeic = (f: File) => /^image\/heic|^image\/heif/.test(f.type) || /\.(heic|heif)$/i.test(f.name);

  const handleConvert = async () => {
    setProcessing(true);
    setProgress(0);
    setError('');
    const results: ConvertedFile[] = [];
    const failures: string[] = [];

    // HEIC/HEIF: Safari decodes it natively (iPhone photos), exactly like a JPEG -- including the 24 and 48 MP
    // ones, in bands. Other browsers can't: there heic2any (a <canvas>, main thread only) turns it into a PNG
    // first, which the worker then re-encodes like any other image.
    // dims = the displayed size read from the header by <img>: the worker needs it to decode a photo bigger than
    // Safari's 16.7 MP canvas limit band by band.
    const items: { name: string; originalSize: number; blob: Blob; dims: { width: number; height: number } | null; raw?: boolean }[] = [];
    for (const file of files) {
      // P22: camera RAW, developed by LibRaw in the worker (app/lib/rawDecode.js). Checked first: CR2, NEF, ARW, DNG...
      // are TIFF inside, and <img> or the TIFF decoder would only see the small preview they carry.
      if (isRawFile(file)) {
        items.push({ name: file.name, originalSize: file.size, blob: file, dims: null, raw: true });
        continue;
      }
      const dims = await imageDims(file);
      if (isSpecialImage(file)) {
        // P21: Photoshop PSD and SVG, decoded on the page (app/lib/specialImageDecode.js) into a lossless PNG first.
        try {
          const d = await decodeSpecialImage(file);
          items.push({ name: file.name, originalSize: file.size, blob: d.blob, dims: { width: d.width, height: d.height } });
        } catch (err: any) {
          reportToolError({ tool: 'image-converter', file, error: err instanceof Error ? err : new Error(String(err)) });
          failures.push(`${file.name}: ${String(err?.message || err)}.`);
        }
      } else if (isHeic(file) && !dims) {
        try {
          const heic2any = (await import('heic2any')).default;
          const decoded = await heic2any({ blob: file, toType: 'image/png' });
          const pngBlob = Array.isArray(decoded) ? decoded[0] : decoded;
          items.push({ name: file.name, originalSize: file.size, blob: pngBlob, dims: await imageDims(pngBlob) });
        } catch (err: any) {
          reportToolError({ tool: 'image-converter', file, error: err instanceof Error ? err : new Error(String(err)) });
          failures.push(`${file.name}: ${GENERIC_HEIC_ERROR}`);
        }
      } else {
        items.push({ name: file.name, originalSize: file.size, blob: file, dims });
      }
    }
    if (failures.length > 0) {
      setError(`${failures.length} file${failures.length > 1 ? 's' : ''} failed to convert:\n` + failures.join('\n'));
    }
    if (items.length === 0) {
      setProcessing(false);
      return;
    }

    const worker = new Worker(new URL('./imageConverter.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    // A single hung file (e.g. a non-standard TIFF UTIF2 loops forever on --
    // see app/lib/tiffDecode.js) would otherwise block the whole batch with
    // no way out but the manual Cancel button below. This re-arms on every
    // message the worker sends, so it only fires when the worker has gone
    // silent for the full timeout -- a large batch of many valid files
    // keeps resetting it as each one finishes, only a stuck one lets it run
    // out.
    // 'long' = the worker is about to run a WebAssembly encoder that cannot report progress; it says for how long
    // at most it may stay silent (scaled on the image's size).
    const armWatchdog = (ms: number = TIFF_DECODE_TIMEOUT_MS) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopWorker();
        setProcessing(false);
        setProgress(0);
        reportToolError({ tool: 'image-converter', error: new Error('decode_timeout') });
        setError(TIFF_DECODE_TIMEOUT_MESSAGE);
      }, ms);
    };

    worker.onmessage = (e) => {
      const msg = e.data;
      armWatchdog(msg.type === 'long' ? msg.ms : undefined);
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'file-done') {
        results.push({ originalName: msg.name, originalSize: msg.originalSize, convertedBlob: msg.blob, convertedSize: msg.convertedSize, note: msg.note });
        setConverted([...results]);
      } else if (msg.type === 'file-error') {
        // msg.message is already one of our own authored, user-safe
        // strings (built in imageConverter.worker.js) -- never a raw
        // browser/library exception -- so it's fine to show as-is. The
        // declared extension is logged via `file` below; only add the
        // sniffed real format when it actually differs, so tool_errors can
        // distinguish a genuine decode bug from a mislabeled upload -- see
        // docs/audit/RAPPORT-tiff-paint.md.
        failures.push(`${msg.name}: ${msg.message}`);
        const declaredExt = extOf(msg.name);
        const detectedExt = msg.detectedFormat && msg.detectedFormat !== declaredExt ? msg.detectedFormat : null;
        reportToolError({
          tool: 'image-converter',
          file: { name: msg.name, size: items[msg.index]?.originalSize },
          error: new Error(msg.message),
          detectedExt,
        });
        setError(`${failures.length} file${failures.length > 1 ? 's' : ''} failed to convert:\n` + failures.join('\n'));
      } else if (msg.type === 'done') {
        stopWorker();
        setProcessing(false);
      } else if (msg.type === 'error') {
        stopWorker();
        setProcessing(false);
        reportToolError({ tool: 'image-converter', error: new Error(msg.message) });
        setError(GENERIC_CONVERSION_ERROR);
      }
    };
    worker.onerror = (err) => {
      stopWorker();
      setProcessing(false);
      reportToolError({ tool: 'image-converter', error: new Error(err?.message || 'unknown worker error') });
      setError(GENERIC_CONVERSION_ERROR);
    };
    armWatchdog();
    // __forceBands: set only by scripts/browser-tests/big-image.mjs, to run the iPhone (band) path in Firefox.
    const forceBands = !!(window as any).__forceBands;
    worker.postMessage({ items: items.map(it => ({ ...it, forceBands })), format, quality, maxMegapixels, canvasCap: (window as any).__forceSafariCanvasCap === true });
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setConverted([]);
  };

  const formatSize = (bytes: number) => formatBytes(bytes);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold text-center mb-2">Image Converter</h1>
        <p className="text-neutral-500 text-center mb-2">Convert images to PNG, JPG, WebP or AVIF — 100% local, nothing uploaded to any server.</p>
        <p className="text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Each image up to {maxMegapixels} megapixels{isMobile ? ' on this device' : ''} (files up to {maxFileLabel}). Conversion runs in the background — this tab stays responsive.</p>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                : 'border-neutral-200 hover:border-indigo-500'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={`image/*,.heic,.heif,.tif,.tiff,${SPECIAL_ACCEPT},${RAW_ACCEPT}`}
              className="hidden"
              onChange={(e) => {
                addFiles(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
            <Folder className="w-10 h-10 mb-3 mx-auto text-neutral-400" />
            <p className="text-neutral-700 font-semibold text-lg">Drop your images here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse — PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, HEIC/HEIF, PSD, SVG and camera RAW (CR2, CR3, NEF, ARW, DNG, ORF, RW2, RAF…)</p>
          </div>

          {error && <p className="text-red-500 text-center text-sm whitespace-pre-line">{error}</p>}

          {/* File list */}
          {files.length > 0 && (
            <div>
              <h3 className="font-semibold text-neutral-700 mb-3">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
              <div className="space-y-2 mb-4">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-800 truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-neutral-400">{formatSize(file.size)}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(idx)} disabled={processing} className="text-neutral-400 hover:text-red-500 transition text-lg">✕</button>
                  </div>
                ))}
              </div>

              {/* Options */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-neutral-700 mb-4">Conversion options</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Output format</label>
                    <select
                      aria-label="Output format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      disabled={processing}
                      className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="webp" disabled={!encodable.webp}>WebP{encodable.webp ? '' : ' (needs WebAssembly)'}</option>
                      <option value="png">PNG</option>
                      <option value="jpg" disabled={!encodable.jpg}>JPG{encodable.jpg ? '' : ' (not supported by this browser)'}</option>
                      <option value="avif" disabled={!encodable.avif}>AVIF{encodable.avif ? '' : ' (not supported by this browser)'}</option>
                      <option value="gif">GIF</option>
                      <option value="bmp">BMP</option>
                      <option value="tiff">TIFF</option>
                      <option value="ico">ICO (favicon, 16–256 px)</option>
                      <option value="pdf">PDF</option>
                    </select>
                    {format === 'webp' && !nativeWebp && (
                      <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                        This browser has no WebP encoder of its own, so WebP is made here with libwebp in WebAssembly (the encoder Squoosh uses): a few seconds per photo, and the first use downloads about 0.3 MB.
                      </p>
                    )}
                    {format === 'avif' && (
                      <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                        AVIF is encoded with a WebAssembly encoder, so it is slower than the other formats (a few seconds per photo) and the first use downloads about 1 MB.
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-neutral-500 block mb-1">Quality: <span className="font-semibold text-indigo-500">{quality}%</span></label>
                    <input
                      aria-label="Quality (%)"
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      disabled={processing}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {processing ? (
                <div className="space-y-3">
                  <ProgressBar pct={progress} label="Converting…" />
                  <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={handleConvert}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition"
                >
                  {`Convert ${files.length} file${files.length > 1 ? 's' : ''} to ${format.toUpperCase()}`}
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {converted.length > 0 && (
            <div>
              <h3 className="font-bold text-neutral-800 mb-3">Results</h3>
              {/* Each result through the site's download component; several -> "Download all (ZIP)" (the old
                  "Download all" started one download per file, which iPhone Safari stops after the first). */}
              <DownloadGroup zipName="converted-images.zip">
                {converted.map((item, idx) => {
                  // Extension from the real type of the produced blob, never from the requested format.
                  const outName = item.originalName.replace(/\.[^.]+$/, '.' + extFromMime(item.convertedBlob.type, format));
                  // A larger result is not a failure (P21): one line says why it grew and what to choose instead.
                  const why = whyLarger({ from: item.originalName, to: outName, inBytes: item.originalSize, outBytes: item.convertedSize, kind: 'image' });
                  return (
                    <div key={idx} className="space-y-1">
                      <FileDownload blob={item.convertedBlob} name={outName}
                        note={`was ${formatSize(item.originalSize)}${sizeChangeText(item.originalSize, item.convertedSize)}${item.note ? ` · ${item.note}` : ''}`} />
                      {why && <p data-size-why className="text-xs text-neutral-600 dark:text-neutral-400 px-1">{why}</p>}
                    </div>
                  );
                })}
              </DownloadGroup>
            </div>
          )}

        </div>

        {/* Info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: Lock, title: '100% Private', desc: 'Files never leave your device' },
            { icon: Zap, title: 'Instant', desc: 'Conversion happens in your browser' },
            { icon: Package, title: 'Batch', desc: 'Convert multiple files at once' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-neutral-200 rounded-xl p-4">
              <Icon className="w-6 h-6 mb-1 mx-auto text-indigo-500" />
              <p className="font-semibold text-sm text-neutral-800">{title}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

      </div>
      <SeoContent
        title="Image Converter"
        description="Image Converter is a free online tool that converts images — including TIFF, iPhone HEIC/HEIF photos, Photoshop PSD, SVG and camera RAW files (Canon, Nikon, Sony, Fujifilm, Olympus, Panasonic, Pentax, iPhone ProRAW DNG…) — to PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, ICO (a multi-size favicon) or PDF entirely in your browser (AVIF is encoded with a WebAssembly encoder because no browser can encode it natively, and WebP too on Safari, which has no WebP encoder of its own) — nothing is ever uploaded to a server. Drop in one or many images, pick your target format and quality, and download the results instantly, with a live before/after size comparison for every file. Conversion runs in a background Web Worker so the page stays responsive even on large batches."
        howTo={[
          "Drop or click to upload one or more images (PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, HEIC/HEIF, PSD, SVG and camera RAW files are all accepted).",
          "Choose your output format: WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO or PDF.",
          "Adjust the quality slider to balance file size against image quality.",
          "Click Convert, then download each result individually or use \"Download all\" for the whole batch."
        ]}
        faqs={[
          { q: "Is Image Converter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Are my images uploaded anywhere?", a: "No. Every conversion happens locally in your browser, in a background Web Worker — your files never leave your device." },
          { q: "Can I make WebP on an iPhone or in Safari?", a: "Yes. Safari has no WebP encoder of its own (it would quietly produce a PNG), so on Safari the WebP file is made by libwebp compiled to WebAssembly — the same encoder Squoosh uses — right in your browser. The result is a real WebP file." },
          { q: "Which formats are supported?", a: "You can upload PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, HEIC/HEIF (iPhone photos), Photoshop PSD/PSB, SVG and camera RAW images, and convert them to WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO or PDF. GIF is limited to 256 colours (photos are dithered, as desktop converters do), BMP has no transparency (it is flattened onto white), ICO produces a favicon holding every standard size from 16 to 256 px, and PDF puts the image on a page of its own size. AVIF is encoded with a WebAssembly encoder (browsers cannot encode it natively), so it takes a few seconds per photo. TIFF is decoded with a dedicated in-browser decoder (planar-color-storage TIFFs aren't supported and are rejected with a clear error), and HEIC/HEIF is decoded on the main thread before being re-encoded to your chosen format." },
          { q: "Can it convert camera RAW files?", a: "Yes. RAW files are developed right in your browser at full resolution, with the white balance recorded by the camera, the camera's own colour matrix, sRGB colours and the orientation stored in the file. Accepted: Canon CR2, CR3 and CRW, Nikon NEF and NRW, Sony ARW, SRF and SR2, Adobe DNG (including iPhone ProRAW), Olympus/OM System ORF, Panasonic RW2, Leica RWL, Fujifilm RAF, Pentax PEF, Samsung SRW, Hasselblad 3FR, Phase One IIQ, Leaf MOS, Mamiya MEF, Epson ERF, Kodak KDC and DCR, and Minolta MRW. The first RAW file downloads the decoder once (about 0.35 MB); a 24-megapixel file takes a few seconds on a computer, Fujifilm X-Trans files longer. Sigma X3F (Foveon) files are refused: their colours cannot be developed correctly here. A damaged or incomplete RAW file is refused with a message, never turned into a wrong picture." },
          { q: "What reads the RAW files?", a: "LibRaw 0.22.2 (by LibRaw LLC, the library behind many photo applications), compiled to WebAssembly by us and used unmodified under the CDDL 1.0 licence — licence and source code at /wasm/libraw-LICENSE.txt." },
          { q: "Can I convert several images at once?", a: "Yes, you can add multiple files and convert them all in one batch, then download them individually or together." },
          { q: "Is there an image-size limit?", a: `Each image can be up to ${MAX_MEGAPIXELS} megapixels on a computer and ${MOBILE_MAX_MEGAPIXELS} on phones and tablets — every iPhone photo fits, 48-megapixel ones included — and files up to ${MAX_FILE_SIZE_LABEL}. Safari on iPhone cannot hold more than about 16.7 megapixels in one canvas, so a larger photo is decoded in strips and encoded by WebAssembly encoders at full resolution: it works, it just takes longer (about a minute or two for a 48-megapixel photo to WebP on a phone). There's no limit on how many images you can batch-convert, since they're processed one at a time.` }
        ]}
        tips={[
          "WebP usually gives the best balance of quality and file size for web use — a solid default choice.",
          "The quality slider only affects lossy formats (JPG, WebP and AVIF); PNG output is always lossless, so it won't change PNG file size.",
          "AVIF gives the smallest files of the four but takes a few seconds per photo, because it is encoded by a WebAssembly encoder; WebP is much faster.",
          "Check the size shown under each result: when the new format is larger (PNG is lossless; HEIC and WebP pack more than JPG), a line says why and what to pick for a smaller file."
        ]}
      />
    </div>
  );
}
