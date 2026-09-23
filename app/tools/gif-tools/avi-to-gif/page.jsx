'use client';
import GifFromVideoTool from '../../../components/GifFromVideoTool';

export default function AviToGifPage() {
  return (
    <GifFromVideoTool
      tool="avi-to-gif"
      title="AVI to GIF"
      subtitle="Convert a AVI clip into an animated GIF — choose the start, length, width and frame rate"
      seo={{
        title: 'AVI to GIF',
        description: 'AVI to GIF converts a clip of your AVI video into an animated GIF. Pick where the clip starts, how long it lasts (up to 60 seconds), the width and the frame rate. AVI files are converted on our server with ffmpeg, so they work even though browsers cannot play AVI themselves. It runs on our server with ffmpeg, which builds an optimised 256-colour palette for your clip, so it works in every browser including Safari and iPhone. Your file is deleted from our server as soon as you have downloaded the GIF.',
        howTo: [
          'Select a AVI file (up to 1 GB). Other video formats work too.',
          'Set the start time and the length of the clip (up to 60 seconds).',
          'Choose the width and frames per second — smaller values make a lighter GIF.',
          'Click "Make GIF", preview it, then download.',
        ],
        faqs: [
          { q: 'Is AVI to GIF free?', a: 'Yes, free with no signup and no watermark.' },
          { q: 'Can I convert only part of my video?', a: 'Yes: set the start time and the length (up to 60 seconds).' },
          { q: 'Why is my GIF large?', a: 'GIF has no real video compression. Lower the width (e.g. 320 px), the frame rate (e.g. 8–10) or the length to make it much lighter.' },
          { q: 'Will a vertical video be squashed?', a: 'No. Only the width is set; the height follows the video, so it keeps its proportions.' },
          { q: 'Is my video uploaded?', a: 'Yes, to our own server (not a third party), and deleted as soon as you have downloaded the result.' },
        ],
        tips: [
          '480 px and 10 fps is a good balance for sharing in chats and on social media.',
          'Play the video above to find the exact second where your clip should start.',
        ],
      }}
    />
  );
}
