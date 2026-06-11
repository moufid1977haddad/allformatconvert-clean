'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

const formats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'opus'];

export default function AudioConverterPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      const inputName = 'input.' + file.name.split('.').pop();
      const outputName = 'output.' + format;
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      await ffmpeg.run('-i', inputName, outputName);
      const data = ffmpeg.FS('readFile', outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/' + format }));
      setResult({ url, name: file.name.replace(/\.[^.]+$/, '') + '.' + format });
    } catch(e) {
      setError('Conversion failed: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert audio to MP3, WAV, AAC, FLAC and more</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {formats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download {result.name}</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Converter is a free online tool that allows you to convert audio files between multiple formats including MP3, WAV, FLAC, AAC, and OGG without installing any software. Simply upload your audio file, select your desired output format, and download the converted file instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Converter website and click the 'Upload File' button to select an audio file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired output format from the dropdown menu of supported audio formats</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to start the conversion process, which typically completes within seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted audio file by clicking the 'Download' button and save it to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Audio Converter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Converter is completely free with no hidden charges, registration requirements, or premium features. You can convert unlimited files at no cost.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Converter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Converter supports all major audio formats including MP3, WAV, FLAC, AAC, OGG, M4A, WMA, and many others. Check the website for the complete list of supported formats.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is it safe to upload my audio files to Audio Converter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your files are processed securely and automatically deleted from our servers after conversion. We do not store or share your personal audio files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use Audio Converter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No installation is required. Audio Converter is a web-based tool that works directly in your browser on Windows, Mac, or Linux devices.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch convert multiple audio files at once by uploading several files simultaneously to save time</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust audio quality and bitrate settings before conversion to optimize file size and sound quality for your needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Audio Converter to convert audio from video files by extracting the audio track and converting it to your preferred format</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark the Audio Converter website for quick access and consider clearing your browser cache periodically for optimal performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}