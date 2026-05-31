'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function AudioTrimmerPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
  };

  const onLoaded = () => {
    const dur = audioRef.current.duration;
    setDuration(Math.floor(dur));
    setEnd(Math.floor(dur));
  };

  const trim = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      const inputName = 'input.' + file.name.split('.').pop();
      const outputName = 'output.mp3';
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      await ffmpeg.run('-i', inputName, '-ss', String(start), '-to', String(end), '-c', 'copy', outputName);
      const data = ffmpeg.FS('readFile', outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setResult({ url, name: 'trimmed_' + file.name.replace(/\.[^.]+$/, '') + '.mp3' });
    } catch(e) {
      setError('Trim failed: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Trimmer</h1>
        <p className="text-neutral-500 text-center mb-8">Trim and cut audio files easily</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {audioUrl && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} controls className="w-full" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">Start (seconds): {start}s</label>
                <input type="range" min={0} max={duration} value={start} onChange={e => setStart(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">End (seconds): {end}s</label>
                <input type="range" min={0} max={duration} value={end} onChange={e => setEnd(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}
          <button onClick={trim} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Trimming...' : 'Trim Audio'}
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
