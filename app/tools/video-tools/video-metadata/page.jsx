'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function VideoMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';
    setFile(f);
    setMetadata(null);
    setError('');
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
    video.onerror = () => setError('Failed to read video metadata. The file may be corrupt or in an unsupported format.');
    video.src = url;
  };

  useEffect(() => {
    // videoRef.current is only guaranteed to exist after this render commits
    // (the <video> element only mounts once `file` is set), so the src must
    // be assigned here rather than inline in handleFile — otherwise the very
    // first file selection silently fails to load since the ref is still null.
    if (file && videoRef.current) videoRef.current.src = URL.createObjectURL(file);
  }, [file]);

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
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
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
      <SeoContent
        title="Video Metadata"
        description="Video Metadata reads a video file's basic properties — name, size, type, duration, resolution, and last-modified date — directly in your browser using the native HTML5 video element. Note: it doesn't extract codec, bitrate, or frame rate information."
        howTo={[
          "Click the upload area and select a video file.",
          "The video loads into the player and its metadata is read automatically.",
          "Review the properties listed below the player.",
          "Upload a different file at any time to see its metadata instead."
        ]}
        faqs={[
          { q: "What information does it show?", a: "File name, size, MIME type, duration, width, height, and last-modified date." },
          { q: "Does it show codec, bitrate, or frame rate?", a: "Not currently — only the properties listed above are extracted." },
          { q: "Can I download a metadata report?", a: "Not currently — the information is displayed on the page only, with no export button." },
          { q: "Is my file uploaded anywhere?", a: "No, metadata is read entirely in your browser via the File and video APIs." }
        ]}
        tips={[
          "Use the duration and resolution fields to quickly confirm you have the right video file before further editing.",
          "The \"type\" field shows your browser's detected MIME type, which can help spot mislabeled file extensions.",
          "For deeper technical details like codec or bitrate, you'll need a dedicated media-inspection tool.",
          "Check the file size here before uploading elsewhere if a platform has strict size limits."
        ]}
      />
    </div>
  );
}