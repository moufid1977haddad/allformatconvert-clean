'use client';
import Link from 'next/link';

const tools = [
  { icon: '🔄', title: 'Audio Converter', description: 'Convert audio to different formats', href: '/tools/audio-tools/audio-converter' },
  { icon: '✂️', title: 'Audio Trimmer', description: 'Trim and cut audio files', href: '/tools/audio-tools/audio-trimmer' },
  { icon: '🔇', title: 'Audio Compressor', description: 'Compress audio files', href: '/tools/audio-tools/audio-compressor' },
  { icon: '🎚️', title: 'Audio Merger', description: 'Merge multiple audio files', href: '/tools/audio-tools/audio-merger' },
  { icon: '📻', title: 'Audio Splitter', description: 'Split audio into parts', href: '/tools/audio-tools/audio-splitter' },
  { icon: '📢', title: 'Audio Booster', description: 'Boost audio volume', href: '/tools/audio-tools/audio-booster' },
  { icon: '🎼', title: 'Audio Equalizer', description: 'Adjust audio frequencies', href: '/tools/audio-tools/audio-equalizer' },
  { icon: '🌊', title: 'Audio Waveform', description: 'Visualize audio waveform', href: '/tools/audio-tools/audio-waveform' },
  { icon: '🔈', title: 'Audio Metadata', description: 'View and edit audio metadata', href: '/tools/audio-tools/audio-metadata' },
  { icon: '🎤', title: 'Voice Recorder', description: 'Record voice from microphone', href: '/tools/audio-tools/voice-recorder' },
  { icon: '🎙️', title: 'Audio to Text', description: 'Transcribe audio to text', href: '/tools/audio-tools/audio-to-text' },
];

export default function AudioToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Audio Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your audio tools in one place - {tools.length} tools</p>
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
