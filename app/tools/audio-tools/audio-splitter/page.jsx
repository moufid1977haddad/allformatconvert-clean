'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioSplitterPage() {
  const [file, setFile] = useState(null);
  const [splitAt, setSplitAt] = useState(30);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResults([]); };
  const onLoaded = () => { setDuration(Math.floor(audioRef.current.duration)); };

  const split = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      ffmpeg.FS('writeFile', 'input.mp3', await fetchFile(file));
      await ffmpeg.run('-i', 'input.mp3', '-t', String(splitAt), 'part1.mp3');
      await ffmpeg.run('-i', 'input.mp3', '-ss', String(splitAt), 'part2.mp3');
      const data1 = ffmpeg.FS('readFile', 'part1.mp3');
      const data2 = ffmpeg.FS('readFile', 'part2.mp3');
      setResults([
        { url: URL.createObjectURL(new Blob([data1.buffer], { type: 'audio/mp3' })), name: 'part1_' + file.name },
        { url: URL.createObjectURL(new Blob([data2.buffer], { type: 'audio/mp3' })), name: 'part2_' + file.name },
      ]);
    } catch(e) { setError('Split failed: ' + e.message); }
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
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
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
    </div>
  );
}
