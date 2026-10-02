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
// P25 (03/10, E5): the codec, as FreeConvert's compressor offers it (H.264 / H.265), plus AV1. Levels measured 03/10 on
// two 1080p clips (docs/audit/RAPPORT-p25-decisions-03-10.md §5): on camera footage, at the same VMAF as the H.264
// level, H.265 is about 40 % smaller and AV1 about 50 %; on animation, H.265 is smaller AND better, AV1 larger but far
// better. And an exact CRF for those who know what they want.
const CODECS = [
  { value: 'h264', label: 'H.264 — plays everywhere' },
  { value: 'h265', label: 'H.265 / HEVC — much smaller, most phones and computers' },
  { value: 'av1', label: 'AV1 — best quality for its size, recent browsers and devices' },
];
const CRF_MAX = { h264: 51, h265: 51, av1: 63 };
const HEIGHTS = [
  { value: '', label: 'Keep original resolution' },
  // P24 (03/10): 4K and 1440p sources can be kept sharp at a lower size; the service accepts 144-4320 px
  { value: '1440', label: 'Limit to 1440p' },
  { value: '1080', label: 'Limit to 1080p' },
  { value: '720', label: 'Limit to 720p' },
  { value: '480', label: 'Limit to 480p' },
  { value: '360', label: 'Limit to 360p' },
  { value: '240', label: 'Limit to 240p' },
];

const seo = {
  title: 'Video Compressor',
  description: 'Video Compressor shrinks video files with the encoders used by professional tools — H.264, or H.265 and AV1 (in our tests on camera video, 40 to 50 % smaller at the same quality) — on our server, so it works in any browser (including Safari and iPhone) and runs faster than the video plays. Choose a compression level and an optional resolution limit, watch real progress, and download an MP4. Your file is deleted from our server as soon as you have downloaded the result.',
  howTo: [
    'Select or drop a video file (MP4, MOV, MKV, WebM, AVI, WMV, FLV and more, up to 1 GB).',
    'Pick a compression level and, if you want, a maximum resolution.',
    'Click "Compress Video" and follow the real progress: upload, waiting line if the service is busy, then compression.',
    'Compare the before and after size, preview the result, and download the MP4.',
  ],
  faqs: [
    { q: 'How large a video can I compress?', a: 'Up to 1 GB per file. The file goes straight to our video service in pieces, so a dropped connection resumes instead of starting over.' },
    { q: 'What do I get?', a: 'An MP4 with AAC sound and, by default, H.264 video, the format that plays on every phone, computer and browser. You can choose H.265 (HEVC) or AV1. In our tests on 1080p camera footage, at the same visual quality (VMAF) as H.264, H.265 files were about 40 % smaller and AV1 files about 50 % smaller; most phones and recent computers play H.265, while AV1 plays in current Chrome, Firefox and Edge and on recent devices.' },
    { q: 'Can I set the exact quality?', a: 'Yes: type a CRF value (lower = better and bigger; 0-51 for H.264 and H.265, 0-63 for AV1). The video is then encoded once at exactly that value — even if the result comes out larger than the original, since that was your choice.' },
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
      initialParams={{ level: 'balanced', maxHeight: '', codec: 'h264', crf: '' }}
      buildParams={(p) => ({ level: p.level, ...(p.maxHeight ? { maxHeight: Number(p.maxHeight) } : {}), ...(p.codec && p.codec !== 'h264' ? { codec: p.codec } : {}), ...(p.crf !== '' && p.crf != null ? { crf: Math.round(Number(p.crf)) } : {}) })}
      outName={(name, ext, p) => name.replace(/\.[^.]+$/, '') + (p && p.codec && p.codec !== 'h264' ? `-${p.codec}` : '') + '-compressed.mp4'}
      controls={({ params, setParams, disabled }) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Compression level</label>
            <select aria-label="Compression level" disabled={disabled} value={params.level} onChange={(e) => setParams({ ...params, level: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm">
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Resolution</label>
            <select aria-label="Resolution" disabled={disabled} value={params.maxHeight} onChange={(e) => setParams({ ...params, maxHeight: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm">
              {HEIGHTS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Codec</label>
            <select id="vcomp-codec" aria-label="Codec" disabled={disabled} value={params.codec} onChange={(e) => setParams({ ...params, codec: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm">
              {CODECS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Exact quality (CRF), optional</label>
            <input id="vcomp-crf" type="number" min="0" max={CRF_MAX[params.codec]} step="1" disabled={disabled} value={params.crf} placeholder={`Automatic, from the level — or 0 to ${CRF_MAX[params.codec]}`} onChange={(e) => setParams({ ...params, crf: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      )}
      seo={seo}
    />
  );
}
