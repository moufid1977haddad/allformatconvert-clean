'use client';
import { useState, useRef } from 'react';
export default function VideoScreenshotPage() {
  const [file, setFile] = useState(null);
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
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const url = canvas.toDataURL('image/png');
    const time = videoRef.current.currentTime.toFixed(2);
    setScreenshots(prev => [...prev, { url, time }]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Screenshot</h1>
        <p className="text-neutral-500 text-center mb-8">Capture screenshots from video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && (
            <div className="space-y-3">
              <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />
              <button onClick={capture} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Capture Screenshot</button>
            </div>
          )}
          {screenshots.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{screenshots.length} screenshot(s) captured</p>
              <div className="grid grid-cols-2 gap-3">
                {screenshots.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <img src={s.url} className="w-full rounded" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-500">At {s.time}s</span>
                      <a href={s.url} download={"screenshot-" + s.time + ".png"} className="text-xs text-indigo-400 hover:text-indigo-300">Download</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}