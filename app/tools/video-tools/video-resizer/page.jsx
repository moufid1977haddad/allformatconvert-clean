'use client';
import { useEffect, useState } from 'react';
import MediaServiceTool from '../../../components/MediaServiceTool';

// 30/09 (owner's iPhone): the resizer used to replay the video in a <canvas> and record it with MediaRecorder --
// as long as the video lasts, with the source playing full screen on iPhone, and a WebM that the iPhone's Photos
// app cannot open. It now runs like Video Compressor, on our ffmpeg service (the way Clideo, Kapwing and VEED
// resize): faster than real time, an H.264 + AAC MP4 that plays everywhere, sound kept, and never heavier than the
// original (the service re-tries at a stronger setting first). Fit / Fill / Stretch as before (28/09).

const even = (n) => Math.max(16, Math.min(7680, 2 * Math.round((Number(n) || 0) / 2)));
// 30/09 (real Safari on the Mac): "480p" turned a vertical 1080×1920 phone video into a landscape 854×480. 480p,
// 720p and 1080p name the SHORT side (as YouTube, Clideo and HandBrake use them): a vertical video gets 480×854.
// `oriented` presets follow the video's shape; Square and Vertical are exact sizes.
const PRESETS = [['480p', 854, 480, true], ['720p', 1280, 720, true], ['1080p', 1920, 1080, true], ['Square 1080', 1080, 1080, false], ['Vertical 1080×1920', 1080, 1920, false]];
const sized = (w, h, oriented, src) => (oriented && src && src.h > src.w ? [h, w] : [w, h]);

// The size the video is SHOWN at (the browser applies a phone's rotation), or null when this browser cannot read it.
function useShownSize(file) {
  const [size, setSize] = useState(null); // { file, w, h }: only valid for the file it was read from
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true; v.playsInline = true;
    v.onloadedmetadata = () => { if (v.videoWidth && v.videoHeight) setSize({ file, w: v.videoWidth, h: v.videoHeight }); };
    v.src = url;
    return () => { v.removeAttribute('src'); v.load(); URL.revokeObjectURL(url); };
  }, [file]);
  return size && size.file === file ? size : null;
}

function ResizerControls({ params, setParams, disabled, file }) {
  const src = useShownSize(file);
  // A vertical video starts on the vertical 720p (720×1280), not on a landscape size.
  useEffect(() => {
    if (src && params.w === 1280 && params.h === 720 && src.h > src.w) setParams({ ...params, w: 720, h: 1280 });
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
        <div className="space-y-3">
          {src && <p className="text-sm text-neutral-500">Your video: {src.w}×{src.h} ({src.h > src.w ? 'vertical' : src.h === src.w ? 'square' : 'horizontal'}). 480p, 720p and 1080p keep its orientation.</p>}
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-neutral-500">Width
              <input type="number" min="16" max="7680" step="2" disabled={disabled} value={params.w} onChange={(e) => setParams({ ...params, w: e.target.value })} onBlur={() => setParams({ ...params, w: even(params.w) })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900" />
            </label>
            <label className="block text-sm text-neutral-500">Height
              <input type="number" min="16" max="7680" step="2" disabled={disabled} value={params.h} onChange={(e) => setParams({ ...params, h: e.target.value })} onBlur={() => setParams({ ...params, h: even(params.h) })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-900" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(([label, w, h, oriented]) => {
              const [pw, ph] = sized(w, h, oriented, src);
              return <button key={label} type="button" disabled={disabled} onClick={() => setParams({ ...params, w: pw, h: ph })} title={`${pw}×${ph}`} className="bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800 rounded-lg px-3 py-2 text-sm font-semibold transition">{label}</button>;
            })}
          </div>
          <label htmlFor="vr-mode" className="block text-sm text-neutral-500">If the shape differs from the video&apos;s
            <select id="vr-mode" disabled={disabled} value={params.mode} onChange={(e) => setParams({ ...params, mode: e.target.value })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-900">
              <option value="fit">Fit — keep the whole picture, black bars</option>
              <option value="fill">Fill — crop the edges, no bars</option>
              <option value="stretch">Stretch — distort to the exact size</option>
            </select>
          </label>
        </div>
  );
}

const seo = {
  title: 'Video Resizer',
  description: 'Video Resizer changes the width and height of a video on our ffmpeg server, so it works in any browser, including Safari on iPhone, and runs faster than the video plays. Keep the whole picture with black bars (Fit), crop the edges (Fill) or stretch it to the exact size. You get an H.264 + AAC MP4 with the original sound, the format every phone and computer plays.',
  howTo: [
    'Select or drop a video file (MP4, MOV, MKV, WebM, AVI and more, up to 1 GB).',
    'Enter the new width and height, or click a preset (480p, 720p, 1080p, square, vertical). 480p, 720p and 1080p keep your video’s orientation: a vertical video becomes 480×854, 720×1280 or 1080×1920.',
    'Choose Fit, Fill or Stretch for a video of another shape, then click "Resize Video" and follow the real progress.',
    'Preview and download the resized MP4.',
  ],
  faqs: [
    { q: 'Does it preserve aspect ratio automatically?', a: 'Yes, by default: when the new size has another shape than your video, the whole picture is kept with black bars (Fit). You can also crop the edges instead (Fill), or stretch it to the exact size (Stretch).' },
    { q: 'Does the resized video have audio?', a: 'Yes — the original sound is kept (re-encoded in AAC, like the picture in H.264).' },
    { q: 'What output format do I get?', a: 'An MP4 (H.264 video, AAC audio), which plays on iPhone, Android, Mac, Windows and every browser. Width and height are rounded to even numbers, as H.264 requires.' },
    { q: 'Is my file uploaded anywhere?', a: 'Yes, to our own video service, because resizing a video needs a real video encoder. The original is deleted as soon as the resize ends, and the result right after your download (or after 15 minutes if you never download it).' },
    { q: 'How long does it take?', a: 'Usually less than the length of the video, plus the upload. It no longer has to play the whole video in your browser.' },
  ],
  tips: [
    'To avoid black bars without cropping, divide your video\'s width and height by the same number.',
    'For Instagram Reels, TikTok or Shorts, use the vertical 1080×1920 preset with Fill.',
    'Making a video smaller than its original size also makes the file much lighter.',
    'Use the presets for common platform sizes instead of typing custom numbers.',
  ],
};

export default function VideoResizerPage() {
  return (
    <MediaServiceTool
      op="convert"
      tool="video-resizer"
      title="Video Resizer"
      subtitle="Resize video dimensions — any browser, up to 1 GB, MP4 out"
      buttonLabel="Resize Video"
      initialParams={{ w: 1280, h: 720, mode: 'fit' }}
      buildParams={(p) => ({ target: 'mp4', quality: 'high', fit: { w: even(p.w), h: even(p.h), mode: p.mode } })}
      outName={(name, ext, p) => `${name.replace(/\.[^.]+$/, '')}-${even(p.w)}x${even(p.h)}.mp4`}
      controls={(props) => <ResizerControls {...props} />}
      seo={seo}
    />
  );
}
