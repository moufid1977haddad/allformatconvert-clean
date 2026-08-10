'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, flatCategoryTextColors } from '../../lib/toolIcons';

const toolColor = flatCategoryTextColors['/tools/audio-tools'];

const tools = [
  { title: 'Audio Converter', description: 'Convert audio to different formats', href: '/tools/audio-tools/audio-converter' },
  { title: 'Audio Trimmer', description: 'Trim and cut audio files', href: '/tools/audio-tools/audio-trimmer' },
  { title: 'Audio Compressor', description: 'Compress audio files', href: '/tools/audio-tools/audio-compressor' },
  { title: 'Audio Merger', description: 'Merge multiple audio files', href: '/tools/audio-tools/audio-merger' },
  { title: 'Audio Splitter', description: 'Split audio into parts', href: '/tools/audio-tools/audio-splitter' },
  { title: 'Audio Booster', description: 'Boost audio volume', href: '/tools/audio-tools/audio-booster' },
  { title: 'Audio Equalizer', description: 'Adjust audio frequencies', href: '/tools/audio-tools/audio-equalizer' },
  { title: 'Audio Waveform', description: 'Visualize audio waveform', href: '/tools/audio-tools/audio-waveform' },
  { title: 'Audio Metadata', description: 'View and edit audio metadata', href: '/tools/audio-tools/audio-metadata' },
  { title: 'Voice Recorder', description: 'Record voice from microphone', href: '/tools/audio-tools/voice-recorder' },
  { title: 'Audio to Text', description: 'Transcribe audio to text', href: '/tools/audio-tools/audio-to-text' },
];

export default function AudioToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="audio-tools" className="w-8 h-8 text-yellow-500" /> Audio Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your audio tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolColor}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Tools is a comprehensive free online platform offering a suite of audio processing utilities designed to enhance, convert, and edit sound files without requiring software installation. Whether you need to trim, merge, convert formats, or adjust audio quality, Audio Tools provides accessible solutions for professionals and casual users alike.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Tools website and select the specific audio tool you need from the main menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your audio file by clicking the upload button or dragging and dropping your file into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Configure your desired settings such as format, quality, or audio parameters according to your requirements</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the process or convert button to apply changes, then download your edited audio file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Tools support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Tools supports all major audio formats including MP3, WAV, FLAC, OGG, AAC, M4A, and more, allowing seamless conversion between different file types.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploads?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Tools typically supports files up to 500MB, though limits may vary depending on your internet connection and the specific tool being used.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Audio Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account is required to use Audio Tools; all features are available to anyone with a web browser, making it completely accessible and anonymous.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded files be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Tools prioritizes user privacy and automatically deletes uploaded files after processing is complete; files are never stored or shared with third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch process multiple audio files simultaneously to save time when handling large projects or collections</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the audio preview feature before finalizing conversions to ensure the output quality meets your expectations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different compression settings to find the optimal balance between file size and audio quality for your specific needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your browser updated and use a stable internet connection to prevent interruptions during large file uploads and processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}