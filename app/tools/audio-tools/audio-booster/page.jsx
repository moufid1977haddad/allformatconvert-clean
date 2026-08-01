'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function AudioBoosterPage() {
  const [file, setFile] = useState(null);
  const [volume, setVolume] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); };

  const boost = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      await ffmpeg.writeFile('input.mp3', await fetchFile(file));
      await ffmpeg.exec(['-i', 'input.mp3', '-af', `volume=${volume}`, 'output.mp3']);
      const data = await ffmpeg.readFile('output.mp3');
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
      <SeoContent
        title="Audio Booster"
        description="Audio Booster amplifies an audio file's volume using a simple gain multiplier (1x–5x), processed entirely in your browser via ffmpeg.wasm (WebAssembly) — nothing is uploaded to a server. Output is always encoded as MP3."
        howTo={[
          "Click the upload area and select an audio file.",
          "Set your desired boost level using the slider (1x–5x).",
          "Click \"Boost Audio\" — the first use downloads the ffmpeg processing engine, so it may take a moment.",
          "Preview the result, then download the boosted MP3."
        ]}
        faqs={[
          { q: "What does the boost actually do?", a: "It applies a straightforward volume/gain multiplier to the whole file via ffmpeg — it's not adaptive loudness normalization, so high boost levels can cause clipping or distortion." },
          { q: "What output format do I get?", a: "Always MP3, regardless of the format you uploaded." },
          { q: "Is Audio Booster free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "No. Processing runs entirely in your browser using ffmpeg.wasm — your file is never uploaded to a server." }
        ]}
        tips={[
          "Start around 1.5x–2x and listen for distortion before pushing toward the 5x maximum.",
          "The first boost after loading the page can take longer since your browser needs to download the ffmpeg.wasm engine.",
          "Keep your original file — a volume boost can't be undone once clipping occurs.",
          "If your source is already loud, boosting further usually just adds distortion rather than perceived loudness."
        ]}
      />
    </div>
  );
}