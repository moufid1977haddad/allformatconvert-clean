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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Metadata</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Metadata is a free online tool that extracts and displays detailed information about your video files, including duration, resolution, codec, bitrate, and frame rate. Quickly analyze video properties without installing any software or plugins.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Metadata</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video Metadata tool website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your video file into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to process your video and extract all metadata information</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review the detailed metadata results displayed on your screen and download the report if needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Metadata support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Metadata supports all major video formats including MP4, AVI, MOV, MKV, WebM, FLV, WMV, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool can process videos up to 2GB in size. For larger files, consider compressing or splitting your video.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my uploaded videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all uploaded videos are processed temporarily and automatically deleted after analysis. Your privacy is protected.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Video Metadata on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Video Metadata is fully responsive and works on smartphones, tablets, and desktop computers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Video Metadata to verify video specifications before uploading to streaming platforms like YouTube or Vimeo</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export metadata reports to document your video files for archival or professional purposes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare metadata from multiple videos to ensure consistent quality and specifications across your content library</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check bitrate and resolution information to optimize your videos for different devices and internet speeds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}