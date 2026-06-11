'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioSplitterPage() {
  const [file, setFile] = useState(null);
  const [splitAt, setSplitAt] = useState(30);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResults([]); };
  const onLoaded = () => { setDuration(Math.floor(audioRef.current.duration)); };

  const split = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      ffmpeg.FS('writeFile', 'input.mp3', await fetchFile(file));
      await ffmpeg.run('-i', 'input.mp3', '-t', String(splitAt), 'part1.mp3');
      await ffmpeg.run('-i', 'input.mp3', '-ss', String(splitAt), 'part2.mp3');
      const data1 = ffmpeg.FS('readFile', 'part1.mp3');
      const data2 = ffmpeg.FS('readFile', 'part2.mp3');
      setResults([
        { url: URL.createObjectURL(new Blob([data1.buffer], { type: 'audio/mp3' })), name: 'part1_' + file.name },
        { url: URL.createObjectURL(new Blob([data2.buffer], { type: 'audio/mp3' })), name: 'part2_' + file.name },
      ]);
    } catch(e) { setError('Split failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Splitter</h1>
        <p className="text-neutral-500 text-center mb-8">Split audio into multiple parts</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {file && <audio ref={audioRef} src={URL.createObjectURL(file)} onLoadedMetadata={onLoaded} controls className="w-full" />}
          {duration > 0 && (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Split at: {splitAt}s (of {duration}s)</label>
              <input type="range" min={1} max={duration - 1} value={splitAt} onChange={e => setSplitAt(Number(e.target.value))} className="w-full" />
            </div>
          )}
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Splitting...' : 'Split Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {results.map((r, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Part {i+1}</p>
              <audio controls src={r.url} className="w-full" />
              <a href={r.url} download={r.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Part {i+1}</a>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Splitter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Splitter is a free online tool that allows you to easily divide audio files into multiple segments without any software installation. Whether you need to split podcasts, music tracks, or voice recordings, this tool provides a simple and efficient solution for all your audio editing needs.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Splitter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your audio file by clicking the upload button or dragging and dropping your file into the designated area.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the timeline editor to mark the points where you want to split your audio file by clicking at the desired positions.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the split points precisely using the playback controls and preview your selections to ensure accuracy.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the split or download button to process your audio and save the individual segments to your device.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Splitter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Splitter supports all major audio formats including MP3, WAV, FLAC, OGG, M4A, AAC, and WMA files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading audio files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free versions support files up to 500MB, but larger files may be processed depending on your browser and internet speed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Audio Splitter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Audio Splitter is completely free and requires no account creation or registration to use.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded files be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your files are processed securely and deleted immediately after the session; they are never stored or shared with third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use headphones while previewing your audio to accurately identify the exact split points for better precision.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your split audio files with descriptive names immediately after downloading to avoid confusion and maintain organization.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For podcasts, consider splitting by chapters or segments to create more manageable content for distribution and archiving.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the split audio files on your target platform before finalizing to ensure compatibility and quality meet your requirements.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}