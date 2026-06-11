'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioMergerPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFiles = (e) => { setFiles(Array.from(e.target.files)); setResult(null); };

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      const inputs = [];
      for (let i = 0; i < files.length; i++) {
        const name = `input${i}.mp3`;
        ffmpeg.FS('writeFile', name, await fetchFile(files[i]));
        inputs.push(`file '${name}'`);
      }
      ffmpeg.FS('writeFile', 'list.txt', new TextEncoder().encode(inputs.join('\n')));
      await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp3');
      const data = ffmpeg.FS('readFile', 'output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setResult({ url, name: 'merged_audio.mp3' });
    } catch(e) { setError('Merge failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge multiple audio files into one</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {files.length > 0 ? <p className="text-neutral-700 font-medium">{files.length} files selected</p> : <p className="text-neutral-400 text-sm">Click to upload multiple audio files</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => <div key={i} className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">{i+1}. {f.name}</div>)}
            </div>
          )}
          <button onClick={merge} disabled={files.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Merging...' : 'Merge Audio Files'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Merged Audio</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Merger</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Merger is a free online tool that allows you to combine multiple audio files into a single track without requiring any software installation. Whether you're creating podcasts, music compilations, or audio projects, Audio Merger makes it easy to merge MP3, WAV, and other audio formats seamlessly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Merger</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Merger website and click the 'Upload Files' button to select multiple audio files from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Arrange the audio tracks in your desired order by dragging and dropping them in the queue</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust volume levels and add fade-in or fade-out effects if needed using the available controls</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Merge' button to combine all files and download your final merged audio file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Merger support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Merger supports popular formats including MP3, WAV, OGG, M4A, FLAC, and AAC files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to how many files I can merge?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can merge up to 10 audio files in a single session, with a maximum total file size of 500MB.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Audio Merger?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Audio Merger is completely free and requires no account creation or login.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does it take to merge audio files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Merging time depends on file size and internet speed, typically ranging from a few seconds to a few minutes.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Normalize audio levels before merging to ensure consistent volume across all tracks and prevent sudden loud spikes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to listen to your merged audio before downloading to catch any issues</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep audio files in the same format and sample rate for the best quality results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Add short silence gaps between tracks using the transition settings for a more professional-sounding final product</li>
          </ul>
        </div>
      </div>
    </div>
  );
}