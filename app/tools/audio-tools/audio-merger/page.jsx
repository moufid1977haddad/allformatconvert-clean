'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function AudioMergerPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(newFiles);
    setResult(null);
  };

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      const inputs = [];
      for (let i = 0; i < files.length; i++) {
        const name = `input${i}.mp3`;
        await ffmpeg.writeFile(name, await fetchFile(files[i]));
        inputs.push(`file '${name}'`);
      }
      await ffmpeg.writeFile('list.txt', new TextEncoder().encode(inputs.join('\n')));
      await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp3']);
      const data = await ffmpeg.readFile('output.mp3');
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
          <button onClick={merge} disabled={files.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
      <SeoContent
        title="Audio Merger"
        description="Audio Merger joins two or more audio files into one, using ffmpeg's stream-copy concat feature entirely in your browser via ffmpeg.wasm — nothing is uploaded to a server. Files are combined in the order you select them; there's no drag-to-reorder, fade, or volume-leveling controls."
        howTo={[
          "Click the upload area and select two or more audio files — they'll merge in the order you pick them.",
          "Review the list of selected files.",
          "Click \"Merge Audio Files\" to combine them locally.",
          "Preview and download the merged MP3."
        ]}
        faqs={[
          { q: "Can I reorder files before merging?", a: "Not currently — files merge in the order they were selected during upload." },
          { q: "Does merging work with mixed formats?", a: "It works best when all files share the same codec/format, since the process uses fast stream-copy rather than re-encoding; mixing very different formats can sometimes fail." },
          { q: "Is there a limit on file count or size?", a: "No hard limit is enforced by the tool — you're limited by your browser's available memory." },
          { q: "Is my data private?", a: "Yes. Everything happens locally via ffmpeg.wasm — files are never uploaded to a server." }
        ]}
        tips={[
          "For the most reliable results, merge files that share the same format and bitrate (e.g., all MP3 at 128kbps).",
          "Double-check the file order in the list before merging, since there's no drag-to-reorder — remove and re-add files in the order you want if needed.",
          "If merging fails, try converting all files to the same format first with the Audio Converter tool.",
          "The first merge after loading the page takes longer since the ffmpeg.wasm engine needs to download."
        ]}
      />
    </div>
  );
}