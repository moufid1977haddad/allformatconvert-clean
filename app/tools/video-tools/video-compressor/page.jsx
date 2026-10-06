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
  description: `Video Compressor makes a video file lighter by encoding it again as an MP4. You choose one of three compression levels, the codec (H.264, which plays on almost every device, or H.265 and AV1, which give smaller files but need a recent phone, computer or browser) and, if you want, a maximum height from 1440p down to 240p. It takes MP4, MOV, MKV, WebM, AVI, WMV, FLV, MPG, TS, 3GP and other video files that have a picture track. ffmpeg does the encoding on our video service, so your browser only sends the file and receives the result. It does not cut or crop: use Video Trimmer or Video Resizer for that.`,
  howToTitle: 'How to compress a video',
  howTo: [
    `Choose or drop a video file; the settings appear once it is loaded.`,
    `Pick a "Compression level" ("Balanced" is selected first) and, if you want, a "Resolution" limit.`,
    `Keep "Codec" on H.264 for a file that plays everywhere, or choose H.265 or AV1 for a smaller one; a number in "Exact quality (CRF), optional" replaces the level.`,
    `Click "Compress Video" and follow the upload, the waiting line when the service is busy, and the encoding percentage.`,
    `Compare the "Before" and "After" sizes, play the result and click "Download" to save the MP4.`,
  ],
  specs: [
    { label: 'Input formats', value: `MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS (a picture track is required)` },
    { label: 'Output', value: `MP4 with H.264, H.265 (HEVC) or AV1 video and AAC sound at 96 kbps` },
    { label: 'Maximum file size', value: `1 GB per video, on a computer as on a phone` },
    { label: 'Length', value: `Our video service sets a maximum duration and a time limit per encoding; a video over either is refused or stopped with a message` },
    { label: 'Usage limits', value: `A set number of videos per hour and per day for each internet connection, shared by every tool that uses our video service; no account` },
  ],
  privacy: `Your video goes in pieces straight from this page to our video service (ffmpeg on Railway). The service deletes the original when the compression ends and the MP4 once this page has downloaded it; an unfinished job is removed after a set time. Its logs keep the operation, a size range, the job's status and timings, never the file name or content. A shown error sends us its cleaned text, the error type, the tool name, your browser and its version, the file extension and a size range.`,
  faqs: [
    { q: 'Does H.265 or AV1 really give a smaller file?', a: `Yes. On a 1080p camera clip measured on 3 October, H.265 and AV1 files were about 40 to 50 % lighter than H.264 at the same visual quality (VMAF): about 40 % for H.265, about 50 % for AV1. On animation H.265 was still lighter, while AV1 was heavier but much sharper. H.264 stays the safest choice for old phones and TVs.` },
    { q: 'Can the compressed video be larger than the original?', a: `No, unless you type an exact CRF. With a level, a result that is not at least 2 % smaller is encoded once more at the next, stronger level; if that still fails, you get no file and the page says the video is already well compressed. "Strong" has no stronger level. An exact CRF is encoded once and delivered as it comes out.` },
    { q: 'Is the sound kept?', a: `Yes. The first audio track is encoded again as AAC at 96 kbps. Other audio tracks, subtitles and the file's metadata, such as its recording date or location, are not copied into the compressed MP4.` },
    { q: 'Can I compress a video on my iPhone?', a: `Yes. The encoding happens on our video service, so Safari on iPhone and iPad works like a computer browser. A video picked from the Photos library reaches the page already shrunk by iOS; save it to the Files app first and pick it there to compress the original.` },
    { q: 'How many videos can I compress?', a: `One at a time, up to 1 GB each, within a set number per hour and per day for your internet connection. The count is shared with the other tools that use our video service. When it is reached, the page says so and you can try again later; no account is needed.` },
  ],
  tips: [
    `If the page says the video is already well compressed, choose a lower "Resolution" instead of a stronger level.`,
    `Cut the part you need with Video Trimmer first: a shorter video uploads sooner and ends up lighter.`,
  ],
};

export default function VideoCompressorPage() {
  if (!mediaServiceConfigured()) return <LegacyVideoCompressor />;
  return (
    <MediaServiceTool
      op="compress"
      title="Video Compressor"
      subtitle="Make a video file lighter as an MP4 — encoded on our video service, up to 1 GB"
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
