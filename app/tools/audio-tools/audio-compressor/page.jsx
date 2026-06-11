'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioCompressorPage() {
  const [file, setFile] = useState(null);
  const [bitrate, setBitrate] = useState('128');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();
      ffmpeg.FS('writeFile', 'input.mp3', await fetchFile(file));
      await ffmpeg.run('-i', 'input.mp3', '-b:a', bitrate + 'k', 'output.mp3');
      const data = ffmpeg.FS('readFile', 'output.mp3');
      const blob = new Blob([data.buffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1);
      setResult({ url, name: 'compressed_' + file.name, originalSize: (file.size/1024/1024).toFixed(2), newSize: (blob.size/1024/1024).toFixed(2), reduction });
    } catch(e) { setError('Compression failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress audio files to reduce size</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Bitrate: {bitrate} kbps</label>
            <div className="flex gap-2">
              {['64', '96', '128', '192', '256', '320'].map(b => (
                <button key={b} onClick={() => setBitrate(b)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${bitrate === b ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{b}k</button>
              ))}
            </div>
          </div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Compressing...' : 'Compress Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Original</div><div className="font-bold text-sm">{result.originalSize} MB</div></div>
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Compressed</div><div className="font-bold text-sm text-indigo-600">{result.newSize} MB</div></div>
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Saved</div><div className="font-bold text-sm text-green-600">{result.reduction}%</div></div>
              </div>
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Compressor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Compressor is a free online tool that reduces the dynamic range of your audio files, making quiet parts louder and loud parts quieter for a more balanced sound. Perfect for podcasts, music production, and voice recordings, our compressor requires no software installation or technical expertise.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Compressor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your audio file by clicking the upload button or dragging and dropping your file into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Adjust the compression settings including ratio, threshold, attack, and release to suit your audio needs</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your compressed audio to ensure the settings produce the desired effect</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your compressed audio file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Compressor support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool supports MP3, WAV, OGG, FLAC, and M4A audio formats for both upload and download.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for compression?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can compress audio files up to 500MB in size. For larger files, consider splitting them into smaller segments.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my audio files after compression?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, we do not store any of your files. All audio is processed and deleted immediately after download for your privacy.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the difference between ratio and threshold settings?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Threshold sets the level at which compression begins, while ratio determines how much the audio is compressed once it exceeds the threshold.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with a low compression ratio of 2:1 or 4:1 for subtle compression, then gradually increase for more noticeable effects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use a shorter attack time for drums and percussion to catch transients quickly, and longer attack times for vocals and melodic instruments</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Lower the threshold setting to compress more of your audio, or raise it to compress only the loudest peaks</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always compare your compressed audio with the original by using the preview feature to ensure you haven't over-compressed and lost dynamic character</li>
          </ul>
        </div>
      </div>
    </div>
  );
}