'use client';
import LegacyVideoConverter from './LegacyPage';
import MediaServiceTool from '../../../components/MediaServiceTool';
import { mediaServiceConfigured } from '../../../lib/mediaJob';
import { AUDIO_TARGETS, EDITABLE, buildConvertParams, editConflict } from './convertParams';

// Deployment switch, not a silent fallback: see video-compressor/page.jsx.

const VIDEO_TARGETS = [
  ['mp4', 'MP4 (H.264) — plays everywhere'], ['h265', 'H.265 / HEVC (MP4) — smaller files'], ['av1', 'AV1 (MP4) — smallest files, recent devices'],
  ['mov', 'MOV (QuickTime)'], ['mkv', 'MKV'], ['webm', 'WebM (VP9)'],
  ['avi', 'AVI'], ['xvid', 'AVI (XviD)'], ['wmv', 'WMV'], ['asf', 'ASF'], ['flv', 'FLV'], ['f4v', 'F4V'],
  ['mpg', 'MPG'], ['mpeg', 'MPEG'], ['vob', 'VOB'], ['ts', 'TS (MPEG-TS)'], ['m2ts', 'M2TS'], ['mts', 'MTS (AVCHD)'],
  ['3gp', '3GP'], ['3g2', '3G2'], ['m4v', 'M4V'], ['ogv', 'OGV (Theora)'],
];
const OTHER_TARGETS = [['gif', 'Animated GIF']];
// Formats whose file extension does not say which codec is inside: the name says it.
const NAME_TAG = { h265: '-h265', av1: '-av1', xvid: '-xvid', mts: '', asf: '' };
const QUALITIES = [['high', 'High quality'], ['medium', 'Balanced'], ['low', 'Small file']];
// P24 (03/10): 123apps' converter offers a full resolution menu; the service accepts any limit from 144 to 4320 px
// Speed, mirror, volume, fades and CRF (P25), and the request itself: ./convertParams.js
const SPEEDS = [['0.25', '0.25× (slow motion)'], ['0.5', '0.5×'], ['0.75', '0.75×'], ['1', 'Normal speed'], ['1.25', '1.25×'], ['1.5', '1.5×'], ['2', '2×'], ['3', '3×'], ['4', '4× (time-lapse)']];
const CRF_MAX = { h265: 51, av1: 63 };
const HEIGHTS = [['', 'Keep original resolution'], ['2160', 'Limit to 2160p (4K)'], ['1440', 'Limit to 1440p'], ['1080', 'Limit to 1080p'], ['720', 'Limit to 720p'], ['480', 'Limit to 480p'], ['360', 'Limit to 360p'], ['240', 'Limit to 240p'], ['144', 'Limit to 144p']];

const seo = {
  title: 'Video Converter',
  description: `Video Converter changes the format of a video with ffmpeg on our video service. The 22 video outputs include MP4 (H.264), H.265 and AV1 in MP4, MOV, MKV, WebM (VP9), AVI, WMV, FLV, MPG, VOB, TS, M2TS, 3GP, M4V and OGV. It can also turn the video into an animated GIF, or keep only the sound as MP3, M4A, AAC, WAV, AIFF, OGG, Opus, FLAC, WMA, AC3 or AMR. For MP4, MOV and M4V results, extra settings change the speed, mirror the picture, set the volume and add fades. It accepts video files only; for an audio file, use Audio Converter.`,
  howToTitle: 'How to convert a video to another format',
  howTo: [
    `Choose or drop a video file: MP4, MOV, MKV, WebM, AVI or another video type.`,
    `Pick the target in "Convert to": a video format, "Animated GIF", or a format under "Audio only".`,
    `Set "Quality" and, for video, an optional "Resolution" limit; for MP4, H.265, AV1, MOV or M4V, "More options: speed, mirror, volume, fades, exact quality" adds edits. A "Resolution" limit cannot be combined with a speed or a mirror: the page says so, and "Convert" stays off, before anything is uploaded.`,
    `Click "Convert" and follow the upload, the waiting line and the conversion percentage.`,
    `Click "Download": the file name ends with the real extension, plus a tag such as -h265 or -av1 when the extension alone does not show the codec.`,
  ],
  specs: [
    { label: 'Input formats', value: `Video files only: MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS` },
    { label: 'Video output', value: `MP4 (H.264), H.265, AV1, MOV, MKV, WebM (VP9), AVI, AVI (XviD), WMV, ASF, FLV, F4V, MPG, MPEG, VOB, TS, M2TS, MTS, 3GP, 3G2, M4V, OGV` },
    { label: 'GIF and audio output', value: `Animated GIF; MP3, M4A, AAC, WAV, AIFF, OGG, Opus, FLAC, WMA, AC3, AMR` },
    { label: 'Maximum file size', value: `1 GB on a computer or a phone; our video service also sets a maximum duration and a time limit per conversion` },
    { label: 'Editing (MP4, H.265, AV1, MOV, M4V)', value: `Speed from 0.25× to 4× with the pitch kept, mirror, volume from 0 to 300 %, fade in and fade out of up to 10 seconds each, exact CRF` },
    { label: 'Usage limits', value: `Each internet connection can convert a set number of files per hour and per day on our video service; no account` },
  ],
  privacy: `The video is uploaded in pieces from this page directly to our video service on Railway, where ffmpeg converts it. The original is erased when the conversion is over, and the converted file once this page has fetched it; an abandoned job is cleared after a set time. The logs record what was done, a size range, the job status and timings, never the file's name or content. When a failure is shown, its cleaned message, the error type, the tool, your browser and version, the file extension and a size range are sent to us.`,
  faqs: [
    { q: 'Can I convert a video to MP3?', a: `Yes. Choose MP3, or another format under "Audio only": the first audio track is kept and the picture is dropped. MP3 uses the "Quality" setting, while WAV and FLAC are written without loss. A video without sound gives an error message instead of an empty file.` },
    { q: 'Can the converted file be larger than the original?', a: `Yes, sometimes. A larger MP4, H.265, AV1, MOV, M4V, MKV, WebM, FLV, F4V, TS, M2TS, MTS, 3GP or 3G2 result is encoded again with stronger compression, up to 3 tries; if the last is still larger, you get it and the page shows "Larger by". AVI, XviD, WMV, ASF, MPG, MPEG, VOB and OGV get a bitrate taken from your file. An exact CRF, GIF and audio are never retried.` },
    { q: 'Is H.265 or AV1 better than MP4 (H.264)?', a: `No, not for compatibility: MP4 (H.264) is the one to pick when the file must play everywhere. H.265 and AV1 are newer codecs; in our two test clips both gave smaller files than H.264. H.265 plays on most phones and computers, AV1 on recent browsers and devices. AV1 is written in MP4 only.` },
    { q: 'Can I turn a whole video into a GIF here?', a: `Yes, with fixed settings: the converter makes a GIF of the entire video at 12 frames per second and at most 640 pixels wide. To choose a start, a length of up to 60 seconds, the width and the frame rate, use Video to GIF instead.` },
    { q: 'Is there a limit?', a: `Yes: 1 GB per file, plus a maximum duration and a time limit per conversion set on our video service, and a set number of conversions per hour and per day for each internet connection. The page tells you which limit was reached.` },
  ],
  tips: [
    `For a phone or TV that cannot open a file, convert it to "MP4 (H.264) — plays everywhere".`,
    `Choose "Small file" or a lower "Resolution" when the result must fit an email or chat attachment limit.`,
  ],
};

export default function VideoConverterPage() {
  if (!mediaServiceConfigured()) return <LegacyVideoConverter />;
  return (
    <MediaServiceTool
      op="convert"
      title="Video Converter"
      subtitle="Convert video to MP4, MOV, MKV, WebM, AVI, GIF, MP3 and more — on our video service, up to 1 GB"
      buttonLabel="Convert"
      initialParams={{ target: 'mp4', quality: 'medium', maxHeight: '', flip: '', speed: '1', volume: '100', fadeIn: '0', fadeOut: '0', fadeVideo: false, crf: '' }}
      buildParams={buildConvertParams}
      problem={editConflict}
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
              <select aria-label="Convert to" disabled={disabled} value={params.target} onChange={(e) => setParams({ ...params, target: e.target.value })} className={sel}>
                <optgroup label="Video">{VIDEO_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>
                <optgroup label="Image">{OTHER_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>
                <optgroup label="Audio only">{AUDIO_TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Quality</label>
              <select aria-label="Quality" disabled={disabled || params.target === 'gif' || params.target === 'wav' || params.target === 'flac'} value={params.quality} onChange={(e) => setParams({ ...params, quality: e.target.value })} className={sel}>
                {QUALITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Resolution</label>
              <select aria-label="Resolution" disabled={disabled || audio || params.target === 'gif'} value={params.maxHeight} onChange={(e) => setParams({ ...params, maxHeight: e.target.value })} className={sel}>
                {HEIGHTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {EDITABLE.includes(params.target) && (
              <details className="sm:col-span-3 rounded-lg border border-neutral-200 p-3" data-advanced>
                <summary className="cursor-pointer text-sm font-semibold text-neutral-700">More options: speed, mirror, volume, fades, exact quality</summary>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm">
                  <label className="block text-neutral-500">Speed
                    <select id="vc-speed" disabled={disabled} value={params.speed} onChange={(e) => setParams({ ...params, speed: e.target.value })} className={sel}>{SPEEDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                  <label className="block text-neutral-500">Mirror
                    <select id="vc-flip" disabled={disabled} value={params.flip} onChange={(e) => setParams({ ...params, flip: e.target.value })} className={sel}>
                      <option value="">None</option><option value="h">Left-right ⇆</option><option value="v">Top-bottom ⇅</option><option value="hv">Both</option></select></label>
                  <label className="block text-neutral-500">Volume: {params.volume} %
                    <input id="vc-volume" type="range" min="0" max="300" step="10" disabled={disabled} value={params.volume} onChange={(e) => setParams({ ...params, volume: e.target.value })} className="w-full mt-2" /></label>
                  <label className="block text-neutral-500">Fade in (s)
                    <input id="vc-fadein" type="number" min="0" max="10" step="0.5" disabled={disabled} value={params.fadeIn} onChange={(e) => setParams({ ...params, fadeIn: e.target.value })} className={sel} /></label>
                  <label className="block text-neutral-500">Fade out (s)
                    <input id="vc-fadeout" type="number" min="0" max="10" step="0.5" disabled={disabled} value={params.fadeOut} onChange={(e) => setParams({ ...params, fadeOut: e.target.value })} className={sel} /></label>
                  <label className="flex items-center gap-2 text-neutral-600 mt-6"><input id="vc-fadevideo" type="checkbox" disabled={disabled} checked={params.fadeVideo} onChange={(e) => setParams({ ...params, fadeVideo: e.target.checked })} /> Fade the picture too (from / to black)</label>
                  <label className="block text-neutral-500 sm:col-span-3">Exact quality (CRF, lower = better and bigger), instead of the quality level above
                    <input id="vc-crf" type="number" min="0" max={CRF_MAX[params.target] || 51} step="1" placeholder={`Automatic — or 0 to ${CRF_MAX[params.target] || 51} (${params.target === 'av1' ? 'AV1: 30 is very good' : params.target === 'h265' ? 'H.265: 24-28 is usual' : 'H.264: 18-23 is usual'})`} disabled={disabled} value={params.crf} onChange={(e) => setParams({ ...params, crf: e.target.value })} className={sel} /></label>
                </div>
                <p className="text-xs text-neutral-500 mt-2">The sound keeps its pitch at every speed. With an exact CRF, the video is encoded once at that value, even if the file comes out larger than the original.</p>
              </details>
            )}
          </div>
        );
      }}
      seo={seo}
    />
  );
}
