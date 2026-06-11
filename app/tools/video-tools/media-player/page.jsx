'use client';
import { useState, useRef } from 'react';
export default function MediaPlayerPage() {
  const [file, setFile] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [url, setUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setIsVideo(f.type.startsWith('video'));
    setUrl(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Media Player</h1>
        <p className="text-neutral-500 text-center mb-8">Play audio and video files in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a media file here'}</p>
            <p className="text-neutral-400 text-sm mt-1">Supports MP4, MP3, WAV, OGG, WebM</p>
            <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFile} />
          </div>
          {url && (
            <div className="space-y-3">
              {isVideo ? (
                <video controls src={url} className="w-full rounded-xl bg-neutral-800" />
              ) : (
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-8 text-center space-y-4">
                  <div className="text-6xl">🎵</div>
                  <p className="text-neutral-300 font-semibold">{file.name}</p>
                  <audio controls src={url} className="w-full" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}