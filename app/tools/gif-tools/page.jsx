'use client';
import Link from 'next/link';

const tools = [
  { icon: '🎬', title: 'Video to GIF', description: 'Convert video files to GIF frames', href: '/tools/gif-tools/video-to-gif' },
  { icon: '🎬', title: 'MP4 to GIF', description: 'Convert MP4 video to GIF', href: '/tools/gif-tools/mp4-to-gif' },
  { icon: '🎬', title: 'WEBM to GIF', description: 'Convert WEBM video to GIF', href: '/tools/gif-tools/webm-to-gif' },
  { icon: '🖼️', title: 'APNG to GIF', description: 'Convert APNG to GIF format', href: '/tools/gif-tools/apng-to-gif' },
  { icon: '🎞️', title: 'GIF to MP4', description: 'Convert GIF to MP4/WebM video', href: '/tools/gif-tools/gif-to-mp4' },
  { icon: '🖼️', title: 'GIF to APNG', description: 'Convert GIF to APNG format', href: '/tools/gif-tools/gif-to-apng' },
  { icon: '🖼️', title: 'Image to GIF', description: 'Create animated GIF from images', href: '/tools/gif-tools/image-to-gif' },
  { icon: '🎬', title: 'MOV to GIF', description: 'Convert MOV video to GIF', href: '/tools/gif-tools/mov-to-gif' },
  { icon: '🎬', title: 'AVI to GIF', description: 'Convert AVI video to GIF', href: '/tools/gif-tools/avi-to-gif' },
];

export default function GifToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">🎞️ GIF Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your GIF tools in one place - {tools.length} tools</p>
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
    </div>
  );
}