'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function VideoResizerPage() {
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.onloadedmetadata = () => { setWidth(videoRef.current.videoWidth); setHeight(videoRef.current.videoHeight); };
    }
  };

  const resize = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Resizing...');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      const drawFrame = () => { ctx.drawImage(videoRef.current, 0, 0, width, height); if (!videoRef.current.paused && !videoRef.current.ended) requestAnimationFrame(drawFrame); };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      drawFrame();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Resizer</h1>
        <p className="text-neutral-500 text-center mb-8">Resize video dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width</label><input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height</label><input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">{[['720p',1280,720],['1080p',1920,1080],['480p',854,480]].map(([label,w,h]) => <button key={label} onClick={() => { setWidth(w); setHeight(h); }} className="bg-neutral-800 hover:bg-neutral-100 rounded-lg py-2 text-sm font-semibold transition">{label}</button>)}</div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={resize} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Resize Video</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="resized.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Video Resizer"
        description="Video Resizer redraws your video at a new width and height on a canvas and records the result, entirely in your browser. Note: the output is always WebM and has no audio, since canvas recordings don't carry sound, and dimensions aren't aspect-ratio-locked — entering a width/height that doesn't match your source video's proportions will stretch the result."
        howTo={[
          "Click the upload area and select a video file — its native dimensions fill the Width/Height fields automatically.",
          "Enter custom dimensions, or click a preset (720p, 1080p, or 480p).",
          "Click \"Resize Video\" — the video plays through once while the resized version is recorded.",
          "Preview and download the resized WebM file."
        ]}
        faqs={[
          { q: "Does it preserve aspect ratio automatically?", a: "No — enter a width and height that match your source video's proportions yourself, or the result will be stretched." },
          { q: "Does the resized video have audio?", a: "No — since resizing works by drawing frames to a canvas, and canvas recordings never carry audio, the output is silent." },
          { q: "What output format do I get?", a: "Always WebM." },
          { q: "Is my file uploaded anywhere?", a: "No, resizing happens entirely in your browser." }
        ]}
        tips={[
          "Divide your source video's width and height by the same number to keep proportions correct and avoid a stretched result.",
          "Since output has no audio, only use this when sound isn't needed, or re-add audio afterward with an editing tool.",
          "Resizing takes about as long as the video's full duration, since frames are captured as it plays in real time.",
          "Use the 720p/1080p/480p presets for common platform-ready sizes instead of typing custom numbers."
        ]}
      />
    </div>
  );
}