'use client';
import GifFromVideoTool, { GIF_MAX_SECONDS } from '../../../components/GifFromVideoTool';
import { MAX_UPLOAD_MB } from '../../../components/MediaServiceTool';

export default function VideoToGifPage() {
  return (
    <GifFromVideoTool
      tool="video-to-gif"
      title="Video to GIF"
      subtitle="One of 17 video file types in, one animated GIF out, shaped by six settings"
      seo={{
        title: 'Video to GIF',
        description: `Video to GIF accepts the 17 video extensions its file picker lists (MP4, MOV, WebM, MKV, AVI, WMV, FLV, MPG, 3GP, TS and more), plus files your system marks as video, and turns part of one video into an animated GIF on our server with ffmpeg. Six settings shape the result: start, length (up to ${GIF_MAX_SECONDS} seconds), width, frame rate, number of plays and extra compression. This page makes the GIF only; the Video to GIF page in Video Tools also captures still frames as PNG images.`,
        howToTitle: 'How to make a GIF from a video',
        howTo: [
          'Choose a video file from a phone, a camera or a screen recording.',
          'Set "Start (seconds)" and "Length (seconds)" to select the clip.',
          'Choose the "Width" (the height follows) and the "Frames per second" (fewer frames, lighter file).',
          'If needed, set "Plays" to "Once", "3 times" or "5 times", and "Compression" to "Light (smaller file)" or "Strong (smallest, some noise)".',
          'Click "Make GIF", compare "Before" and "After", then click "Download".',
        ],
        specs: [
          { label: 'Input formats', value: 'MP4, M4V, MOV, QT, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS' },
          { label: 'Output', value: 'One animated GIF; still PNG frames are on the Video Tools page' },
          { label: 'Widths', value: 'Thirteen choices from 160 to 1080 px' },
          { label: 'Frame rates', value: '5, 8, 10, 12, 15, 20, 25 or 30 frames per second' },
          { label: 'Plays', value: 'Forever, once, 3 or 5 times' },
          { label: 'File size and usage', value: `Up to ${MAX_UPLOAD_MB / 1024} GB per video; conversions per connection are limited per hour and per day` },
        ],
        privacy: 'Making the GIF requires our server. The video is uploaded in pieces directly to our video service (ffmpeg, on Railway) under a one-job ticket from this site; the service deletes the video as soon as processing ends and the GIF once this page has fetched it, and a timer clears abandoned jobs. When "Plays" or "Compression" is changed, gifsicle finishes the GIF from our server on this page.',
        faqs: [
          { q: 'Which video formats can I turn into a GIF?', a: '17 file extensions are listed in the picker: MP4, M4V, MOV, QT, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS and M2TS, plus files your system labels as video. The file must contain a video track: an audio-only file is refused.' },
          { q: 'Does the GIF keep the quality of the video?', a: 'No, not fully: a GIF holds a limited color palette per frame and no sound. ffmpeg builds the palette from your own clip and applies dithering, which keeps colors closer. A larger width and more frames per second look smoother but make a heavier file.' },
          { q: 'Can I stop the GIF from looping?', a: 'Yes. Set "Plays" to "Once", or to "3 times" or "5 times". The GIF made by our server loops forever; the play count is then written into it on this page by gifsicle, which also applies "Compression" if you chose it.' },
          { q: 'How can I reduce the size of the GIF?', a: 'Three settings do it: a smaller "Width", fewer "Frames per second" and a shorter "Length (seconds)". "Compression" then adds lossy gifsicle compression. The result shows the size before and after, so you can compare and try again with the same video.' },
          { q: 'Is there a version that also extracts still frames?', a: 'Yes. Video to GIF in Video Tools runs the same GIF conversion and adds a section that captures still frames as PNG images; that frame extraction runs in your browser. This page keeps only the GIF settings.' },
        ],
      }}
    />
  );
}
