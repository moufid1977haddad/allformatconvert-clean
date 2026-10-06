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
  description: `Video Filter applies one visual effect to a whole video: Grayscale, Sepia, Invert, Blur, Brightness, Contrast or Saturate. Each effect has a fixed strength, and the player shows it live with the same color formulas as the final file. The video is processed by ffmpeg on our video service and comes back as an MP4 with H.264 picture and AAC sound, named after your file and the effect. One run applies one effect to the full length: it cannot mix effects, change their strength or affect only part of the video.`,
  howToTitle: 'How to apply a filter to a video',
  howTo: [
    `Choose or drop a video; the player then shows the selected effect on it.`,
    `Click one effect button, such as "Grayscale" or "Sepia": the player shows it at once.`,
    `Click "Apply Filter" and follow the upload and processing percentage.`,
    `Play the filtered MP4 and click "Download"; its name ends with the effect, such as -sepia.`,
  ],
  specs: [
    { label: 'Input formats', value: `MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, MPG, TS and the other video types the file picker lists` },
    { label: 'Output', value: `MP4 (H.264 video with the effect in every frame, AAC sound at 160 kbps)` },
    { label: 'Effect strength', value: `Fixed: Blur is a Gaussian blur of sigma 3, Brightness 150 %, Contrast 200 %, Saturate 300 %; Grayscale, Sepia and Invert are full` },
    { label: 'Maximum file size', value: `1 GB, whatever the device` },
    { label: 'Usage limits', value: `A set number of jobs per hour and per day for each internet connection on our video service, plus a maximum video duration; no account` },
  ],
  privacy: `To be filtered, the video is uploaded from your browser to our video service on Railway, in pieces and without passing through the website's server. ffmpeg applies the effect there; the source file is removed when processing ends and the filtered MP4 when this page has received it, or after a set time if it never does. The service's logs note the operation, a size range, the job status and timings, but not the file. An error shown on the page reaches us as cleaned text with its error type, the tool name, the browser and its version, the file type and a size range.`,
  faqs: [
    { q: 'Can I use two filters at once?', a: `No, one effect per run. To combine two, apply the first, download the MP4, then choose that file again and apply the second. Each run encodes the video once more, so a little detail is lost each time.` },
    { q: 'Does the preview match the final video?', a: `Yes for colors: Grayscale, Sepia, Invert, Brightness, Contrast and Saturate use the same formulas in the preview and on our video service. No for Blur: the preview blurs the small player, while the service blurs the full-size picture, so a large video looks less blurred in the file than on screen.` },
    { q: 'Is the sound changed?', a: `No effect is applied to it, but it is encoded again: the first audio track comes back as AAC at 160 kbps. Other audio tracks and subtitles are not kept in the filtered MP4.` },
    { q: 'Can the filtered file be larger than the original?', a: `Yes, it can happen. When the MP4 comes out larger than your video, it is encoded again with stronger compression, up to 3 tries in all; if the last try is still larger, you get it, and the page shows by how much under "Larger by".` },
  ],
  tips: [
    `When you only need part of the video, cut it with Video Trimmer first: there is less to upload and less to process.`,
  ],
};

export default function VideoFilterPage() {
  return (
    <MediaServiceTool
      op="convert"
      tool="video-filter"
      title="Video Filter"
      subtitle="Give a whole video one of seven effects, previewed live before you apply it"
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
