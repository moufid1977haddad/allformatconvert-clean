'use client';
import LegacyVideoCompressor from './LegacyPage';
import MediaServiceTool from '../../../components/MediaServiceTool';
import { mediaServiceConfigured } from '../../../lib/mediaJob';

// Deployment switch, not a silent fallback: while NEXT_PUBLIC_MEDIA_SERVICE_URL
// is not set (the media-processing service is not deployed yet), the previous
// in-browser tool stays in place, exactly as it was. Once the variable is set
// and the site rebuilt, this page runs on the service (any browser, up to 1 GB,
// faster than real time). See docs/audit/RAPPORT-video-architecture.md.

const LEVELS = [
  { value: 'light', label: 'Light — best quality, smaller file' },
  { value: 'balanced', label: 'Balanced — recommended' },
  { value: 'strong', label: 'Strong — smallest file' },
];
const HEIGHTS = [
  { value: '', label: 'Keep original resolution' },
  { value: '1080', label: 'Limit to 1080p' },
  { value: '720', label: 'Limit to 720p' },
  { value: '480', label: 'Limit to 480p' },
  { value: '360', label: 'Limit to 360p' },
];

const seo = {
  title: 'Video Compressor',
  description: 'Video Compressor shrinks video files with the same H.264 encoder used by professional tools, on our server, so it works in any browser (including Safari and iPhone) and runs faster than the video plays. Choose a compression level and an optional resolution limit, watch real progress, and download an MP4 that plays everywhere. Your file is deleted from our server as soon as you have downloaded the result.',
  howTo: [
    'Select or drop a video file (MP4, MOV, MKV, WebM, AVI, WMV, FLV and more, up to 1 GB).',
    'Pick a compression level and, if you want, a maximum resolution.',
    'Click "Compress Video" and follow the real progress: upload, waiting line if the service is busy, then compression.',
    'Compare the before and after size, preview the result, and download the MP4.',
  ],
  faqs: [
    { q: 'How large a video can I compress?', a: 'Up to 1 GB per file. The file goes straight to our video service in pieces, so a dropped connection resumes instead of starting over.' },
    { q: 'What do I get?', a: 'An H.264 + AAC MP4, the format that plays on every phone, computer and browser.' },
    { q: 'Is my video kept?', a: 'No. The original is deleted the moment compression ends, and the result is deleted right after your download (or after 15 minutes if you never download it). Nothing about your file is logged.' },
    { q: 'Why is this not done in the browser?', a: 'Compressing on a server is several times faster than real time and works on iPhone and Safari, where in-browser video recording is not available.' },
    { q: 'Can the result be larger than the original?', a: 'No. The compressor is given a size ceiling taken from your own file. If a result still is not smaller, it automatically tries one stronger setting, and if that is not smaller either it tells you your video is already well compressed instead of handing you a bigger file. To go smaller in that case, lower the resolution.' },
  ],
  tips: [
    'Balanced is right for most videos; use Strong for messaging apps and email limits.',
    'Limiting the resolution to 720p usually shrinks a phone video far more than a higher compression level.',
    'Keep the tab open while it works; you can cancel at any time.',
    'iPhone videos (.mov) are accepted directly.',
  ],
};

export default function VideoCompressorPage() {
  if (!mediaServiceConfigured()) return <LegacyVideoCompressor />;
  return (
    <MediaServiceTool
      op="compress"
      title="Video Compressor"
      subtitle="Compress video files — any browser, up to 1 GB"
      buttonLabel="Compress Video"
      initialParams={{ level: 'balanced', maxHeight: '' }}
      buildParams={(p) => ({ level: p.level, ...(p.maxHeight ? { maxHeight: Number(p.maxHeight) } : {}) })}
      outName={(name) => name.replace(/\.[^.]+$/, '') + '-compressed.mp4'}
      controls={({ params, setParams, disabled }) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Compression level</label>
            <select disabled={disabled} value={params.level} onChange={(e) => setParams({ ...params, level: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm">
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Resolution</label>
            <select disabled={disabled} value={params.maxHeight} onChange={(e) => setParams({ ...params, maxHeight: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm">
              {HEIGHTS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>
      )}
      seo={seo}
    />
  );
}
