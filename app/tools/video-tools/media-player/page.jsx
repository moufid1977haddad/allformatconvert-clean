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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Media Player</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Media Player is a free online tool that allows you to play audio and video files directly in your web browser without downloading any software or plugins. Support for multiple formats including MP3, WAV, MP4, and WebM makes it the perfect solution for streaming your media content instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Media Player</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Open the Media Player tool in your web browser and navigate to the main interface.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your audio or video file into the designated area.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select your media file from your computer and wait for it to load into the player.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Use the play controls to start playback, adjust volume, and seek through your media content.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Media Player support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Media Player supports popular formats including MP3, WAV, OGG, MP4, WebM, and Ogg Theora video files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Media Player free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Media Player is completely free to use with no hidden fees, subscriptions, or registration requirements.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I download files after playing them?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Media Player is designed for streaming content only. Files are not stored on our servers after your session ends.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my uploaded media private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your files are processed securely and are not shared with third parties. Files are deleted after your session.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use keyboard shortcuts for faster playback control: spacebar to play/pause and arrow keys to seek.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust the playback speed to listen to audiobooks or podcasts faster or slower as needed.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Create a playlist by uploading multiple files to listen to them in sequence without interruption.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the fullscreen mode for video playback to enjoy better viewing experience on larger screens.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}