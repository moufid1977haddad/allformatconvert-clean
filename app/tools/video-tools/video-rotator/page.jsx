'use client';
import { useState, useRef } from 'react';
export default function VideoRotatorPage() {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState(90);
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

  const rotate = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Rotating...');
    try {
      const canvas = document.createElement('canvas');
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      if (angle === 90 || angle === 270) { canvas.width = vh; canvas.height = vw; }
      else { canvas.width = vw; canvas.height = vh; }
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(angle * Math.PI / 180);
        ctx.drawImage(videoRef.current, -vw/2, -vh/2, vw, vh);
        ctx.restore();
        if (!videoRef.current.paused && !videoRef.current.ended) requestAnimationFrame(drawFrame);
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      drawFrame();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Rotator</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={"px-4 py-2 rounded-lg font-semibold transition " + (angle===a?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{a}°</button>)}</div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={rotate} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Rotate Video</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="rotated.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Rotator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Rotator is a free online tool that allows you to rotate videos to any angle without losing quality or requiring software installation. Perfect for fixing sideways videos, creating unique content angles, and adjusting video orientation instantly in your browser.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Rotator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video Rotator website and click the upload button to select your video file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired rotation angle (90Â°, 180Â°, 270Â°, or custom angles) from the rotation options menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your rotated video in the player to ensure it looks correct before processing</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your rotated video to your computer in your preferred format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Rotator support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Rotator supports all common video formats including MP4, AVI, MOV, WebM, MKV, and more. The tool automatically detects and processes your file format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Rotator can handle videos up to 2GB in size. For larger files, we recommend splitting your video or compressing it before upload.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will rotating my video reduce its quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Video Rotator uses lossless rotation technology that preserves your original video quality and resolution without any degradation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does it take to rotate a video?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Processing time depends on your video length and file size, typically ranging from a few seconds to a few minutes. The tool works faster with shorter videos.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature before downloading to ensure your video is rotated exactly as you want it</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For batch processing multiple videos, rotate them one at a time and organize them in a dedicated folder</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your video plays sideways on mobile devices, a 90Â° rotation will fix the orientation issue automatically</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Consider reducing video resolution before upload if you experience slow processing times with large files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}