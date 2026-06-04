'use client';
import { useState, useCallback, useRef } from 'react';

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
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imageFiles]);
    setConverted([]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const convertImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        let mime = 'image/webp';
        if (format === 'jpg') mime = 'image/jpeg';
        if (format === 'png') mime = 'image/png';
        if (format === 'avif') mime = 'image/avif';
        canvas.toBlob((blob) => resolve(blob!), mime, quality / 100);
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const handleConvert = async () => {
    setProcessing(true);
    const results: ConvertedFile[] = [];
    for (const file of files) {
      const convertedBlob = await convertImage(file);
      results.push({
        originalName: file.name,
        originalSize: file.size,
        convertedBlob,
        convertedSize: convertedBlob.size,
      });
    }
    setConverted(results);
    setProcessing(false);
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
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Image Converter</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Convert images to PNG, JPG, WebP or AVIF — 100% local, nothing uploaded to any server.</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-neutral-50 dark:bg-neutral-900'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => addFiles(Array.from(e.target.files || []))}
          />
          <div className="text-4xl mb-3">📁</div>
          <p className="text-neutral-700 dark:text-neutral-300 font-semibold text-lg">Drop your images here</p>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">or click to browse — PNG, JPG, WebP, AVIF, GIF, BMP, TIFF</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
            <div className="space-y-2 mb-6">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🖼️</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-neutral-400">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-neutral-400 hover:text-red-500 transition text-lg">✕</button>
                </div>
              ))}
            </div>

            {/* Options */}
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Conversion options</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Output format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-400"
                  >
                    <option value="webp">WebP</option>
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="avif">AVIF</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Quality: <span className="font-semibold text-indigo-500">{quality}%</span></label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={processing}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-base"
            >
              {processing ? '⏳ Converting...' : `✨ Convert ${files.length} file${files.length > 1 ? 's' : ''} to ${format.toUpperCase()}`}
            </button>
          </div>
        )}

        {/* Results */}
        {converted.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-neutral-800 dark:text-white">Results</h3>
              {converted.length > 1 && (
                <button
                  onClick={downloadAll}
                  className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  ⬇️ Download all
                </button>
              )}
            </div>
            <div className="space-y-3">
              {converted.map((item, idx) => {
                const gain = Math.round((1 - item.convertedSize / item.originalSize) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.originalName.replace(/\.[^.]+$/, '.' + format)}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {formatSize(item.originalSize)} → {formatSize(item.convertedSize)}
                        {gain > 0 && <span className="text-green-600 dark:text-green-400 ml-1">({gain}% smaller)</span>}
                        {gain < 0 && <span className="text-orange-500 ml-1">({Math.abs(gain)}% larger)</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadOne(item)}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      ⬇️ Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: '🔒', title: '100% Private', desc: 'Files never leave your device' },
            { icon: '⚡', title: 'Instant', desc: 'Conversion happens in your browser' },
            { icon: '📦', title: 'Batch', desc: 'Convert multiple files at once' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{title}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
