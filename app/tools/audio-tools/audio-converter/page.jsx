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
    </div>
  );
}
