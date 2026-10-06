'use client';
import { useEffect, useState } from 'react';
import MediaServiceTool from '../../../components/MediaServiceTool';
import CropControls, { clampCrop } from './CropControls';

// 30/09 (owner's iPhone): the resizer used to replay the video in a <canvas> and record it with MediaRecorder --
// as long as the video lasts, with the source playing full screen on iPhone, and a WebM that the iPhone's Photos
// app cannot open. It now runs like Video Compressor, on our ffmpeg service (the way Clideo, Kapwing and VEED
// resize): faster than real time, an H.264 + AAC MP4 that plays everywhere, sound kept, and never heavier than the
// original (the service re-tries at a stronger setting first). Fit / Fill / Stretch as before (28/09).

const even = (n) => Math.max(16, Math.min(7680, 2 * Math.round((Number(n) || 0) / 2)));
// 30/09 (real Safari on the Mac): "480p" turned a vertical 1080×1920 phone video into a landscape 854×480. 480p,
// 720p and 1080p name the SHORT side (as YouTube, Clideo and HandBrake use them): a vertical video gets 480×854.
// `oriented` presets follow the video's shape; Square and Vertical are exact sizes.
// P24 (03/10): Kapwing's resizer offers social formats (9:16, 4:5, 1:1, 16:9) and 4K; the service's fit takes up to 7680 px
const PRESETS = [['480p', 854, 480, true], ['720p', 1280, 720, true], ['1080p', 1920, 1080, true], ['4K (2160p)', 3840, 2160, true], ['Square 1080', 1080, 1080, false], ['Vertical 1080×1920', 1080, 1920, false], ['Portrait post 4:5 (1080×1350)', 1080, 1350, false], ['Story 720×1280', 720, 1280, false], ['4:3 (1440×1080)', 1440, 1080, false]];
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
    if (!src) return;
    const next = { ...params };
    if (params.w === 1280 && params.h === 720 && src.h > src.w) { next.w = 720; next.h = 1280; }
    // P25: the crop box starts on the middle 80 % of the picture
    next.crop = clampCrop({ x: src.w * 0.1, y: src.h * 0.1, w: src.w * 0.8, h: src.h * 0.8 }, src, 'free');
    next.ratio = 'free';
    setParams(next);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  const tabs = (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Resize or crop">
      {[['resize', 'Resize'], ['crop', 'Crop']].map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={params.edit === v} disabled={disabled} onClick={() => setParams({ ...params, edit: v })}
          className={`rounded-lg border p-2 font-semibold ${params.edit === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-neutral-50 border-neutral-200'}`}>{l}</button>
      ))}
    </div>
  );
  if (params.edit === 'crop') {
    return (
      <div className="space-y-3">
        {tabs}
        {params.crop
          ? <CropControls file={file} src={src} crop={params.crop} ratio={params.ratio || 'free'} disabled={disabled} onChange={(crop, ratio) => setParams({ ...params, crop, ratio })} />
          : <p className="text-sm text-neutral-500">Reading the video&apos;s size…</p>}
      </div>
    );
  }
  return (
        <div className="space-y-3">
          {tabs}
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
  description: `Video Resizer gives a video a new width and height, or crops it to an area you choose. To resize, type the size or click a preset: 480p, 720p, 1080p and 4K follow your video's orientation, and there are square, vertical, 4:5 portrait, story and 4:3 sizes. If the new shape differs, choose Fit (black bars), Fill (edges cut off) or Stretch. To crop, move and size a box over the picture, freely or in a fixed shape (1:1, 16:9, 9:16, 4:5, 4:3); the kept area is not scaled. ffmpeg does the work on our video service and returns an MP4.`,
  howToTitle: 'How to resize or crop a video',
  howTo: [
    `Choose or drop a video file; when your browser can read its size, the page shows it and says whether the video is vertical, square or horizontal.`,
    `On "Resize", type a "Width" and a "Height" or click a preset such as "720p", then choose Fit, Fill or Stretch for a different shape.`,
    `To crop instead, click "Crop", drag the box or type "Left", "Top", "Width" and "Height", or click "Whole picture" to start again.`,
    `Click "Resize Video"; a waiting line appears when the service is busy, then the processing percentage.`,
    `Play the result and click "Download": the MP4 name carries its new size, or -cropped and the kept size.`,
  ],
  specs: [
    { label: 'Input formats', value: `MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS` },
    { label: 'Output', value: `MP4 at the new size or the cropped area (H.264 video, AAC sound at 160 kbps)` },
    { label: 'New size', value: `16 to 7680 pixels per side, even numbers only (odd values are rounded)` },
    { label: 'Crop area', value: `At least 16 × 16 pixels, even sides; the kept pixels are not scaled` },
    { label: 'Maximum file size', value: `1 GB on a computer or a phone` },
    { label: 'Usage limits', value: `A set number of resizes per hour and per day for each internet connection on our video service; no account` },
  ],
  privacy: `Resizing and cropping happen on our video service on Railway: the page uploads the video there in pieces, directly, not through the website's server. When ffmpeg is done, the service deletes your original; it deletes the resized MP4 once this page has downloaded it, or after a set time if the job is abandoned. Our service's logs list the job's operation, size range, status and timings, not your file. If resizing fails, the cleaned message, its error type, the tool name, your browser and version, the file type and a size range are reported to us.`,
  faqs: [
    { q: 'Can I make a video 9:16 for Reels, TikTok or Shorts?', a: `Yes. Click "Vertical 1080×1920" and choose Fill to cut the sides of a horizontal video, or Fit to keep the whole picture with black bars above and below. With "Crop" and the 9:16 shape you choose which part of the picture stays.` },
    { q: 'Does it keep the aspect ratio?', a: `Yes with Fit, the default: the whole picture is scaled to fit the new size and black bars fill the rest. Fill keeps the ratio too but cuts the edges, and Stretch changes the ratio to match the exact width and height.` },
    { q: 'Can I make a video bigger than the original?', a: `Yes, up to 7680 pixels per side, but enlarging adds no detail. The 480p, 720p, 1080p and 4K presets follow your video's orientation, so a vertical video gets 720×1280 rather than 1280×720.` },
    { q: 'Is the sound kept?', a: `Yes. The first audio track is encoded again as AAC at 160 kbps, next to the H.264 picture. Extra audio tracks and subtitles are left out.` },
  ],
  tips: [
    `To avoid black bars without cropping, divide your video's width and height by the same number.`,
  ],
};

export default function VideoResizerPage() {
  return (
    <MediaServiceTool
      op="convert"
      tool="video-resizer"
      title="Video Resizer"
      subtitle="Change a video's width and height, or crop it to the area you draw"
      buttonLabel="Resize Video"
      initialParams={{ w: 1280, h: 720, mode: 'fit', edit: 'resize', crop: null, ratio: 'free' }}
      buildParams={(p) => {
        if (p.edit === 'crop') {
          if (!p.crop) throw new Error("The video's size could not be read here, so the crop box cannot be placed. Try another browser, or use Resize.");
          const c = { x: 2 * Math.floor(p.crop.x / 2), y: 2 * Math.floor(p.crop.y / 2), w: Math.max(16, 2 * Math.floor(p.crop.w / 2)), h: Math.max(16, 2 * Math.floor(p.crop.h / 2)) };
          return { target: 'mp4', quality: 'high', crop: c };
        }
        return { target: 'mp4', quality: 'high', fit: { w: even(p.w), h: even(p.h), mode: p.mode } };
      }}
      outName={(name, ext, p) => (p.edit === 'crop' && p.crop
        ? `${name.replace(/\.[^.]+$/, '')}-cropped-${2 * Math.floor(p.crop.w / 2)}x${2 * Math.floor(p.crop.h / 2)}.mp4`
        : `${name.replace(/\.[^.]+$/, '')}-${even(p.w)}x${even(p.h)}.mp4`)}
      controls={(props) => <ResizerControls {...props} />}
      seo={seo}
    />
  );
}
