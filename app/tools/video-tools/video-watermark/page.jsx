'use client';
import { useState, useRef } from 'react';
export default function VideoWatermarkPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('Watermark');
  const [position, setPosition] = useState('bottom-right');
  const [screenshots, setScreenshots] = useState([]);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setScreenshots([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const capture = () => {
    if (!videoRef.current || !text) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const tw = ctx.measureText(text).width;
    let x = 20, y = 40;
    if (position === 'bottom-right') { x = canvas.width - tw - 20; y = canvas.height - 20; }
    else if (position === 'bottom-left') { x = 20; y = canvas.height - 20; }
    else if (position === 'top-right') { x = canvas.width - tw - 20; y = 40; }
    else if (position === 'center') { x = (canvas.width - tw) / 2; y = canvas.height / 2; }
    ctx.fillText(text, x, y);
    const url = canvas.toDataURL('image/png');
    const time = videoRef.current.currentTime.toFixed(2);
    setScreenshots(prev => [...prev, { url, time }]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Watermark</h1>
        <p className="text-neutral-500 text-center mb-8">Add watermark to video frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div><label className="block text-sm text-neutral-500 mb-1">Watermark Text</label><input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <div><label className="block text-sm text-neutral-500 mb-2">Position</label><div className="grid grid-cols-3 gap-2">{['top-left','top-right','center','bottom-left','bottom-right'].map(p => <button key={p} onClick={() => setPosition(p)} className={"py-2 rounded-lg text-sm font-semibold transition " + (position===p?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{p}</button>)}</div></div>
          <button onClick={capture} disabled={!file || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Capture Frame with Watermark</button>
          {screenshots.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {screenshots.map((s, i) => (
                <div key={i} className="space-y-1">
                  <img src={s.url} className="w-full rounded" />
                  <a href={s.url} download={"watermarked-" + s.time + ".png"} className="block text-center text-sm text-indigo-400 hover:text-indigo-300">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}