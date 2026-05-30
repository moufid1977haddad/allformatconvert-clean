'use client';
import { useState, useRef } from 'react';
export default function VideoCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.5);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const compress = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Compressing...');
    try {
      const stream = videoRef.current.captureStream();
      const options = { mimeType: 'video/webm', videoBitsPerSecond: quality * 2500000 };
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult({ url: URL.createObjectURL(blob), size: blob.size, original: file.size });
        setStatus('');
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  const fmt = (b) => b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {Math.round(quality*100)}%</label><input type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} className="w-full" /></div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={compress} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compress Video</button>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{fmt(result.original)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After</div><div className="font-bold text-indigo-400">{fmt(result.size)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Saved</div><div className="font-bold text-green-400">{Math.round((1-result.size/result.original)*100)}%</div></div>
              </div>
              <video controls src={result.url} className="w-full rounded-xl" />
              <a href={result.url} download="compressed.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}