'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Video to GIF', description: 'Turn up to 60 s of a video into a GIF', href: '/tools/gif-tools/video-to-gif' },
  { title: 'MP4 to GIF', description: 'Turn up to 60 s of an MP4 into a GIF', href: '/tools/gif-tools/mp4-to-gif' },
  { title: 'WEBM to GIF', description: 'Turn up to 60 s of a WebM into a GIF', href: '/tools/gif-tools/webm-to-gif' },
  { title: 'APNG to GIF', description: 'Re-encode an animated PNG as a GIF', href: '/tools/gif-tools/apng-to-gif' },
  { title: 'GIF to MP4', description: 'Turn a GIF into a silent H.264 MP4', href: '/tools/gif-tools/gif-to-mp4' },
  { title: 'GIF to APNG', description: 'Lossless animated PNG from a GIF', href: '/tools/gif-tools/gif-to-apng' },
  { title: 'Image to GIF', description: 'Animate images with one delay for every frame', href: '/tools/gif-tools/image-to-gif' },
  { title: 'MOV to GIF', description: 'Turn up to 60 s of an iPhone MOV into a GIF', href: '/tools/gif-tools/mov-to-gif' },
  { title: 'AVI to GIF', description: 'Turn up to 60 s of an AVI into a GIF', href: '/tools/gif-tools/avi-to-gif' },
  { title: 'GIF Maker', description: 'Build a GIF with per-frame order, delay and crop', href: '/tools/gif-tools/gif-maker' },
  { title: 'GIF Compressor', description: 'Shrink a GIF with gifsicle: lossy, colors, size', href: '/tools/gif-tools/gif-compressor' },
];

export default function GifToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800 flex items-center justify-center gap-2"><CategoryIcon slug="gif-tools" className={`w-8 h-8 ${categoryColors['gif-tools']}`} /> GIF Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Make, convert and compress GIF animations - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About GIF Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Five of these tools make a GIF from a video clip of up to 60 seconds. The video is uploaded to our own media service, converted by ffmpeg and deleted when processing ends; the GIF is deleted once the page has fetched it, or after a time limit. The other six work in your browser instead: GIF Maker and Image to GIF animate still pictures, GIF Compressor runs gifsicle, and the APNG and MP4 converters re-encode an existing animation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use GIF Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Start from what you have: a video for the five video-to-GIF tools, still images for GIF Maker or Image to GIF, or an existing GIF or APNG.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>For a video, set the start time, a length of up to 60 seconds and the width; the clip is then uploaded and converted on our server.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>For images, put the frames in order and set the delay; GIF Maker also gives each frame its own duration and crop.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the result: a .gif, or an .mp4 or animated .png from the two GIF converters.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long can a GIF made from a video be?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">60 seconds at most, and at least 0.2 seconds, counted from the start time you choose. The video file itself can be up to 1 GB, and the media service also caps the length of the source video.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are my videos uploaded?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, by the five video-to-GIF tools: the file goes to our own media service, never a third party, and is deleted when the conversion ends. Images and GIFs used by the other six tools are processed in your browser instead.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit on conversions?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, for video to GIF: the media service counts conversions per connection per hour and per day, and the page says when you can try again. GIF Maker, Image to GIF, GIF Compressor and the GIF converters have no such count.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why is my GIF larger than the video?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Because a GIF stores every frame as a picture of at most 256 colors, without the compression between frames that video uses. Pick a shorter clip or a smaller width, or run the GIF through GIF Compressor.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep only the seconds you need: every extra second adds frames and size to the GIF.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>GIF Compressor can combine lossy compression, fewer colors and a smaller size in one pass.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Where a site accepts video, GIF to MP4 gives a silent H.264 MP4 of the whole animation.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Image to GIF gives every frame the shape of the first image; use GIF Maker when your pictures need cropping.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}