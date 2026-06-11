'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function AudioTrimmerPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
  };

  const onLoaded = () => {
    const dur = audioRef.current.duration;
    setDuration(Math.floor(dur));
    setEnd(Math.floor(dur));
  };

  const trim = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      const inputName = 'input.' + file.name.split('.').pop();
      const outputName = 'output.mp3';
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      await ffmpeg.run('-i', inputName, '-ss', String(start), '-to', String(end), '-c', 'copy', outputName);
      const data = ffmpeg.FS('readFile', outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setResult({ url, name: 'trimmed_' + file.name.replace(/\.[^.]+$/, '') + '.mp3' });
    } catch(e) {
      setError('Trim failed: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Trimmer</h1>
        <p className="text-neutral-500 text-center mb-8">Trim and cut audio files easily</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {audioUrl && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} controls className="w-full" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">Start (seconds): {start}s</label>
                <input type="range" min={0} max={duration} value={start} onChange={e => setStart(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">End (seconds): {end}s</label>
                <input type="range" min={0} max={duration} value={end} onChange={e => setEnd(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}
          <button onClick={trim} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Trimming...' : 'Trim Audio'}
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Trimmer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Trimmer is a free online tool that allows you to quickly cut, trim, and edit audio files directly in your web browser without installing any software. Support for multiple audio formats makes it easy to remove unwanted sections from your music, podcasts, and voice recordings.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Trimmer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Trimmer website and click the upload button to select your audio file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the timeline slider to mark the start and end points of the section you want to keep</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your trimmed audio to ensure it sounds correct before finalizing the edit</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your trimmed audio file to your computer</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Trimmer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Trimmer supports all major audio formats including MP3, WAV, M4A, OGG, FLAC, and more for seamless editing across different file types.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Audio Trimmer completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Trimmer is 100% free with no hidden fees, subscriptions, or premium features required to trim and download your audio files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use Audio Trimmer?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Audio Trimmer is a web-based tool that works directly in your browser, so no installation or downloads are necessary.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded files be kept private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your audio files are processed securely and automatically deleted from our servers after your session ends for complete privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use headphones while previewing your trimmed audio to catch any unwanted background noise or audio artifacts at the cut points</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always preview your edits before downloading to avoid having to re-upload and trim the file again</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Trim audio files in smaller sections if you need to remove multiple unwanted parts throughout a long recording</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export your trimmed audio as MP3 for maximum compatibility if you plan to share the file with others</li>
          </ul>
        </div>
      </div>
    </div>
  );
}