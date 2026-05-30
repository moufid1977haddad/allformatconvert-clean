'use client';
import Link from 'next/link';

const tools = [
  { icon: '🎵', title: 'Video to Audio', description: 'Extract audio from video files', href: '/tools/media-tools/video-to-audio' },
  { icon: '🎬', title: 'Video Compressor', description: 'Compress video files easily', href: '/tools/media-tools/video-compressor' },
  { icon: '🔄', title: 'Video Converter', description: 'Convert video to different formats', href: '/tools/media-tools/video-converter' },
  { icon: '✂️', title: 'Video Trimmer', description: 'Trim and cut video files', href: '/tools/media-tools/video-trimmer' },
  { icon: '🖼️', title: 'Video to GIF', description: 'Convert video clips to GIF', href: '/tools/media-tools/video-to-gif' },
  { icon: '📸', title: 'Video Screenshot', description: 'Capture screenshots from video', href: '/tools/media-tools/video-screenshot' },
  { icon: '🔊', title: 'Audio Converter', description: 'Convert audio to different formats', href: '/tools/media-tools/audio-converter' },
  { icon: '🎙️', title: 'Audio Trimmer', description: 'Trim and cut audio files', href: '/tools/media-tools/audio-trimmer' },
  { icon: '🔇', title: 'Audio Compressor', description: 'Compress audio files', href: '/tools/media-tools/audio-compressor' },
  { icon: '🎚️', title: 'Audio Merger', description: 'Merge multiple audio files', href: '/tools/media-tools/audio-merger' },
  { icon: '📢', title: 'Audio Booster', description: 'Boost audio volume', href: '/tools/media-tools/audio-booster' },
  { icon: '🎼', title: 'Audio to Text', description: 'Transcribe audio to text', href: '/tools/media-tools/audio-to-text' },
  { icon: '🎞️', title: 'GIF Maker', description: 'Create GIF from images', href: '/tools/media-tools/gif-maker' },
  { icon: '🖼️', title: 'GIF Compressor', description: 'Compress GIF files', href: '/tools/media-tools/gif-compressor' },
  { icon: '▶️', title: 'Media Player', description: 'Play audio and video files', href: '/tools/media-tools/media-player' },
  { icon: '📊', title: 'Video Metadata', description: 'View and edit video metadata', href: '/tools/media-tools/video-metadata' },
  { icon: '🔈', title: 'Audio Metadata', description: 'View and edit audio metadata', href: '/tools/media-tools/audio-metadata' },
  { icon: '🎭', title: 'Video Watermark', description: 'Add watermark to video', href: '/tools/media-tools/video-watermark' },
  { icon: '📝', title: 'Subtitle Generator', description: 'Generate subtitles for video', href: '/tools/media-tools/subtitle-generator' },
  { icon: '🌊', title: 'Audio Waveform', description: 'Visualize audio waveform', href: '/tools/media-tools/audio-waveform' },
  { icon: '🎤', title: 'Voice Recorder', description: 'Record voice from microphone', href: '/tools/media-tools/voice-recorder' },
  { icon: '📱', title: 'Screen Recorder', description: 'Record your screen', href: '/tools/media-tools/screen-recorder' },
  { icon: '🔀', title: 'Video Merger', description: 'Merge multiple videos', href: '/tools/media-tools/video-merger' },
  { icon: '🔄', title: 'Video Rotator', description: 'Rotate video files', href: '/tools/media-tools/video-rotator' },
  { icon: '📐', title: 'Video Resizer', description: 'Resize video dimensions', href: '/tools/media-tools/video-resizer' },
  { icon: '🎨', title: 'Video Filter', description: 'Apply filters to video', href: '/tools/media-tools/video-filter' },
  { icon: '🔉', title: 'Audio Equalizer', description: 'Adjust audio frequencies', href: '/tools/media-tools/audio-equalizer' },
  { icon: '📻', title: 'Audio Splitter', description: 'Split audio into parts', href: '/tools/media-tools/audio-splitter' },
];

export default function MediaToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🎬 Media Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your media tools in one place - {tools.length} tools</p>
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
