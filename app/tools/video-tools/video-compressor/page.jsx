'use client';
import { useState, useRef } from 'react';
export default function VideoCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.5);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const compress = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Compressing...');
    try {
      const stream = videoRef.current.captureStream();
      const options = { mimeType: 'video/webm', videoBitsPerSecond: quality * 2500000 };
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult({ url: URL.createObjectURL(blob), size: blob.size, original: file.size });
        setStatus('');
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  const fmt = (b) => b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {Math.round(quality*100)}%</label><input type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} className="w-full" /></div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={compress} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compress Video</button>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{fmt(result.original)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After</div><div className="font-bold text-indigo-400">{fmt(result.size)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Saved</div><div className="font-bold text-green-400">{Math.round((1-result.size/result.original)*100)}%</div></div>
              </div>
              <video controls src={result.url} className="w-full rounded-xl" />
              <a href={result.url} download="compressed.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Compressor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Compressor is a free online tool that reduces video file sizes without sacrificing quality, making it easy to share, upload, and store your videos. Simply upload your video, select your preferred compression settings, and download the optimized file in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Compressor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video Compressor website and click the 'Upload Video' button to select your video file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired compression level and output format from the available options to customize the compression settings</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Compress' button and wait for the tool to process and reduce your video file size</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your compressed video file once processing is complete and use it for sharing, uploading, or storage</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Compressor support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Compressor supports all major video formats including MP4, AVI, MOV, MKV, FLV, WMV, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free online video compressors support files up to 500MB to 2GB depending on your internet connection and server capacity.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will compression reduce video quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Compressor uses advanced algorithms to minimize quality loss while significantly reducing file size, giving you the best balance between size and quality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does it take to compress a video?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Compression time depends on video length and file size, typically ranging from a few seconds to several minutes for larger files.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with a lower compression level if you want to maintain higher video quality, and increase compression only if needed for smaller file sizes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Choose the MP4 format for best compatibility across devices and platforms when sharing your compressed videos online</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress videos during off-peak hours for faster processing times, especially if working with large video files</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test compressed videos on different devices before final distribution to ensure quality meets your requirements and expectations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}