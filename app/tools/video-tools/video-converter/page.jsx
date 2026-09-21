'use client';
import LegacyVideoConverter from './LegacyPage';
import MediaServiceTool from '../../../components/MediaServiceTool';
import { mediaServiceConfigured } from '../../../lib/mediaJob';

// Deployment switch, not a silent fallback: see video-compressor/page.jsx.

const VIDEO_TARGETS = [
  ['mp4', 'MP4 (H.264) — plays everywhere'], ['h265', 'H.265 / HEVC (MP4) — smaller files'], ['av1', 'AV1 (MP4) — smallest files, recent devices'],
  ['mov', 'MOV (QuickTime)'], ['mkv', 'MKV'], ['webm', 'WebM (VP9)'],
  ['avi', 'AVI'], ['xvid', 'AVI (XviD)'], ['wmv', 'WMV'], ['asf', 'ASF'], ['flv', 'FLV'], ['f4v', 'F4V'],
  ['mpg', 'MPG'], ['mpeg', 'MPEG'], ['vob', 'VOB'], ['ts', 'TS (MPEG-TS)'], ['m2ts', 'M2TS'], ['mts', 'MTS (AVCHD)'],
  ['3gp', '3GP'], ['3g2', '3G2'], ['m4v', 'M4V'], ['ogv', 'OGV (Theora)'],
];
const OTHER_TARGETS = [['gif', 'Animated GIF']];
const AUDIO_TARGETS = [
  ['mp3', 'MP3'], ['m4a', 'M4A (AAC)'], ['aac', 'AAC'], ['wav', 'WAV'], ['aiff', 'AIFF'], ['ogg', 'OGG (Vorbis)'], ['opus', 'Opus'],
  ['flac', 'FLAC'], ['wma', 'WMA'], ['ac3', 'AC3'], ['amr', 'AMR (voice, 8 kHz mono)'],
];
// Formats whose file extension does not say which codec is inside: the name says it.
const NAME_TAG = { h265: '-h265', av1: '-av1', xvid: '-xvid', mts: '', asf: '' };
const QUALITIES = [['high', 'High quality'], ['medium', 'Balanced'], ['low', 'Small file']];
const HEIGHTS = [['', 'Keep original resolution'], ['1080', 'Limit to 1080p'], ['720', 'Limit to 720p'], ['480', 'Limit to 480p'], ['360', 'Limit to 360p']];

const seo = {
  title: 'Video Converter',
  description: 'Video Converter turns almost any video into MP4, H.265 (HEVC), AV1, MOV, MKV, WebM, AVI, WMV, FLV, MPEG, VOB, TS, M2TS, 3GP, 3G2 and more (22 video formats) or an animated GIF, and extracts the audio as MP3, M4A, AAC, WAV, AIFF, OGG, Opus, FLAC, WMA, AC3 or AMR. It runs on our server, so it works in any browser including Safari and iPhone, handles files up to 1 GB, and shows real progress. Your file is deleted from our server as soon as you have downloaded the result.',
  howTo: [
    'Select or drop a video file (up to 1 GB).',
    'Choose the output format, the quality, and an optional maximum resolution.',
    'Click "Convert" and follow the real progress: upload, waiting line if the service is busy, then conversion.',
    'Preview the result and download it — the file name always carries the real extension.',
  ],
  faqs: [
    { q: 'Which formats can I convert to?', a: 'Video: MP4 (H.264), H.265 / HEVC, AV1, MOV, MKV, WebM, AVI, AVI (XviD), WMV, ASF, FLV, F4V, MPG, MPEG, VOB, TS, M2TS, MTS, 3GP, 3G2, M4V, OGV. Animated GIF. Audio only: MP3, M4A, AAC, WAV, AIFF, OGG, Opus, FLAC, WMA, AC3, AMR.' },
    { q: 'Can the converted video be larger than the original?', a: 'Not by design: the encoder is given a size ceiling taken from your own file, so a converted video does not exceed the original. The one exception is the MPEG-2 family (MPG, MPEG, VOB), an old codec that needs about twice the data of H.264 for the same picture; on demanding footage it can come out a few percent larger. The page always shows the real before and after sizes.' },
    { q: 'Which format should I pick: H.265 or AV1?', a: 'H.265 (HEVC) and AV1 are newer codecs designed to give smaller files than H.264 at similar quality, and they take longer to encode. H.265 plays on most phones and recent computers; AV1 plays in current Chrome, Firefox and Edge, while older devices and many TVs cannot play it. When in doubt, choose MP4 (H.264), which plays everywhere.' },
    { q: 'Which formats can I convert from?', a: 'Any video or audio file that ffmpeg can read: MP4, MOV (including iPhone videos), MKV, WebM, AVI, WMV, FLV, MPEG, TS, 3GP, OGV and many more.' },
    { q: 'How large a file can I convert?', a: 'Up to 1 GB. The file is uploaded in pieces, straight to the video service, and resumes after a dropped connection.' },
    { q: 'Is my video kept?', a: 'No. The original is deleted the moment conversion ends, and the result is deleted right after your download (or after 15 minutes if you never download it). Nothing about your file is logged.' },
    { q: 'Why can some conversions take longer?', a: 'H.265, AV1, WebM (VP9) and OGV (Theora) are far slower to encode than MP4, because they squeeze more out of every byte. The progress bar shows the real percentage, and a very long file may be stopped by our time limit.' },
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
      outName={(name, ext, params) => {
        const base = name.replace(/\.[^.]+$/, '');
        const tag = NAME_TAG[params && params.target] || '';
        const same = name.toLowerCase().endsWith('.' + ext);
        return base + tag + (same && !tag ? '-converted' : '') + '.' + ext;
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
