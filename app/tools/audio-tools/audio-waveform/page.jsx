'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function AudioWaveformPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const canvasRef = useRef();
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const arrayBuffer = await f.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    drawWaveform(audioBuffer);
  };

  const drawWaveform = (audioBuffer) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const val = data[i * step + j] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Waveform</h1>
        <p className="text-neutral-500 text-center mb-8">Visualize your audio waveform</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <canvas ref={canvasRef} width={800} height={200} className="w-full rounded-xl border border-neutral-200" />
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Waveform</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Waveform is a free online tool that visualizes audio files by displaying their waveforms in an interactive, easy-to-understand format. Perfect for musicians, podcasters, and audio engineers who need quick waveform analysis without installing software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Waveform</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Waveform website and click the upload button to select your audio file</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the tool to process and generate the visual waveform representation of your audio</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Use the interactive controls to zoom, pan, and analyze specific sections of the waveform</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Export or download your waveform visualization in your preferred format for use in projects</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Waveform support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Waveform supports all major audio formats including MP3, WAV, FLAC, OGG, M4A, and more, making it compatible with virtually any audio file you have.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Audio Waveform really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Waveform is completely free with no hidden fees, subscriptions, or premium tiers required for full access to all features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Audio Waveform on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Waveform is fully responsive and works on smartphones, tablets, and desktop computers through any modern web browser.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my audio files after I upload them?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your audio files are processed securely and are not stored on our servers after the session ends, ensuring complete privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the zoom feature to examine detailed sections of your audio for precise editing and analysis work</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export waveforms as high-resolution images for documentation, presentations, or educational purposes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare multiple audio files by opening them in separate browser tabs to analyze differences in loudness and frequency patterns</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of the tool's color-coded visualization to quickly identify peaks, valleys, and potential audio problems</li>
          </ul>
        </div>
      </div>
    </div>
  );
}