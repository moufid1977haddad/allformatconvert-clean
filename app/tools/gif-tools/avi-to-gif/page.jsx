'use client';
import GifFromVideoTool, { GIF_MAX_SECONDS } from '../../../components/GifFromVideoTool';
import { MAX_UPLOAD_MB } from '../../../components/MediaServiceTool';

export default function AviToGifPage() {
  return (
    <GifFromVideoTool
      tool="avi-to-gif"
      title="AVI to GIF"
      subtitle="Turn part of an AVI file, which browsers cannot preview, into an animated GIF"
      seo={{
        title: 'AVI to GIF',
        description: `AVI to GIF turns part of an AVI video into an animated GIF. ffmpeg on our server reads the AVI, a format web browsers cannot play. You set the start time and the length (up to ${GIF_MAX_SECONDS} seconds), the width and the frame rate; the height keeps the proportions of the video. Because the preview cannot play an AVI, the page cannot read its duration in advance, and the server checks the start time instead. MP4, MOV, WebM, MKV and other video files are accepted too.`,
        howToTitle: 'How to convert AVI to GIF',
        howTo: [
          'Choose your .avi file; the preview box may stay black, because browsers do not play AVI.',
          'Type the moment you want in "Start (seconds)", found beforehand in a desktop video player, and its duration in "Length (seconds)".',
          'Pick "Width" and "Frames per second", and if you like "Plays" and "Compression".',
          'Click "Make GIF", then "Download" to save the GIF under the name of your video.',
        ],
        specs: [
          { label: 'Input', value: 'AVI, plus MP4, MOV, WebM, MKV, WMV, FLV and the other types in the file picker' },
          { label: 'Output', value: 'Animated GIF, file named after the AVI' },
          { label: 'Preview', value: 'Browsers cannot play AVI here, so type the start time yourself' },
          { label: 'GIF duration', value: `Up to ${GIF_MAX_SECONDS} seconds per GIF` },
          { label: 'Largest file', value: `${MAX_UPLOAD_MB / 1024} GB per AVI` },
          { label: 'Usage limits', value: 'Each connection has an hourly and a daily number of conversions' },
        ],
        privacy: 'This tool needs our server: the AVI is uploaded in pieces to our video service (ffmpeg on Railway), using a single-use ticket from this site. The service removes the AVI once the GIF is made or the job fails, and removes the GIF after this page has taken it; leftovers of abandoned jobs are swept by a timer. Only changes to "Plays" and "Compression" are done on this page, with gifsicle, on the GIF from our server.',
        faqs: [
          { q: 'Will my AVI play in the preview?', a: 'No, usually not: web browsers do not play AVI files, so the preview stays blank or shows an error. The conversion is not affected, because ffmpeg on our server reads the file. Type the start time as a number of seconds; a start beyond the end of the video is refused by the server with a message.' },
          { q: 'Can I convert only part of an AVI?', a: `Yes. Set "Start (seconds)" and "Length (seconds)"; a GIF lasts from 0.2 to ${GIF_MAX_SECONDS} seconds. Since the page cannot read the duration of an AVI, a clip that runs past the end simply stops where the video ends.` },
          { q: 'Is there a size limit for AVI files?', a: `Yes: ${MAX_UPLOAD_MB / 1024} GB per file, on a computer or a phone, and the service also refuses source videos above a maximum duration, which its message states. The GIF covers only the clip you pick, so its size depends on the length, the width and the frame rate.` },
          { q: 'Is the AVI deleted after conversion?', a: 'Yes. Our video service deletes the AVI when processing ends, successful or not, and deletes the GIF once this page has downloaded it. Nothing about the name or the content of the file is written to the service logs.' },
        ],
        tips: [
          'To pick the start visually, convert the AVI to MP4 first with Video Converter: an MP4 plays in the preview here.',
        ],
      }}
    />
  );
}
