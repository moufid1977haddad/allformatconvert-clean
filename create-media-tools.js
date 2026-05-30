const fs = require('fs');
const path = require('path');

const tools = [
  'video-to-audio', 'video-compressor', 'video-converter', 'video-trimmer',
  'video-to-gif', 'video-screenshot', 'audio-converter', 'audio-trimmer',
  'audio-compressor', 'audio-merger', 'audio-booster', 'audio-to-text',
  'gif-maker', 'gif-compressor', 'media-player', 'video-metadata',
  'audio-metadata', 'video-watermark', 'subtitle-generator', 'audio-waveform',
  'voice-recorder', 'screen-recorder', 'video-merger', 'video-rotator',
  'video-resizer', 'video-filter', 'audio-equalizer', 'audio-splitter'
];

const titles = {
  'video-to-audio': 'Video to Audio',
  'video-compressor': 'Video Compressor',
  'video-converter': 'Video Converter',
  'video-trimmer': 'Video Trimmer',
  'video-to-gif': 'Video to GIF',
  'video-screenshot': 'Video Screenshot',
  'audio-converter': 'Audio Converter',
  'audio-trimmer': 'Audio Trimmer',
  'audio-compressor': 'Audio Compressor',
  'audio-merger': 'Audio Merger',
  'audio-booster': 'Audio Booster',
  'audio-to-text': 'Audio to Text',
  'gif-maker': 'GIF Maker',
  'gif-compressor': 'GIF Compressor',
  'media-player': 'Media Player',
  'video-metadata': 'Video Metadata',
  'audio-metadata': 'Audio Metadata',
  'video-watermark': 'Video Watermark',
  'subtitle-generator': 'Subtitle Generator',
  'audio-waveform': 'Audio Waveform',
  'voice-recorder': 'Voice Recorder',
  'screen-recorder': 'Screen Recorder',
  'video-merger': 'Video Merger',
  'video-rotator': 'Video Rotator',
  'video-resizer': 'Video Resizer',
  'video-filter': 'Video Filter',
  'audio-equalizer': 'Audio Equalizer',
  'audio-splitter': 'Audio Splitter'
};

const basePath = 'app/tools/media-tools';

tools.forEach(tool => {
  const dir = path.join(basePath, tool);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const title = titles[tool];
  const content = `'use client';
export default function ${title.replace(/\s+/g, '')}Page() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold mb-4">${title}</h1>
        <p className="text-neutral-400 mb-8">This tool is coming soon. We are working hard to bring you the best experience.</p>
        <div className="bg-neutral-900 rounded-xl p-8 space-y-4">
          <div className="text-indigo-400 text-xl font-semibold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">Media processing tools require advanced technologies. We are integrating FFmpeg.wasm to bring full video and audio processing directly in your browser.</p>
        </div>
      </div>
    </div>
  );
}`;
  fs.writeFileSync(path.join(dir, 'page.jsx'), content, 'utf8');
  console.log('Created: ' + path.join(dir, 'page.jsx'));
});

console.log('All media tools created!');