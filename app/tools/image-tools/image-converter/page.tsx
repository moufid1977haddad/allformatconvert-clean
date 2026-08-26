'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Lock, Zap, Package, Folder, Image as ImageIcon } from 'lucide-react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_MEGAPIXELS, MOBILE_MAX_MEGAPIXELS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

interface ConvertedFile {
  originalName: string;
  originalSize: number;
  convertedBlob: Blob;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const maxMegapixels = isMobile ? MOBILE_MAX_MEGAPIXELS : MAX_MEGAPIXELS;
  const maxFileBytes = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxFileLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;

  const addFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter(f => f.type.startsWith('image/'));
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

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setProcessing(false);
    setProgress(0);
  };

  const handleConvert = () => {
    setProcessing(true);
    setProgress(0);
    setError('');
    const results: ConvertedFile[] = [];
    const failures: string[] = [];

    const worker = new Worker(new URL('./imageConverter.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'file-done') {
        results.push({ originalName: msg.name, originalSize: msg.originalSize, convertedBlob: msg.blob, convertedSize: msg.convertedSize });
        setConverted([...results]);
      } else if (msg.type === 'file-error') {
        failures.push(`${msg.name}: ${msg.message}`);
        setError(`${failures.length} file${failures.length > 1 ? 's' : ''} failed to convert:\n` + failures.join('\n'));
      } else if (msg.type === 'done') {
        setProcessing(false);
        workerRef.current = null;
      } else if (msg.type === 'error') {
        setProcessing(false);
        workerRef.current = null;
        setError('Conversion failed: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setProcessing(false);
      workerRef.current = null;
      setError('Conversion failed: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage({ files, format, quality, maxMegapixels });
  };

  const downloadOne = (item: ConvertedFile) => {
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.originalName.replace(/\.[^.]+$/, '.' + format);
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    converted.forEach(item => downloadOne(item));
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setConverted([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold text-center mb-2">Image Converter</h1>
        <p className="text-neutral-500 text-center mb-2">Convert images to PNG, JPG, WebP or AVIF — 100% local, nothing uploaded to any server.</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Each image up to {maxMegapixels} megapixels{isMobile ? ' on this device' : ''} (files up to {maxFileLabel}). Conversion runs in the background — this tab stays responsive.</p>

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
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                addFiles(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
            <Folder className="w-10 h-10 mb-3 mx-auto text-neutral-400" />
            <p className="text-neutral-700 font-semibold text-lg">Drop your images here</p>
            <p className="text-neutral-400 text-sm mt-1">or click to browse — PNG, JPG, WebP, AVIF, GIF, BMP, TIFF</p>
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
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      disabled={processing}
                      className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="webp">WebP</option>
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="avif">AVIF</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-neutral-500 block mb-1">Quality: <span className="font-semibold text-indigo-500">{quality}%</span></label>
                    <input
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-neutral-800">Results</h3>
                {converted.length > 1 && !processing && (
                  <button
                    onClick={downloadAll}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                  >
                    Download all
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {converted.map((item, idx) => {
                  const gain = Math.round((1 - item.convertedSize / item.originalSize) * 100);
                  return (
                    <div key={idx} className="flex items-center justify-between bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.originalName.replace(/\.[^.]+$/, '.' + format)}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {formatSize(item.originalSize)} → {formatSize(item.convertedSize)}
                          {gain > 0 && <span className="text-green-600 dark:text-green-400 ml-1">({gain}% smaller)</span>}
                          {gain < 0 && <span className="text-orange-500 ml-1">({Math.abs(gain)}% larger)</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadOne(item)}
                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Download
                      </button>
                    </div>
                  );
                })}
              </div>
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
        description="Image Converter is a free online tool that converts images between PNG, JPG, WebP, and AVIF entirely in your browser — nothing is ever uploaded to a server. Drop in one or many images, pick your target format and quality, and download the results instantly, with a live before/after size comparison for every file. Conversion runs in a background Web Worker so the page stays responsive even on large batches."
        howTo={[
          "Drop or click to upload one or more images (PNG, JPG, WebP, AVIF, GIF, BMP, or TIFF are all accepted).",
          "Choose your output format: WebP, PNG, JPG, or AVIF.",
          "Adjust the quality slider to balance file size against image quality.",
          "Click Convert, then download each result individually or use \"Download all\" for the whole batch."
        ]}
        faqs={[
          { q: "Is Image Converter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Are my images uploaded anywhere?", a: "No. Every conversion happens locally in your browser, in a background Web Worker — your files never leave your device." },
          { q: "Which formats are supported?", a: "You can upload PNG, JPG, WebP, AVIF, GIF, BMP, or TIFF images, and convert them to WebP, PNG, JPG, or AVIF." },
          { q: "Can I convert several images at once?", a: "Yes, you can add multiple files and convert them all in one batch, then download them individually or together." },
          { q: "Is there an image-size limit?", a: `Yes: each image can be up to ${MAX_MEGAPIXELS} megapixels on desktop (${MOBILE_MAX_MEGAPIXELS} on phones and tablets), measured against how long large images take to encode in the browser — WebP in particular gets dramatically slower past a certain size. There's no limit on how many images you can batch-convert, since they're processed one at a time.` }
        ]}
        tips={[
          "WebP usually gives the best balance of quality and file size for web use — a solid default choice.",
          "The quality slider only affects lossy formats (JPG, WebP, AVIF); PNG output is always lossless, so it won't change PNG file size.",
          "AVIF encoding support varies by browser — if a conversion to AVIF fails, WebP is a reliable alternative with similarly small files.",
          "Check the size comparison shown next to each result (green for smaller, orange for larger) before choosing which files to keep."
        ]}
      />
    </div>
  );
}
