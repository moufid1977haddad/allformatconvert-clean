'use client';
import MediaServiceTool from '../../../components/MediaServiceTool';

// 30/09 (owner's iPhone): the filter used to replay the video in a <canvas> with a CSS filter and record it with
// MediaRecorder -- refused on Safari (no canvas filter there), in real time elsewhere, and a WebM out. It now runs
// on our ffmpeg service, like Video Compressor, in every browser: the same filters with the same formulas as the CSS
// preview (services/media-processing/app/ffmpeg_ops.py VIDEO_FILTERS, checked colour by colour), an H.264 + AAC MP4
// with the original sound, never heavier than the original.

const FILTERS = [
  { name: 'Grayscale', value: 'grayscale', css: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia', css: 'sepia(100%)' },
  { name: 'Invert', value: 'invert', css: 'invert(100%)' },
  { name: 'Blur', value: 'blur', css: 'blur(3px)' },
  { name: 'Brightness', value: 'brightness', css: 'brightness(150%)' },
  { name: 'Contrast', value: 'contrast', css: 'contrast(200%)' },
  { name: 'Saturate', value: 'saturate', css: 'saturate(300%)' },
];

const seo = {
  title: 'Video Filter',
  description: 'Video Filter applies one visual effect (Grayscale, Sepia, Invert, Blur, Brightness, Contrast or Saturate) to your video on our ffmpeg server, so it works in every browser, including Safari on iPhone, and faster than the video plays. Preview the filter live on the player, then get an H.264 + AAC MP4 with the original sound, the format every phone and computer plays.',
  howTo: [
    'Select or drop a video file (MP4, MOV, MKV, WebM, AVI and more, up to 1 GB).',
    'Pick a filter: the player shows it live.',
    'Click "Apply Filter" and follow the real progress.',
    'Preview and download the filtered MP4.',
  ],
  faqs: [
    { q: 'Can I combine multiple filters?', a: 'No, only one filter can be applied at a time — selecting a new one replaces the previous choice.' },
    { q: 'Can I adjust filter intensity?', a: 'Not currently — each filter uses a fixed preset value (Blur 3 px, Brightness 150 %, Contrast 200 %, Saturate 300 %), the same as the live preview.' },
    { q: 'Does the output have sound?', a: 'Yes — the original sound is kept; the visual filter does not change it.' },
    { q: 'Does it work on iPhone and in Safari?', a: 'Yes. The filter is applied by our video service, not by your browser, so it works in every browser and the MP4 opens in the iPhone Photos app.' },
    { q: 'Is my file uploaded anywhere?', a: 'Yes, to our own video service, because re-encoding a video needs a real video encoder. The original is deleted as soon as the filter is applied, and the result right after your download (or after 15 minutes if you never download it).' },
  ],
  tips: [
    'Preview the filter on the live player (it updates instantly) before applying it.',
    'The audio is carried through unchanged — the visual filter has no effect on sound.',
    'Trim your video first if you only need a filtered clip from a longer video: it uploads and processes faster.',
    'Grayscale uses the same luminance weights as image editors, so blue stays darker than green.',
  ],
};

export default function VideoFilterPage() {
  return (
    <MediaServiceTool
      op="convert"
      tool="video-filter"
      title="Video Filter"
      subtitle="Apply a filter to a video — any browser, up to 1 GB, MP4 out"
      buttonLabel="Apply Filter"
      initialParams={{ filter: 'grayscale' }}
      buildParams={(p) => ({ target: 'mp4', quality: 'high', filter: p.filter })}
      outName={(name, ext, p) => `${name.replace(/\.[^.]+$/, '')}-${p.filter}.mp4`}
      previewStyle={(p) => ({ filter: FILTERS.find((f) => f.value === p.filter)?.css || 'none' })}
      controls={({ params, setParams, disabled }) => (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Filter">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" role="radio" aria-checked={params.filter === f.value} disabled={disabled} onClick={() => setParams({ ...params, filter: f.value })}
              className={`py-2 rounded-lg text-sm font-semibold transition ${params.filter === f.value ? 'bg-indigo-600 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'}`}>{f.name}</button>
          ))}
        </div>
      )}
      seo={seo}
    />
  );
}
