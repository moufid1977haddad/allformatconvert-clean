'use client';
import GifFromVideoTool, { GIF_MAX_SECONDS } from '../../../components/GifFromVideoTool';
import { MAX_UPLOAD_MB } from '../../../components/MediaServiceTool';

export default function Mp4ToGifPage() {
  return (
    <GifFromVideoTool
      tool="mp4-to-gif"
      title="MP4 to GIF"
      subtitle="Pick a moment of an MP4 and make it a GIF: start, length, width, frame rate and loops"
      seo={{
        title: 'MP4 to GIF',
        description: `MP4 to GIF cuts a clip of up to ${GIF_MAX_SECONDS} seconds out of an MP4 video and turns it into an animated GIF. You decide where the clip starts, how long it lasts, how wide the GIF is and how many frames per second it keeps; the height follows the video, so portrait and square clips keep their shape. The GIF is made by ffmpeg on our server, which builds a color palette from your clip. The same picker also takes MOV, WebM, MKV, AVI and other video files. The GIF has no sound, and the tool does not crop the picture or add captions.`,
        howToTitle: 'How to convert MP4 to GIF',
        howTo: [
          'Choose your MP4 file, then play the preview that appears and note the second where your clip should start.',
          'Type that second in "Start (seconds)" and the duration of the clip in "Length (seconds)".',
          'Pick a "Width" and the "Frames per second"; change "Plays" or "Compression" only if you need to.',
          'Click "Make GIF": the MP4 is uploaded and converted, and the sizes before and after appear with the preview.',
          'Click "Download" to save the GIF, named after your MP4.',
        ],
        specs: [
          { label: 'Input', value: 'MP4 and M4V, plus MOV, WebM, MKV, AVI and the other video types the file picker lists' },
          { label: 'Output', value: 'An animated GIF without sound, named after your video' },
          { label: 'Clip length', value: `From 0.2 to ${GIF_MAX_SECONDS} seconds, starting anywhere in the MP4` },
          { label: 'Width', value: 'Between 160 and 1080 px; a narrower video is never enlarged' },
          { label: 'Maximum file size', value: `${MAX_UPLOAD_MB / 1024} GB, on a computer and on a phone` },
          { label: 'Usage limits', value: 'Each connection may start a limited number of these server conversions per hour and per day' },
        ],
        privacy: 'Your MP4 is sent in pieces straight to our video service (ffmpeg, hosted on Railway), using a ticket the site issues for this one job. The service deletes the MP4 as soon as processing ends and deletes the GIF once this page has fetched it; a job left unfinished is removed later by a timer. If you change "Plays" or "Compression", gifsicle applies it on this page to the GIF our server sent back.',
        faqs: [
          { q: 'Can I turn only part of an MP4 into a GIF?', a: `Yes. "Start (seconds)" sets where the clip begins and "Length (seconds)" how long it lasts, from 0.2 to ${GIF_MAX_SECONDS} seconds. When your browser can play the MP4, the page reads its duration and refuses a start after the end before uploading; otherwise our server refuses it with a message.` },
          { q: 'Is the GIF shortened if the clip runs past the end of the MP4?', a: 'Yes. If your browser has read the duration of the MP4, the length is cut to what remains and a note above the result gives the real duration. If it could not read it, the GIF simply stops where the video ends, without a note.' },
          { q: 'What makes a GIF heavy?', a: 'A GIF has a limited color palette and a much simpler compression than MP4, which predicts the motion between frames, so a GIF grows fast with width, frame rate and length. To make it lighter, lower "Width" or "Frames per second", shorten the clip, or set "Compression" to "Light (smaller file)".' },
          { q: 'Is my MP4 kept on your server?', a: 'No. Our video service deletes the MP4 when processing ends, whether it worked or not, and deletes the GIF once this page has received it. A job abandoned halfway is cleared by a timer, and file names and contents are never written to the service logs.' },
        ],
        tips: [
          'The page starts with a 5-second clip at 480 px and 10 frames per second; adjust "Length (seconds)" first, then the width.',
        ],
      }}
    />
  );
}
