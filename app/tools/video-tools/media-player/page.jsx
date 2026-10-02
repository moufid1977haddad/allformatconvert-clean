'use client';
import { useState, useRef } from 'react';
import { FileDownload } from '../../../components/FileDownload';
import { Music } from 'lucide-react';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, VIDEO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
export default function MediaPlayerPage() {
  const [file, setFile] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [url, setUrl] = useState(null);
  // 28/09/2026: a file the browser cannot play (AVI, WMV, FLV, WMA…) showed a dead player and nothing else.
  const [cannotPlay, setCannotPlay] = useState(false);
  const inputRef = useRef();
  // P24 (03/10): speed, loop, picture-in-picture, a still of the current frame and subtitles (SRT / VTT), as
  // imageonline.io's and litetools' players offer — all with the browser's own player, nothing uploaded
  const mediaRef = useRef(null);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [subUrl, setSubUrl] = useState(null);
  const [shot, setShot] = useState(null);
  const setSpeed = (r) => { setRate(r); if (mediaRef.current) mediaRef.current.playbackRate = r; };
  const toVtt = (text) => (/^WEBVTT/.test(text.trim()) ? text : 'WEBVTT\n\n' + text.replace(/\r/g, '').replace(/(\d\d:\d\d:\d\d),(\d{3})/g, '$1.$2'));
  const loadSubs = async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; setSubUrl(URL.createObjectURL(new Blob([toVtt(await f.text())], { type: 'text/vtt' }))); };
  const snapshot = () => {
    const v = mediaRef.current; if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((b) => b && setShot(URL.createObjectURL(b)), 'image/png');
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setCannotPlay(false);
    // The MIME type is often empty for .mkv, .avi, .flv…: fall back on the extension.
    setIsVideo(f.type ? f.type.startsWith('video') : /\.(mp4|m4v|mov|qt|webm|mkv|avi|wmv|flv|ogv|3gp|3g2|mpg|mpeg|ts|mts|m2ts)$/i.test(f.name));
    setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
  };
  const ext = file ? (file.name.split('.').pop() || '').toUpperCase() : '';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Media Player</h1>
        <p className="text-neutral-500 text-center mb-8">Play audio and video files in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a media file here'}</p>
            <p className="text-neutral-500 text-sm mt-1">Supports MP4, MP3, WAV, OGG, WebM</p>
            <input ref={inputRef} type="file" accept={`${AUDIO_ACCEPT},${VIDEO_ACCEPT}`} className="hidden" onChange={handleFile} />
          </div>
          {file && encryptedMusicMessage(file.name) ? (
            <p role="alert" className="text-sm text-red-600 text-center">{encryptedMusicMessage(file.name)}</p>
          ) : cannotPlay && (
            <p role="alert" className="text-sm text-red-600 text-center">
              This browser cannot play {ext ? `this ${ext} file` : 'this file'}. Convert it first with the <a className="underline" href={isVideo ? '/tools/video-tools/video-converter' : '/tools/audio-tools/audio-converter'}>{isVideo ? 'Video Converter (to MP4)' : 'Audio Converter (to MP3)'}</a>, then play it here.
            </p>
          )}
          {url && (
            <div className="space-y-3">
              {isVideo ? (
                <video ref={mediaRef} controls playsInline src={url} loop={loop} onLoadedMetadata={(e) => { e.currentTarget.playbackRate = rate; }} onError={() => setCannotPlay(true)} className="w-full rounded-xl bg-neutral-800">
                  {subUrl && <track kind="subtitles" src={subUrl} default label="Subtitles" />}
                </video>
              ) : (
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-8 text-center space-y-4">
                  <Music className="w-16 h-16 mx-auto text-neutral-400" />
                  <p className="text-neutral-300 font-semibold">{file.name}</p>
                  <audio ref={mediaRef} controls src={url} loop={loop} onLoadedMetadata={(e) => { e.currentTarget.playbackRate = rate; }} onError={() => setCannotPlay(true)} className="w-full" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700" data-player-controls>
                <span>Speed</span>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => <button key={r} type="button" onClick={() => setSpeed(r)} aria-pressed={rate === r} className={'px-2 py-1 rounded border ' + (rate === r ? 'bg-indigo-600 text-white border-indigo-600' : 'border-neutral-300')}>{r}×</button>)}
                <label className="flex items-center gap-1 ml-2"><input id="mp-loop" type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop</label>
                {isVideo && <>
                  {typeof document !== 'undefined' && document.pictureInPictureEnabled && <button type="button" onClick={() => mediaRef.current?.requestPictureInPicture?.().catch(() => {})} className="px-2 py-1 rounded border border-neutral-300">Picture in picture</button>}
                  <button type="button" onClick={snapshot} className="px-2 py-1 rounded border border-neutral-300">Save this frame</button>
                  <label className="px-2 py-1 rounded border border-neutral-300 cursor-pointer">Subtitles (.srt, .vtt)<input type="file" accept=".srt,.vtt,text/vtt" className="hidden" onChange={loadSubs} /></label>
                </>}
              </div>
              {shot && <div className="space-y-1"><img src={shot} alt="Saved frame" className="max-h-40 mx-auto rounded" /><FileDownload href={shot} name={(file?.name || 'video').replace(/\.[^.]+$/, '') + '-frame.png'} /></div>}
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
          { q: "Can I change the speed, loop or add subtitles?", a: "Yes: speed from 0.5× to 2×, Loop, picture-in-picture where the browser offers it, Save this frame (a PNG of the picture shown), and subtitles from an .srt or .vtt file, shown over the video." },
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