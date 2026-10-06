'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Audio Converter', description: 'Convert one file to 18 formats, from MP3 to FLAC', href: '/tools/audio-tools/audio-converter' },
  { title: 'Audio Trimmer', description: 'Keep the part between two times, with fades', href: '/tools/audio-tools/audio-trimmer' },
  { title: 'Audio Compressor', description: 'Re-encode at 64 to 320 kbps to shrink a file', href: '/tools/audio-tools/audio-compressor' },
  { title: 'Audio Merger', description: 'Join files in order, end to end or crossfaded', href: '/tools/audio-tools/audio-merger' },
  { title: 'Audio Splitter', description: 'Cut at a point, into equal parts or every N seconds', href: '/tools/audio-tools/audio-splitter' },
  { title: 'Audio Booster', description: 'Change the volume 0.25× to 5×, or normalize it', href: '/tools/audio-tools/audio-booster' },
  { title: 'Audio Equalizer', description: 'Adjust bass, mid and treble, export as WAV', href: '/tools/audio-tools/audio-equalizer' },
  { title: 'Audio Waveform', description: 'Draw the waveform and save it as a PNG', href: '/tools/audio-tools/audio-waveform' },
  { title: 'Audio Metadata', description: 'Codec, bitrate, tags and cover of an audio file', href: '/tools/audio-tools/audio-metadata' },
  { title: 'Voice Recorder', description: 'Record the microphone, save as MP3 or WAV', href: '/tools/audio-tools/voice-recorder' },
  { title: 'Audio to Text', description: 'Dictate live, or transcribe a file with Whisper', href: '/tools/audio-tools/audio-to-text' },
];

export default function AudioToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="audio-tools" className={`w-8 h-8 ${categoryColors['audio-tools']}`} /> Audio Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Convert, cut, join, record and transcribe audio - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Most of these tools edit the audio in your browser with ffmpeg.wasm or the Web Audio API, without uploading it. Two cases use a server: an Opus output in Audio Converter, Compressor, Merger, Splitter or Booster is encoded with libopus on our own media service, and Audio to Text sends a file through our server to OpenAI's Whisper. In its microphone mode, your browser's speech service does the recognition, which in Chrome means Google. The editing tools open MP3, WAV, M4A, AAC, FLAC, OGG, Opus, WMA, AIFF and AMR files.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Choose the tool for the job: change the format (Converter), shrink the file (Compressor), cut (Trimmer, Splitter), join (Merger), change loudness (Booster, Equalizer) or inspect (Waveform, Metadata).</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Pick one audio file, or several in Audio Merger; Voice Recorder and the microphone mode of Audio to Text use your microphone instead.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Set the options, such as output format, bitrate, cut times or gain; the tools built on ffmpeg.wasm download that engine from unpkg.com on first use.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the result in the format you chose: Audio Splitter gives one file per part, and Audio to Text gives TXT, SRT or VTT.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which audio formats can I open?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AIFF, AMR, MKA, WEBA and CAF, in the editing tools. Audio Converter writes 18 formats, from MP3 and FLAC to ALAC and WavPack, and Audio Merger 14.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No fixed limit in the editing tools: the whole file is loaded into your device memory, so a very long file can fail when memory runs out. Audio to Text accepts files up to 25 MB, the most OpenAI Whisper takes, and an Opus output is capped by our media service.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my audio uploaded?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Only in two cases. An Opus output goes to our own media service, which deletes your upload when encoding ends and the Opus file after download or a set time. Audio to Text sends a file through our server to OpenAI and leaves the microphone mode to your browser's speech service.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the number of Opus conversions limited?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes. Our media service counts jobs per connection per hour and per day, and Audio Splitter counts one job per Opus part. The page shows a message when the limit is reached. The other output formats are made in your browser instead and are not counted.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>To remove a passage from the middle, split the file at both ends with Audio Splitter and join the outer parts with Audio Merger.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Pick FLAC or WAV in Audio Merger to join files without adding another lossy encoding.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Audio Compressor never raises the bitrate above the source's own; read it in Audio Metadata to choose a lower one.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Voice Recorder saves the format your browser records, M4A or WebM; use its MP3 or WAV export when another program needs one of those.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}