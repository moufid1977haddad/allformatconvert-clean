'use client';
import GifFromVideoTool, { GIF_MAX_SECONDS } from '../../../components/GifFromVideoTool';
import { MAX_UPLOAD_MB } from '../../../components/MediaServiceTool';

export default function WebmToGifPage() {
  return (
    <GifFromVideoTool
      tool="webm-to-gif"
      title="WebM to GIF"
      subtitle="VP8, VP9 or AV1 WebM clips and screen recordings to animated GIF"
      seo={{
        title: 'WebM to GIF',
        description: `WebM to GIF converts part of a WebM video into an animated GIF. A WebM file can carry VP8, VP9 or AV1 video, and ffmpeg on our server decodes each of them; any Opus or Vorbis sound track is dropped, since GIF has none. Set the start, the length (up to ${GIF_MAX_SECONDS} seconds), the width and the frame rate. Some WebM files recorded in a browser do not store their duration: the page then cannot check your start time in advance, and the server checks it instead. MP4, MOV, AVI and MKV files are accepted too.`,
        howToTitle: 'How to convert WebM to GIF',
        howTo: [
          'Choose the .webm file and play the preview to find the moment you want.',
          'Fill in "Start (seconds)" and "Length (seconds)".',
          'Set "Width" and "Frames per second", plus "Plays" if the GIF should not loop forever.',
          'Click "Make GIF" and follow the progress bar: uploading, converting, then downloading the result.',
          'Save the finished GIF with "Download".',
        ],
        specs: [
          { label: 'Input', value: 'WebM with VP8, VP9 or AV1 video; MP4, MOV, AVI, MKV and more also accepted' },
          { label: 'Output', value: 'GIF without sound, named after the WebM file' },
          { label: 'Start time check', value: 'On the page when the browser can read the WebM duration, otherwise by the server' },
          { label: 'GIF length', value: `0.2 s at least, ${GIF_MAX_SECONDS} s at most` },
          { label: 'File limit', value: `${MAX_UPLOAD_MB / 1024} GB per WebM` },
          { label: 'Usage limits', value: 'Hourly and daily caps per connection apply to this server tool' },
        ],
        privacy: 'The WebM is uploaded to our video service on Railway in small pieces, with a ticket the site issues for this one job, and ffmpeg converts it there. The service deletes the WebM at the end of processing and the GIF after this page has fetched it; jobs left unfinished are swept away later by a timer. If you change "Plays" or "Compression", gifsicle applies it on this page to the GIF returned by our server.',
        faqs: [
          { q: 'Can it convert AV1 or VP9 WebM files?', a: 'Yes. ffmpeg on our server reads WebM files with VP8, VP9 or AV1 video, so the preview does not even need to play in your browser for the conversion to work. Only the picture is used: any Opus or Vorbis audio is left out.' },
          { q: 'Does the page check that my start time is inside the video?', a: 'Yes, when your browser can read the duration of the WebM: a start after the end is refused before anything is uploaded. Some WebM files recorded in a browser store no duration; then the server checks the start instead and refuses one outside the video.' },
          { q: 'Can I make the GIF lighter after a first try?', a: 'Yes. Set "Compression" to "Light (smaller file)" or "Strong (smallest, some noise)", lower the "Width", or pick fewer "Frames per second", then click "Make GIF" again: the WebM stays selected, so you do not have to choose it again.' },
          { q: 'Do you keep my WebM?', a: 'No. The service erases the WebM once processing ends, even after an error, and erases the GIF when this page has downloaded it. Abandoned jobs are cleared by a timer, and no file name or content goes into the service logs.' },
        ],
      }}
    />
  );
}
