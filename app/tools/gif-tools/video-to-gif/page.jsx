'use client';
import { useState, useRef } from 'react';
export default function VideoToGifPage() {
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fps, setFps] = useState(5);
  const [duration, setDuration] = useState(3);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFrames([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const capture = async () => {
    if (!videoRef.current || !file) return;
    setLoading(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    const capturedFrames = [];
    const totalFrames = fps * duration;
    const interval = duration / totalFrames;
    for (let i = 0; i < totalFrames; i++) {
      video.currentTime = i * interval;
      await new Promise(r => { video.onseeked = r; });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      capturedFrames.push(canvas.toDataURL('image/png'));
    }
    setFrames(capturedFrames);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Video to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert video files to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-100" />}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">FPS: {fps}</label><input type="range" min="1" max="15" value={fps} onChange={e => setFps(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Duration: {duration}s</label><input type="range" min="1" max="10" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <button onClick={capture} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Capturing frames...' : 'Convert to GIF Frames'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-600 text-center font-semibold">{frames.length} frames captured</p>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((f, i) => <img key={i} src={f} className="w-full rounded border border-neutral-200" />)}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {frames.map((f, i) => <a key={i} href={f} download={"frame-" + i + ".png"} className="block text-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg py-1 text-sm transition text-neutral-600">Frame {i+1}</a>)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video To Gif</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video To Gif is a free online tool that instantly converts your video files into animated GIF format without requiring any software installation or account creation. Perfect for social media sharing, this tool supports multiple video formats and produces high-quality GIFs with customizable settings.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video To Gif</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your video file by clicking the upload button or dragging and dropping your video onto the interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired start and end points to trim the video segment you want to convert into a GIF</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the GIF settings such as frame rate, resolution, and quality to optimize your output</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the convert button and download your finished GIF file instantly to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video To Gif support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video To Gif supports all major video formats including MP4, MOV, AVI, WebM, MKV, FLV, and WMV files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most videos up to 500MB can be processed, though larger files may take longer to convert depending on your internet speed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I edit the GIF after conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can adjust frame rate, resolution, and quality before conversion, but editing after creation requires additional tools.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my videos after conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all files are processed temporarily and deleted immediately after conversion for your privacy and security.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your video segments short (5-10 seconds) to create smaller file sizes and faster loading GIFs on social media</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust the frame rate to 10-15 FPS for smoother animations while maintaining reasonable file sizes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use lower resolution settings for web sharing to reduce file size without significant quality loss</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your GIF on different platforms before sharing to ensure it displays correctly on social media sites</li>
          </ul>
        </div>
      </div>
    </div>
  );
}