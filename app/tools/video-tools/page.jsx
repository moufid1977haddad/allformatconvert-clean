'use client';
import Link from 'next/link';

const tools = [
  { icon: '🎵', title: 'Video to Audio', description: 'Extract audio from video files', href: '/tools/video-tools/video-to-audio' },
  { icon: '🎬', title: 'Video Compressor', description: 'Compress video files easily', href: '/tools/video-tools/video-compressor' },
  { icon: '🎬', title: 'Video Converter', description: 'Convert video to different formats', href: '/tools/video-tools/video-converter' },
  { icon: '🎬', title: 'Video Trimmer', description: 'Trim and cut video files', href: '/tools/video-tools/video-trimmer' },
  { icon: '🎬', title: 'Video to GIF', description: 'Convert video clips to GIF', href: '/tools/video-tools/video-to-gif' },
  { icon: '📸', title: 'Video Screenshot', description: 'Capture screenshots from video', href: '/tools/video-tools/video-screenshot' },
  { icon: '▶️', title: 'Media Player', description: 'Play audio and video files', href: '/tools/video-tools/media-player' },
  { icon: '🎬', title: 'Video Metadata', description: 'View and edit video metadata', href: '/tools/video-tools/video-metadata' },
  { icon: '🎭', title: 'Video Watermark', description: 'Add watermark to video', href: '/tools/video-tools/video-watermark' },
  { icon: '📝', title: 'Subtitle Generator', description: 'Generate subtitles for video', href: '/tools/video-tools/subtitle-generator' },
  { icon: '📱', title: 'Screen Recorder', description: 'Record your screen', href: '/tools/video-tools/screen-recorder' },
  { icon: '🎬', title: 'Video Merger', description: 'Merge multiple videos', href: '/tools/video-tools/video-merger' },
  { icon: '🎬', title: 'Video Rotator', description: 'Rotate video files', href: '/tools/video-tools/video-rotator' },
  { icon: '🎬', title: 'Video Resizer', description: 'Resize video dimensions', href: '/tools/video-tools/video-resizer' },
  { icon: '🎨', title: 'Video Filter', description: 'Apply filters to video', href: '/tools/video-tools/video-filter' },
];

export default function MediaToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🎬 Video Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your Video Tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Video Tools tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}