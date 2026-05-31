'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioBoosterPage() {
  const [file, setFile] = useState(null);
  const [volume, setVolume] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const boost = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      ffmpeg.FS('writeFile', 'input.mp3', await fetchFile(file));
      await ffmpeg.run('-i', 'input.mp3', '-af', `volume=${volume}`, 'output.mp3');
      const data = ffmpeg.FS('readFile', 'output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setResult({ url, name: 'boosted_' + file.name });
    } catch(e) { setError('Boost failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Booster</h1>
        <p className="text-neutral-500 text-center mb-8">Boost and increase audio volume</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Volume Boost: {volume}x</label>
            <input type="range" min={1} max={5} step={0.5} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-neutral-400 mt-1"><span>1x (normal)</span><span>5x (max)</span></div>
          </div>
          <button onClick={boost} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Boosting...' : 'Boost Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
