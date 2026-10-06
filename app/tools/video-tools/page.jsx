'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Video to Audio', description: 'Extract the sound track to 18 audio formats', href: '/tools/video-tools/video-to-audio', group: 'Convert' },
  { title: 'Video Compressor', description: 'Re-encode to a smaller MP4 (H.264, H.265, AV1)', href: '/tools/video-tools/video-compressor', group: 'Edit & Transform' },
  { title: 'Video Converter', description: '22 video formats, a GIF, or the audio only', href: '/tools/video-tools/video-converter', group: 'Convert' },
  { title: 'Video Trimmer', description: 'Cut a clip without re-encoding, or to the frame', href: '/tools/video-tools/video-trimmer', group: 'Edit & Transform' },
  { title: 'Video to GIF', description: 'Up to 60 s as a GIF, or frames as PNG', href: '/tools/video-tools/video-to-gif', group: 'Convert' },
  { title: 'Video Screenshot', description: 'Save the current frame as PNG, JPG or WebP', href: '/tools/video-tools/video-screenshot', group: 'Capture & Record' },
  { title: 'Media Player', description: 'Play a file with speed, loop and subtitles', href: '/tools/video-tools/media-player', group: 'Capture & Record' },
  { title: 'Video Metadata', description: 'Codecs, bitrate, frame rate and tracks of a video', href: '/tools/video-tools/video-metadata', group: 'Info & Extras' },
  { title: 'Video Watermark', description: 'Text or image watermark on clips up to 2 min', href: '/tools/video-tools/video-watermark', group: 'Edit & Transform' },
  { title: 'Subtitle Generator', description: 'Type timed lines, save SRT and WebVTT files', href: '/tools/video-tools/subtitle-generator', group: 'Info & Extras' },
  { title: 'Screen Recorder', description: 'Record a screen, window or tab with its sound', href: '/tools/video-tools/screen-recorder', group: 'Capture & Record' },
  { title: 'Video Merger', description: 'Join clips in order into one MP4', href: '/tools/video-tools/video-merger', group: 'Edit & Transform' },
  { title: 'Video Rotator', description: 'Rotate 90°, 180° or 270°, or mirror', href: '/tools/video-tools/video-rotator', group: 'Edit & Transform' },
  { title: 'Video Resizer', description: 'Fit, fill or stretch to a new size, or crop', href: '/tools/video-tools/video-resizer', group: 'Edit & Transform' },
  { title: 'Video Filter', description: 'Grayscale, sepia, blur and 4 more filters', href: '/tools/video-tools/video-filter', group: 'Edit & Transform' },
];

export default function MediaToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="video-tools" className={`w-8 h-8 ${categoryColors['video-tools']}`} /> Video Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Convert, cut, compress and record video - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Compressor, Converter, Filter and Resizer send the video to our own media service, where ffmpeg re-encodes it. Video Rotator, Video to GIF, Video Merger, Video Trimmer and Screen Recorder use that service only in some modes. Video to Audio, Video Watermark, Video Screenshot, Video Metadata, Media Player and Subtitle Generator work in your browser instead. On the service, the uploaded video is deleted when processing ends and the result once the page has downloaded it, or when the job expires.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Choose by task: change format or size (Converter, Compressor, Resizer), edit (Trimmer, Merger, Rotator, Filter, Watermark), extract (Video to Audio, Video to GIF, Screenshot) or inspect (Metadata, Media Player).</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Pick the video; the tools that use our media service accept up to 1 GB per file, and each page shows its own limit.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Set the options, such as codec, target format, cut points or rotation, and start the job.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the result, most often an MP4; Video Converter can also produce a GIF or an audio file.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which video tools upload my file?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Compressor, Converter, Filter and Resizer always do. Video Rotator does in its "Compatible everywhere" mode, Video to GIF for the GIF, Video Merger when the clips differ, Video Trimmer for a long precise cut, and Screen Recorder when you ask for an MP4. All of them use our own media service, never a third party.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How large can a video be?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">1 GB per file for the tools that use our media service. Video Trimmer takes up to 300 MB on a computer and 100 MB on phones, iPhone and iPad; Video Merger 2 GB in total on a computer and 700 MB on phones, iPhone and iPad; Video Watermark takes videos of up to 2 minutes.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit on how many videos I can process?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, on the media service: it counts jobs per connection per hour and per day, and merging clips that differ counts one job per clip. Tools that work without the service, such as Video to Audio, are not counted.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I rotate a video without re-encoding it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, for MP4, MOV, M4V, 3GP and 3G2 files: the "Instant, lossless" mode of Video Rotator rewrites only the rotation flag, unless you ask for a mirror, which that mode refuses. Mirroring and other formats need re-encoding on our media service.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Video Trimmer's default cut copies from the keyframe at or before your start time; choose a precise cut for a frame-exact start.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Clips with the same H.264 or HEVC encoding settings are joined by Video Merger without re-encoding or upload.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Write subtitle lines in Subtitle Generator, then load the SRT or VTT file in Media Player to check the timing.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Screen Recorder is not available on iPhone and iPad, whose browsers cannot capture the screen.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}