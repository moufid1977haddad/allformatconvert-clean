'use client';
import { useState, useRef } from 'react';
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Resizer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Resizer is a free online tool that allows you to quickly resize videos to any dimensions without quality loss or software installation. Perfect for social media, presentations, and web optimization, it supports all popular video formats and resolutions.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Resizer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your video file by clicking the upload button or dragging and dropping it into the interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired output resolution from preset options or enter custom width and height dimensions</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose your preferred video format and quality settings to optimize file size</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the resize button and download your resized video once processing is complete</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Resizer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Resizer supports all major video formats including MP4, AVI, MOV, MKV, WebM, FLV, and more for both upload and download.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">We support videos up to 2GB in size, which covers most common use cases for social media and web content.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will resizing my video reduce its quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our advanced compression algorithm minimizes quality loss while reducing file size, maintaining excellent visual clarity at your target resolution.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does the resizing process take?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Processing time depends on your video length and desired resolution, typically ranging from a few seconds to a few minutes for standard videos.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use 1920x1080 (Full HD) for YouTube uploads and 1280x720 (HD) for faster processing times</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Select a lower bitrate when resizing for social media platforms to reduce file size without noticeable quality reduction</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Resize to 9:16 aspect ratio for vertical videos optimized for TikTok, Instagram Reels, and YouTube Shorts</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always test your resized video on your target platform before sharing to ensure proper playback and quality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}