'use client';
import GifFromVideoTool from '../../../components/GifFromVideoTool';

export default function VideoToGifPage() {
  return (
    <GifFromVideoTool
      tool="video-to-gif"
      title="Video to GIF"
      subtitle="Turn a clip of any video into an animated GIF — choose the start, length, width and frame rate"
      seo={{
        title: 'Video to GIF',
        description: 'Video to GIF turns a clip of any video (MP4, MOV from an iPhone, WebM, MKV, AVI and more) into an animated GIF. Pick where the clip starts, how long it lasts (up to 60 seconds), the width and the frame rate. It runs on our server with ffmpeg, building an optimised 256-colour palette for your clip, so it works in every browser including Safari and iPhone. Vertical and square videos keep their shape. Your file is deleted from our server as soon as you have downloaded the GIF.',
        howTo: [
          'Select a video file (up to 1 GB).',
          'Set the start time and the length of the clip (up to 60 seconds).',
          'Choose the width and frames per second — smaller values make a lighter GIF.',
          'Click "Make GIF", preview it, then download.',
        ],
        faqs: [
          { q: 'Is Video to GIF free?', a: 'Yes, free with no signup and no watermark.' },
          { q: 'Which video formats can I use?', a: 'MP4, MOV (including iPhone videos), WebM, MKV, AVI, WMV, FLV and most others ffmpeg can read.' },
          { q: 'How long can the GIF be?', a: 'Up to 60 seconds, starting wherever you want in the video.' },
          { q: 'Why is my GIF large?', a: 'GIF is an old format with no real video compression. Lower the width (e.g. 320 px), the frame rate (e.g. 8–10) or the length to make it much lighter.' },
          { q: 'Will a vertical phone video be squashed?', a: 'No. Only the width is set; the height follows the video, so vertical, square and widescreen videos keep their proportions.' },
          { q: 'Is my video uploaded?', a: 'Yes, to our own server (not a third party), and deleted as soon as you have downloaded the result.' },
        ],
        tips: [
          '480 px and 10 fps is a good balance for sharing in chats and on social media.',
          'For a reaction GIF, keep it short: 2 to 4 seconds.',
          'Play the video above to find the exact second where your clip should start.',
        ],
      }}
    />
  );
}
