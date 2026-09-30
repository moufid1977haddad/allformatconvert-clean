'use client';
import { useEffect, useRef, useState } from 'react';
import GifFromVideoTool from '../../../components/GifFromVideoTool';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { assertVideoReadable } from '../../../lib/mediaSupport';

// Video Tools > Video to GIF (P18, 01/10). It used to capture still PNG frames and never made a GIF, although its name
// says GIF. It now makes an animated GIF the way GIF Tools > Video to GIF does (the proven path: ffmpeg palettegen /
// paletteuse on our media service, as ezgif), and keeps frame extraction as an option below — now with every frame
// offered as a real PNG file, all of them in one ZIP too.

const toBlob = (canvas) => new Promise((resolve, reject) => canvas.toBlob((b) => (b && b.size > 32 && b.type === 'image/png' ? resolve(b) : reject(new Error('Your browser could not produce this image — it is probably too large for this device.'))), 'image/png'));

function FrameExtractor({ file, busy }) {
  const [open, setOpen] = useState(false);
  const [fps, setFps] = useState(5);
  const [duration, setDuration] = useState(3);
  const [start, setStart] = useState(0);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef();
  const url = useRef(null);

  useEffect(() => {
    setFrames([]); setError('');
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = file ? URL.createObjectURL(file) : null;
    if (videoRef.current) videoRef.current.src = url.current || '';
    return undefined;
  }, [file, open]);
  useEffect(() => () => { frames.forEach((f) => URL.revokeObjectURL(f.url)); }, [frames]);

  if (!file) return null;
  const capture = async () => {
    setLoading(true); setError(''); setFrames([]);
    try {
      const video = videoRef.current;
      if (video.readyState < 1) await new Promise((r, j) => { video.onloadedmetadata = r; video.onerror = () => j(new Error("This video's frames could not be read in this browser.")); });
      assertVideoReadable(video);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      const total = Math.max(1, Math.round(fps * duration));
      const end = Number.isFinite(video.duration) ? video.duration : Infinity;
      const out = [];
      const base = (file.name || 'video').replace(/\.[^.]+$/, '');
      for (let i = 0; i < total; i++) {
        const t = start + i / fps;
        if (t >= end) break;
        video.currentTime = t;
        await new Promise((r) => { video.onseeked = r; setTimeout(r, 1500); });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await toBlob(canvas);
        out.push({ blob, url: URL.createObjectURL(blob), name: `${base}-frame-${String(i + 1).padStart(3, '0')}.png`, t });
      }
      if (!out.length) throw new Error('The start time is after the end of the video.');
      setFrames(out);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="border-t border-neutral-200 pt-4 space-y-3" data-frame-extractor>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-sm font-semibold text-indigo-700 hover:underline">
        {open ? '▾' : '▸'} Or extract frames as PNG images
      </button>
      {open && (
        <div className="space-y-3">
          <video ref={videoRef} muted playsInline preload="auto" className="hidden" />
          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm text-neutral-600">Start (s)<input type="number" min="0" step="0.1" value={start} onChange={(e) => setStart(Math.max(0, Number(e.target.value) || 0))} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="text-sm text-neutral-600">Frames per second: {fps}<input aria-label="Frames per second" type="range" min="1" max="15" value={fps} onChange={(e) => setFps(parseInt(e.target.value, 10))} className="w-full" /></label>
            <label className="text-sm text-neutral-600">Duration: {duration} s<input aria-label="Duration in seconds" type="range" min="1" max="10" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} className="w-full" /></label>
          </div>
          <button type="button" onClick={capture} disabled={loading || busy} className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-2 font-semibold transition">
            {loading ? 'Extracting frames…' : `Extract ${Math.round(fps * duration)} frames`}
          </button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {frames.length > 0 && (
            <DownloadGroup zipName={`${(file.name || 'video').replace(/\.[^.]+$/, '')}-frames.zip`}>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((f) => <img key={f.name} src={f.url} alt={`Frame at ${f.t.toFixed(2)} s`} className="w-full rounded" />)}
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {frames.map((f) => <FileDownload key={f.name} href={f.url} blob={f.blob} name={f.name} note={`${f.t.toFixed(2)} s`} primary={false} />)}
              </div>
            </DownloadGroup>
          )}
        </div>
      )}
    </div>
  );
}

export default function VideoToGifPage() {
  return (
    <GifFromVideoTool
      tool="video-to-gif"
      title="Video to GIF"
      subtitle="Turn a clip of any video into an animated GIF — or extract its frames as PNG images"
      extra={({ file, busy }) => <FrameExtractor file={file} busy={busy} />}
      seo={{
        title: 'Video to GIF',
        description: 'Video to GIF turns a clip of any video (MP4, MOV from an iPhone, WebM, MKV, AVI and more) into one animated GIF file. Pick where the clip starts, how long it lasts (up to 60 seconds), the width and the frame rate. It runs on our server with ffmpeg, building an optimised 256-colour palette for your clip, so it works in every browser including Safari and iPhone; vertical and square videos keep their shape. Need still images instead? Open "Or extract frames as PNG images" to capture up to 150 frames in your browser and download them one by one or as a ZIP.',
        howTo: [
          'Select a video file (up to 1 GB).',
          'Set the start time and the length of the clip (up to 60 seconds), the width and the frames per second.',
          'Click "Make GIF", preview the animation, then click "Download".',
          'For still images, open "Or extract frames as PNG images", choose the start, frame rate and duration, then download the frames or all of them as a ZIP.',
        ],
        faqs: [
          { q: 'Does this produce a single animated GIF file?', a: 'Yes — "Make GIF" returns one animated .gif file of your clip.' },
          { q: 'Which video formats can I use?', a: 'MP4, MOV (including iPhone videos), WebM, MKV, AVI, WMV, FLV and most others ffmpeg can read.' },
          { q: 'How long can the GIF be?', a: 'Up to 60 seconds, starting wherever you want in the video.' },
          { q: 'Can I get the individual frames instead?', a: 'Yes: "Or extract frames as PNG images" captures up to 15 frames per second for up to 10 seconds, in your browser (nothing is uploaded for that), each as a PNG, or all in one ZIP.' },
          { q: 'Is my video uploaded?', a: 'For the GIF, yes, to our own server (not a third party), and deleted as soon as you have downloaded the result. Frame extraction runs entirely in your browser.' },
        ],
        tips: [
          '480 px and 10 fps is a good balance for sharing in chats and on social media.',
          'For a reaction GIF, keep it short: 2 to 4 seconds.',
          'Lower the width or the frame rate to make the GIF much lighter.',
          'Play the video above to find the exact second where your clip should start.',
        ],
      }}
    />
  );
}
