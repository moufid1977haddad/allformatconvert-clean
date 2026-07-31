'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function AudioCompressorPage() {
  const [file, setFile] = useState(null);
  const [bitrate, setBitrate] = useState('128');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      await ffmpeg.writeFile('input.mp3', await fetchFile(file));
      await ffmpeg.exec(['-i', 'input.mp3', '-b:a', bitrate + 'k', 'output.mp3']);
      const data = await ffmpeg.readFile('output.mp3');
      const blob = new Blob([data.buffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1);
      setResult({ url, name: 'compressed_' + file.name, originalSize: (file.size/1024/1024).toFixed(2), newSize: (blob.size/1024/1024).toFixed(2), reduction });
    } catch(e) { setError('Compression failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress audio files to reduce size</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Bitrate: {bitrate} kbps</label>
            <div className="flex gap-2">
              {['64', '96', '128', '192', '256', '320'].map(b => (
                <button key={b} onClick={() => setBitrate(b)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${bitrate === b ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{b}k</button>
              ))}
            </div>
          </div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Compressing...' : 'Compress Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Original</div><div className="font-bold text-sm">{result.originalSize} MB</div></div>
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Compressed</div><div className="font-bold text-sm text-indigo-600">{result.newSize} MB</div></div>
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Saved</div><div className="font-bold text-sm text-green-600">{result.reduction}%</div></div>
              </div>
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Compressor"
        description="Audio Compressor reduces an audio file's size by re-encoding it at a lower bitrate (64–320 kbps) using ffmpeg.wasm, entirely in your browser. Note: this is bitrate-based file-size compression — it does not apply dynamic-range compression (threshold/ratio/attack/release) despite the tool's name."
        howTo={[
          "Click the upload area and select an audio file.",
          "Choose a target bitrate from the presets (64k–320k).",
          "Click \"Compress Audio\" to re-encode the file locally.",
          "Compare the before/after size and download the result as MP3."
        ]}
        faqs={[
          { q: "Does this apply dynamic-range compression?", a: "No — despite the name, this tool re-encodes your audio at a lower bitrate to shrink file size. It doesn't touch the audio's dynamic range (loud vs. quiet parts)." },
          { q: "What output format do I get?", a: "Always MP3, regardless of the format you uploaded." },
          { q: "Is there a file size limit?", a: "No hard limit is enforced by the tool — very large files are limited only by your browser's available memory." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything is processed client-side via ffmpeg.wasm — nothing is uploaded to a server." }
        ]}
        tips={[
          "128 kbps is a reasonable default for most music; drop to 64–96 kbps for voice-only content where size matters most.",
          "Lower bitrates noticeably reduce quality for complex music — compare the audio preview before committing.",
          "The first compression after loading the page takes longer since the ffmpeg.wasm engine needs to download.",
          "If you need real dynamic-range compression (leveling loud and quiet parts), you'll need a dedicated audio-editing tool — this one only changes bitrate."
        ]}
      />
    </div>
  );
}