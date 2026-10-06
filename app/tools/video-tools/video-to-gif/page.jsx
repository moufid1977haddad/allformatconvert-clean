'use client';
import { useEffect, useRef, useState } from 'react';
import GifFromVideoTool from '../../../components/GifFromVideoTool';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { assertVideoReadable } from '../../../lib/mediaSupport';
import { useToolError } from '../../../lib/useToolError';
import { fitSize } from '../../../lib/canvasLimit'; // P31: one canvas cap for iPhone / iPad

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
  const [error, setError] = useToolError('');
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
      const fit = fitSize(video.videoWidth, video.videoHeight); // P31: an 8K video's frame is over the iPhone canvas cap
      canvas.width = fit.width; canvas.height = fit.height;
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
      subtitle="Make an animated GIF from part of a video, or save its frames as PNG images"
      extra={({ file, busy }) => <FrameExtractor file={file} busy={busy} />}
      seo={{
        title: 'Video to GIF',
        description: 'This page gets two things out of one video. "Make GIF" turns a clip into an animated GIF on our video service: you set the start, a length of up to 60 seconds, a width from 160 to 1080 pixels and 5 to 30 frames per second, and the height follows the video. Two extra settings, how many times it plays and an optional compression, are then applied by gifsicle on this page. Under the GIF settings, "Or extract frames as PNG images" saves still frames instead, as separate PNG files or one ZIP.',
        howToTitle: 'How to make a GIF or PNG frames from a video',
        howTo: [
          'Choose or drop a video file; it plays in the preview so you can find your moment.',
          'Fill in "Start (seconds)" and "Length (seconds)", then choose "Width" and "Frames per second".',
          'If you want, set "Plays" (forever, once, 3 or 5 times) and "Compression".',
          'Click "Make GIF", follow the upload and processing percentage, then click "Download".',
          'For still images, open "Or extract frames as PNG images", set the start, frame rate and duration, extract, then save the frames one by one or with "Download all".',
        ],
        specs: [
          { label: 'Input formats', value: 'MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS' },
          { label: 'GIF output', value: 'Animated GIF, 160 to 1080 pixels wide but never wider than the video, 5 to 30 frames per second' },
          { label: 'Clip length', value: '0.2 to 60 seconds; a clip that runs past the end stops there, with a note when your browser can read the video length' },
          { label: 'PNG frames', value: 'Frame extraction: 1 to 15 per second over 1 to 10 seconds, up to 150 PNG files, made in your browser' },
          { label: 'Maximum file size', value: '1 GB per source video for a GIF, on a computer or a phone' },
          { label: 'Usage limits', value: 'Each GIF counts toward the hourly and daily limit of your internet connection on our video service; frame extraction is not counted' },
        ],
        privacy: 'For a GIF, the video is sent in pieces to our video service on Railway, which cuts the clip and builds the GIF with ffmpeg; the original is deleted when the GIF is ready, and the GIF once this page has downloaded it. The loop and compression settings are applied afterwards on this page. Frame extraction sends nothing: the frames are drawn from the video player in this tab. Errors shown on the page reach us as cleaned text, with the error type, the tool name, the browser and its version, the extension and a size range.',
        faqs: [
          { q: 'Can I get still images instead of a GIF?', a: 'Yes. Open "Or extract frames as PNG images", choose 1 to 15 frames per second over 1 to 10 seconds from your start, and the page saves up to 150 PNG images, one by one or all in a ZIP. Frames of a very large video are scaled down to fit the browser\'s canvas limit.' },
          { q: 'How can I make the GIF file smaller?', a: 'Lower the "Width" or the "Frames per second", or shorten the clip. You can also set "Compression" to "Light (smaller file)" or "Strong (smallest, some noise)", which gifsicle applies after the GIF is made.' },
          { q: 'Can the GIF play only once?', a: 'Yes. Set "Plays" to "Once", "3 times" or "5 times" before you click "Make GIF"; "Forever (loop)" is the default. The count is written into the GIF file itself.' },
          { q: 'What if my start plus length goes beyond the video?', a: 'The GIF stops where the video ends. When your browser can read the video length, the page shortens the clip itself and shows a note with the real length above the result. A start time after the end of the video is refused with a message.' },
          { q: 'Is there a limit on GIFs?', a: 'Yes: 1 GB per video, 60 seconds per GIF, and a set number of GIFs per hour and per day for each internet connection on our video service. Frame extraction is not limited this way.' },
        ],
        tips: [
          'Play the video in the preview and note the second where your moment starts before you fill in "Start (seconds)".',
        ],
      }}
    />
  );
}
