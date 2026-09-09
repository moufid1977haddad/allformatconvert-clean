'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_OUTPUT_FORMATS, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';

export default function AudioBoosterPage() {
  const [file, setFile] = useState(null);
  const [volume, setVolume] = useState(2);
  const [format, setFormat] = useState('mp3');
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
      // ffmpeg.wasm's own stderr/stdout -- this is where the real reason for
      // a failure lives. Without this, a failed exec() surfaces only as a
      // generic rejection with no way to diagnose what actually happened.
      ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));
      await ffmpeg.load();
      const inputName = 'input.' + sanitizedInputExt(file);
      const { outputName, extraArgs, mime, ext } = buildOutputSpec(format);
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec(['-i', inputName, '-af', `volume=${volume}`, ...extraArgs, outputName]);
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
      setResult({ url, name: 'boosted_' + file.name.replace(/\.[^.]+$/, '') + '.' + ext });
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Boost failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      reportToolError({ tool: 'audio-booster', file, error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Boost failed: ' + reason);
    }
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
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Output Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <button onClick={boost} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
        description="Audio Booster amplifies an audio file's volume using a simple gain multiplier (1x–5x), processed entirely in your browser via ffmpeg.wasm (WebAssembly) — nothing is uploaded to a server. Choose the output format that matches your source (or any other supported format) instead of always getting MP3 back."
        howTo={[
          "Click the upload area and select an audio file.",
          "Set your desired boost level using the slider (1x–5x).",
          "Choose an output format — pick the same format as your source to avoid an unnecessary quality-losing re-encode.",
          "Click \"Boost Audio\" — the first use downloads the ffmpeg processing engine, so it may take a moment.",
          "Preview the result, then download the boosted file."
        ]}
        faqs={[
          { q: "What does the boost actually do?", a: "It applies a straightforward volume/gain multiplier to the whole file via ffmpeg — it's not adaptive loudness normalization, so high boost levels can cause clipping or distortion." },
          { q: "What output format do I get?", a: "Your choice — MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3, picked from a dropdown before boosting." },
          { q: "Is Audio Booster free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "No. Processing runs entirely in your browser using ffmpeg.wasm — your file is never uploaded to a server." }
        ]}
        tips={[
          "Start around 1.5x–2x and listen for distortion before pushing toward the 5x maximum.",
          "Pick a lossless output (WAV, FLAC, AIFF, or ALAC) if your source was already lossless, to avoid stacking a lossy re-encode on top of the boost.",
          "The first boost after loading the page can take longer since your browser needs to download the ffmpeg.wasm engine.",
          "Keep your original file — a volume boost can't be undone once clipping occurs."
        ]}
      />
    </div>
  );
}
