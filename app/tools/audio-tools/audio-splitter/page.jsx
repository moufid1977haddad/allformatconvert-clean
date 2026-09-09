'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_OUTPUT_FORMATS, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';

export default function AudioSplitterPage() {
  const [file, setFile] = useState(null);
  const [splitAt, setSplitAt] = useState(30);
  const [duration, setDuration] = useState(0);
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResults([]);
    setError('');
    setDuration(0);
    setSplitAt(30);
  };
  const onLoaded = () => {
    const dur = Math.floor(audioRef.current.duration);
    setDuration(dur);
    setSplitAt(s => Math.min(Math.max(s, 1), Math.max(dur - 1, 1)));
  };

  const split = async () => {
    if (!file) return;
    if (splitAt <= 0 || splitAt >= duration) {
      setError('Split point must be within the audio duration.');
      return;
    }
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
      const { extraArgs, mime, ext } = buildOutputSpec(format);
      const part1Name = 'part1.' + ext;
      const part2Name = 'part2.' + ext;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec(['-i', inputName, '-t', String(splitAt), ...extraArgs, part1Name]);
      await ffmpeg.exec(['-i', inputName, '-ss', String(splitAt), ...extraArgs, part2Name]);
      const data1 = await ffmpeg.readFile(part1Name);
      const data2 = await ffmpeg.readFile(part2Name);
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setResults([
        { url: URL.createObjectURL(new Blob([data1.buffer], { type: mime })), name: 'part1_' + baseName + '.' + ext },
        { url: URL.createObjectURL(new Blob([data2.buffer], { type: mime })), name: 'part2_' + baseName + '.' + ext },
      ]);
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Split failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      reportToolError({ tool: 'audio-splitter', file, error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Split failed: ' + reason);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Splitter</h1>
        <p className="text-neutral-500 text-center mb-8">Split audio into multiple parts</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {file && <audio ref={audioRef} src={URL.createObjectURL(file)} onLoadedMetadata={onLoaded} controls className="w-full" />}
          {duration > 0 && (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Split at: {splitAt}s (of {duration}s)</label>
              <input type="range" min={1} max={duration - 1} value={splitAt} onChange={e => setSplitAt(Number(e.target.value))} className="w-full" />
            </div>
          )}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Output Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Splitting...' : 'Split Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {results.map((r, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Part {i+1}</p>
              <audio controls src={r.url} className="w-full" />
              <a href={r.url} download={r.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Part {i+1}</a>
            </div>
          ))}
        </div>
      </div>
      <SeoContent
        title="Audio Splitter"
        description="Audio Splitter cuts an audio file into two parts at a single point you choose, using ffmpeg.wasm entirely in your browser — nothing is uploaded to a server. Move the slider to set exactly where the split happens, and pick the output format for both parts from a dropdown."
        howTo={[
          "Click the upload area and select an audio file.",
          "Use the slider to set the exact second where you want to split the file.",
          "Choose an output format for both resulting parts.",
          "Click \"Split Audio\" to process it locally.",
          "Preview and download Part 1 and Part 2 separately."
        ]}
        faqs={[
          { q: "Can I split into more than two parts?", a: "Not in a single pass — this tool creates exactly two parts at one split point. Run the tool again on one of the resulting parts if you need further splits." },
          { q: "What output format do the parts use?", a: "Your choice — MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3, picked from a dropdown, applied to both parts." },
          { q: "Is there a file size limit?", a: "No hard limit is enforced by the tool — you're limited by your browser's available memory." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything happens locally via ffmpeg.wasm — your file is never uploaded to a server." }
        ]}
        tips={[
          "Preview the audio near your intended split point first to make sure you're cutting at the right moment.",
          "Pick the same format as your source if you want to avoid a lossy re-encode.",
          "To split a file into more than two pieces, run this tool again on each resulting part.",
          "The first split after loading the page takes longer since the ffmpeg.wasm engine needs to download."
        ]}
      />
    </div>
  );
}
