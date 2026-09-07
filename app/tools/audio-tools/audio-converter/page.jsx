'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { AUDIO_OUTPUT_FORMATS, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';

export default function AudioConverterPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const ffmpegRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setError('');
  };

  const cancel = () => {
    if (ffmpegRef.current) {
      ffmpegRef.current.terminate();
      ffmpegRef.current = null;
    }
    setLoading(false);
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      // ffmpeg.wasm's own stderr/stdout -- this is where the real reason for
      // a failure lives (e.g. an unsupported input format). Without this, a
      // failed exec() surfaces only as a generic rejection with no way to
      // diagnose what actually happened.
      ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(Math.min(1, Math.max(0, progress)) * 100));
      });
      await ffmpeg.load();
      const inputName = 'input.' + sanitizedInputExt(file);
      const { outputName, extraArgs, mime, ext } = buildOutputSpec(format);
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec(['-i', inputName, ...extraArgs, outputName]);
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
      setResult({ url, name: file.name.replace(/\.[^.]+$/, '') + '.' + ext });
      setProgress(100);
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Conversion failed:', e);
      if (ffmpegRef.current) {
        const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
        setError('Conversion failed: ' + reason);
      }
    }
    ffmpegRef.current = null;
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
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Converting…" />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              Convert Audio
            </button>
          )}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download {result.name}</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Converter"
        description="Audio Converter converts a single audio file between MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3 using ffmpeg.wasm, running entirely in your browser — your file is never uploaded to a server."
        howTo={[
          "Click the upload area and select an audio file.",
          "Choose your target format from the dropdown.",
          "Click \"Convert Audio\" to process the file locally.",
          "Preview and download the converted file."
        ]}
        faqs={[
          { q: "Is Audio Converter free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can convert." },
          { q: "What formats are supported?", a: "MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3 as output targets, and any format ffmpeg can decode as input (which covers the vast majority of real-world audio files, including AMR)." },
          { q: "Can it convert to AMR?", a: "No — this tool can read AMR files as input, but the AMR encoder isn't available in the ffmpeg build used here, so AMR isn't offered as an output target." },
          { q: "What is ALAC output actually saved as?", a: "A .m4a file using the ALAC (Apple Lossless) codec instead of AAC — the same format iTunes/Apple Music uses for lossless downloads." },
          { q: "Can I convert multiple files at once?", a: "No, this tool processes one file at a time — you'd need to repeat the process for each file." },
          { q: "Is my file uploaded anywhere?", a: "No. Conversion happens entirely client-side via ffmpeg.wasm (WebAssembly) — there's no server involved, so nothing is ever uploaded." }
        ]}
        tips={[
          "The first conversion after loading the page takes longer since your browser needs to download the ffmpeg.wasm engine (roughly 25–30MB).",
          "FLAC, WAV, AIFF, and ALAC preserve full quality but produce larger files than MP3, AAC, WMA, or Opus.",
          "Opus is a strong choice for small file size at good quality if your target player supports it.",
          "This tool converts audio files only — it doesn't extract audio from video files."
        ]}
      />
    </div>
  );
}
