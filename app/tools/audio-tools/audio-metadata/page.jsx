'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioMetadataPage() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    setMetadata({
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
      type: f.type,
      lastModified: new Date(f.lastModified).toLocaleDateString(),
    });
  };

  const onLoaded = () => {
    if (audioRef.current) {
      setMetadata(prev => ({
        ...prev,
        duration: Math.floor(audioRef.current.duration) + ' seconds',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Metadata</h1>
        <p className="text-neutral-500 text-center mb-8">View audio file metadata and information</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {audioUrl && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} controls className="w-full" />}
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([key, val]) => (
                <div key={key} className="flex justify-between bg-neutral-50 rounded-lg px-4 py-2 border border-neutral-200">
                  <span className="text-sm font-medium text-neutral-600 capitalize">{key}</span>
                  <span className="text-sm text-neutral-800">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
