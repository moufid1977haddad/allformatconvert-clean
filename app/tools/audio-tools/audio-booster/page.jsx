'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioBoosterPage() {
  const [file, setFile] = useState(null);
  const [volume, setVolume] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const boost = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      ffmpeg.FS('writeFile', 'input.mp3', await fetchFile(file));
      await ffmpeg.run('-i', 'input.mp3', '-af', `volume=${volume}`, 'output.mp3');
      const data = ffmpeg.FS('readFile', 'output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setResult({ url, name: 'boosted_' + file.name });
    } catch(e) { setError('Boost failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Booster</h1>
        <p className="text-neutral-500 text-center mb-8">Boost and increase audio volume</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Volume Boost: {volume}x</label>
            <input type="range" min={1} max={5} step={0.5} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-neutral-400 mt-1"><span>1x (normal)</span><span>5x (max)</span></div>
          </div>
          <button onClick={boost} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Boosting...' : 'Boost Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Booster</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Booster is a free online tool that enhances and amplifies audio files instantly without requiring any software installation. Improve sound quality, increase volume levels, and optimize your audio tracks with advanced digital processing technology.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Booster</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Booster website and locate the upload section on the main page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your audio file from your computer (supports MP3, WAV, OGG, and other formats)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the boost level, equalization settings, and other audio parameters using the interactive sliders</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the process button to enhance your audio, then download the optimized file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Audio Booster really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Booster is completely free with no hidden charges, registration requirements, or premium subscriptions needed for basic audio enhancement.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Booster support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Booster supports all major audio formats including MP3, WAV, FLAC, OGG, M4A, and AAC files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will boosting audio reduce quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Booster uses advanced algorithms to enhance sound without significant quality loss when applied to appropriate audio levels.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does audio processing take?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Processing time depends on file size, typically ranging from a few seconds to a few minutes for standard audio files.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with moderate boost levels and gradually increase to find the optimal sound without distortion</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the equalization presets for specific audio types like music, podcasts, or voice recordings to achieve better results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your enhanced audio with headphones before sharing to ensure quality meets your expectations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your original file as backup before downloading the boosted version in case you need to make further adjustments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}