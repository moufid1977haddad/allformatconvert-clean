'use client';
import LegacyVideoConverter from './LegacyPage';
import MediaServiceTool from '../../../components/MediaServiceTool';
import { mediaServiceConfigured } from '../../../lib/mediaJob';

// Deployment switch, not a silent fallback: see video-compressor/page.jsx.

const VIDEO_TARGETS = [
  ['mp4', 'MP4 (H.264) — plays everywhere'], ['mov', 'MOV (QuickTime)'], ['mkv', 'MKV'], ['webm', 'WebM (VP9)'],
  ['avi', 'AVI'], ['wmv', 'WMV'], ['flv', 'FLV'], ['mpg', 'MPEG'], ['ts', 'TS (MPEG-TS)'], ['3gp', '3GP'], ['m4v', 'M4V'], ['ogv', 'OGV (Theora)'],
];
const OTHER_TARGETS = [['gif', 'Animated GIF']];
const AUDIO_TARGETS = [
  ['mp3', 'MP3'], ['m4a', 'M4A (AAC)'], ['wav', 'WAV'], ['ogg', 'OGG (Vorbis)'], ['opus', 'Opus'], ['flac', 'FLAC'],
];
const QUALITIES = [['high', 'High quality'], ['medium', 'Balanced'], ['low', 'Small file']];
const HEIGHTS = [['', 'Keep original resolution'], ['1080', 'Limit to 1080p'], ['720', 'Limit to 720p'], ['480', 'Limit to 480p'], ['360', 'Limit to 360p']];

const seo = {
  title: 'Video Converter',
  description: 'Video Converter turns almost any video into MP4, MOV, MKV, WebM, AVI, WMV, FLV, MPEG, TS, 3GP, M4V, OGV or an animated GIF, and extracts the audio as MP3, M4A, WAV, OGG, Opus or FLAC. It runs on our server, so it works in any browser including Safari and iPhone, handles files up to 1 GB, and shows real progress. Your file is deleted from our server as soon as you have downloaded the result.',
  howTo: [
    'Select or drop a video file (up to 1 GB).',
    'Choose the output format, the quality, and an optional maximum resolution.',
    'Click "Convert" and follow the real progress: upload, waiting line if the service is busy, then conversion.',
    'Preview the result and download it — the file name always carries the real extension.',
  ],
  faqs: [
    { q: 'Which formats can I convert to?', a: 'Video: MP4, MOV, MKV, WebM, AVI, WMV, FLV, MPEG, TS, 3GP, M4V, OGV. Animated GIF. Audio only: MP3, M4A, WAV, OGG, Opus, FLAC.' },
    { q: 'Which formats can I convert from?', a: 'Any video or audio file that ffmpeg can read: MP4, MOV (including iPhone videos), MKV, WebM, AVI, WMV, FLV, MPEG, TS, 3GP, OGV and many more.' },
    { q: 'How large a file can I convert?', a: 'Up to 1 GB. The file is uploaded in pieces, straight to the video service, and resumes after a dropped connection.' },
    { q: 'Is my video kept?', a: 'No. The original is deleted the moment conversion ends, and the result is deleted right after your download (or after 15 minutes if you never download it). Nothing about your file is logged.' },
    { q: 'Why can some conversions take longer?', a: 'WebM (VP9) and OGV (Theora) are far slower to encode than MP4. The progress bar shows the real percentage, and a very long file may be stopped by our time limit.' },
  ],
  tips: [
    'MP4 (H.264) is the safest choice for sharing: it plays on every device.',
    'Use "Small file" or a lower resolution when the result must fit an email or chat limit.',
    'To keep just the sound of a video, pick MP3 or M4A.',
    'Keep the tab open while it works; you can cancel at any time.',
  ],
};

export default function VideoConverterPage() {
  if (!mediaServiceConfigured()) return <LegacyVideoConverter />;
  return (
    <MediaServiceTool
      op="convert"
      title="Video Converter"
      subtitle="Convert video to MP4, MOV, MKV, WebM, AVI, GIF, MP3 and more — any browser, up to 1 GB"
      buttonLabel="Convert"
      initialParams={{ target: 'mp4', quality: 'medium', maxHeight: '' }}
      buildParams={(p) => ({ target: p.target, quality: p.quality, ...(p.maxHeight && !AUDIO_TARGETS.some(([v]) => v === p.target) ? { maxHeight: Number(p.maxHeight) } : {}) })}
      outName={(name, ext) => {
        const base = name.replace(/\.[^.]+$/, '');
        const same = name.toLowerCase().endsWith('.' + ext);
        return base + (same ? '-converted' : '') + '.' + ext;
      }}
      controls={({ params, setParams, disabled }) => {
        const audio = AUDIO_TARGETS.some(([v]) => v === params.target);
        const sel = 'w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm';
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Convert to</label>
              <select disabled={disabled} value={params.target} onChange={(e) => setParams({ ...params, target: e.target.value })} className={sel}>
                <optgroup label="Video">{VIDEO_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>
                <optgroup label="Image">{OTHER_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>
                <optgroup label="Audio only">{AUDIO_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Quality</label>
              <select disabled={disabled || params.target === 'gif' || params.target === 'wav' || params.target === 'flac'} value={params.quality} onChange={(e) => setParams({ ...params, quality: e.target.value })} className={sel}>
                {QUALITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Resolution</label>
              <select disabled={disabled || audio || params.target === 'gif'} value={params.maxHeight} onChange={(e) => setParams({ ...params, maxHeight: e.target.value })} className={sel}>
                {HEIGHTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        );
      }}
      seo={seo}
    />
  );
}
