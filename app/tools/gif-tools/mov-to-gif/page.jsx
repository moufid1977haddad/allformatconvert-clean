'use client';
import GifFromVideoTool, { GIF_MAX_SECONDS } from '../../../components/GifFromVideoTool';
import { MAX_UPLOAD_MB } from '../../../components/MediaServiceTool';

export default function MovToGifPage() {
  return (
    <GifFromVideoTool
      tool="mov-to-gif"
      title="MOV to GIF"
      subtitle="iPhone and QuickTime MOV clips to animated GIF, in their own proportions"
      seo={{
        title: 'MOV to GIF',
        description: `MOV to GIF is made for the videos an iPhone records and the QuickTime files a Mac saves. Pick a moment of up to ${GIF_MAX_SECONDS} seconds, set the width and the frame rate, and ffmpeg on our server turns it into an animated GIF. You only choose the width: the height is calculated from the proportions of your video, so a portrait clip filmed on a phone does not come out squashed. MP4, WebM, AVI, MKV and other video files are accepted by the same picker. A GIF carries no sound, and the tool neither crops nor captions the picture.`,
        howToTitle: 'How to convert a MOV or iPhone video to GIF',
        howTo: [
          'On an iPhone, save the video from Photos to Files first (Photos, Share, Save to Files) and choose it from there; on a computer, choose the .mov file directly.',
          'Set "Start (seconds)" and "Length (seconds)" around the moment you want.',
          'Choose the "Width" and the "Frames per second", and use "Plays" to decide how many times the GIF runs.',
          'Tap or click "Make GIF" and wait while the video is uploaded and converted.',
          'Save the GIF with "Download"; on iPhone and iPad a share button also appears next to it.',
        ],
        specs: [
          { label: 'Input', value: 'MOV and QT (iPhone, QuickTime), and also MP4, WebM, AVI, MKV and other video types' },
          { label: 'Output', value: 'Animated GIF with no sound track' },
          { label: 'Longest GIF', value: `${GIF_MAX_SECONDS} seconds, starting at any point of the video` },
          { label: 'File size', value: `Up to ${MAX_UPLOAD_MB / 1024} GB, the same on an iPhone as on a computer` },
          { label: 'On iPhone and iPad', value: 'A video picked from the Photos library arrives already reduced by iOS; the original comes from Files' },
          { label: 'Usage limits', value: 'Conversions per connection are capped per hour and per day' },
        ],
        privacy: 'Your MOV goes to our own video service on Railway, uploaded directly in pieces with a one-job ticket from this site, and ffmpeg makes the GIF there. The video is erased when processing ends; the GIF is erased once this page has received it, and an abandoned job is cleared by a timer. Changing "Plays" or "Compression" runs gifsicle on this page, on the GIF our server returned.',
        faqs: [
          { q: 'Can I convert an iPhone video to GIF on my iPhone?', a: `Yes. The conversion runs on our server, so the phone uploads the file and receives the GIF; only "Plays" and "Compression", if you change them, are applied on the phone. For full quality, save the video to Files first: a video chosen from the Photos library reaches the page already shrunk by iOS. The ${MAX_UPLOAD_MB / 1024} GB file limit is the same on iPhone.` },
          { q: 'Will a vertical iPhone video be squashed?', a: 'No. You choose only the width; the height is calculated from the proportions of your video and rounded to an even number of pixels. A video narrower than the width you pick is never enlarged, so a small clip stays small and sharp.' },
          { q: 'Can I choose how many times the GIF plays?', a: 'Yes. "Plays" offers "Forever (loop)", "Once", "3 times" and "5 times". Anything other than looping forever is written into the GIF on this page by gifsicle, after our server has made it, together with "Compression" if you set it.' },
          { q: 'Is my video kept after the GIF is made?', a: 'No. Our service deletes the MOV as soon as processing ends, whether the GIF was made or not, and deletes the GIF once this page has fetched it. File names and contents are never written to the service logs.' },
        ],
        tips: [
          'If the GIF is too heavy for a message, try "Compression" set to "Light (smaller file)" before lowering the width.',
        ],
      }}
    />
  );
}
