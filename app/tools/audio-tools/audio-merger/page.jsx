'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioMergerPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFiles = (e) => { setFiles(Array.from(e.target.files)); setResult(null); };

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      const inputs = [];
      for (let i = 0; i < files.length; i++) {
        const name = `input${i}.mp3`;
        ffmpeg.FS('writeFile', name, await fetchFile(files[i]));
        inputs.push(`file '${name}'`);
      }
      ffmpeg.FS('writeFile', 'list.txt', new TextEncoder().encode(inputs.join('\n')));
      await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp3');
      const data = ffmpeg.FS('readFile', 'output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setResult({ url, name: 'merged_audio.mp3' });
    } catch(e) { setError('Merge failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge multiple audio files into one</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {files.length > 0 ? <p className="text-neutral-700 font-medium">{files.length} files selected</p> : <p className="text-neutral-400 text-sm">Click to upload multiple audio files</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => <div key={i} className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">{i+1}. {f.name}</div>)}
            </div>
          )}
          <button onClick={merge} disabled={files.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Merging...' : 'Merge Audio Files'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Merged Audio</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
