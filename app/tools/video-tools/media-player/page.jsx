'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      <SeoContent
        title="Media Player"
        description="Media Player plays a single audio or video file directly in your browser using native HTML5 playback — the file loads locally as a blob URL and is never uploaded anywhere."
        howTo={[
          "Click the upload area and select an audio or video file.",
          "The file loads instantly using your browser's native player controls.",
          "Use the built-in play, pause, volume, and seek controls to control playback.",
          "Upload a different file at any time to switch what's playing."
        ]}
        faqs={[
          { q: "What file formats are supported?", a: "Any audio or video format your browser can play natively — commonly MP4, WebM, MP3, WAV, and OGG." },
          { q: "Is Media Player free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I create a playlist of multiple files?", a: "Not currently — one file is loaded and played at a time." },
          { q: "Is my file uploaded to a server?", a: "No, the file is read locally and played via a browser blob URL — it's never uploaded or streamed from a server." }
        ]}
        tips={[
          "Right-click the video player for extra native browser options like Picture-in-Picture, depending on your browser.",
          "Use the spacebar to play/pause and arrow keys to seek once the player is focused.",
          "For video files, click the player's fullscreen icon for a larger viewing experience.",
          "If a file doesn't play, your browser likely doesn't support its codec — try converting it with a dedicated converter tool first."
        ]}
      />
    </div>
  );
}