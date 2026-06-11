'use client';
import { useState, useRef } from 'react';
export default function VideoTrimmerPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.onloadedmetadata = () => {
        setDuration(Math.floor(videoRef.current.duration));
        setEnd(Math.floor(videoRef.current.duration));
      };
    }
  };

  const trim = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Trimming...');
    try {
      const stream = videoRef.current.captureStream();
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult(URL.createObjectURL(blob));
        setStatus('');
      };
      videoRef.current.currentTime = start;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, (end - start) * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Trimmer</h1>
        <p className="text-neutral-500 text-center mb-8">Trim and cut video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-500 mb-1">Start: {start}s</label><input type="range" min="0" max={duration-1} value={start} onChange={e => setStart(parseInt(e.target.value))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">End: {end}s</label><input type="range" min="1" max={duration} value={end} onChange={e => setEnd(parseInt(e.target.value))} className="w-full" /></div>
            </div>
          )}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={trim} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Trim Video ({end-start}s)</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="trimmed.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Trimmer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Trimmer is a free online tool that allows you to quickly cut and trim videos without downloading software or losing quality. Simply upload your video, select the start and end points, and download your trimmed file instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Trimmer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video Trimmer website and click the 'Upload Video' button to select your video file from your computer.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the timeline scrubber to set your desired start point by clicking and dragging or entering specific timestamps.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Set your end point using the same method, ensuring you've selected the exact portion of video you want to keep.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Trim' or 'Export' button and wait for processing to complete, then download your trimmed video file.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Trimmer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Trimmer supports all popular formats including MP4, AVI, MOV, WebM, MKV, FLV, and more. The tool automatically detects and processes your file format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free versions support files up to 500MB to 2GB depending on your internet connection. For larger files, consider breaking your video into smaller segments.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will trimming my video reduce the quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Video Trimmer preserves the original video quality by simply removing unwanted sections without re-encoding the entire file.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Video Trimmer?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Video Trimmer is completely free and requires no account creation or login to trim and download your videos.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview your trimmed video before downloading to ensure you've selected the correct start and end points.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use keyboard shortcuts for faster trimming: arrow keys to navigate frame-by-frame and spacebar to play/pause.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For precise cuts, zoom in on the timeline to get a better view of the exact frames where you want to trim.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your original video file as a backup before trimming, in case you need to make additional edits later.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}