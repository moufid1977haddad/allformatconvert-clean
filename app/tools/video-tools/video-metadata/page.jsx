'use client';
import { useState, useRef } from 'react';
export default function VideoMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [file, setFile] = useState(null);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setMetadata({
        name: f.name,
        size: (f.size / (1024*1024)).toFixed(2) + ' MB',
        type: f.type,
        duration: Math.floor(video.duration / 60) + ':' + Math.floor(video.duration % 60).toString().padStart(2,'0'),
        width: video.videoWidth + 'px',
        height: video.videoHeight + 'px',
        lastModified: new Date(f.lastModified).toLocaleString(),
      });
    };
    video.src = url;
    if (videoRef.current) videoRef.current.src = url;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Metadata</h1>
        <p className="text-neutral-500 text-center mb-8">View video metadata and information</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-neutral-500 capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                  <span className="text-indigo-400 font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}