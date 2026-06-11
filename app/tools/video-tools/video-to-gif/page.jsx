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
    video.currentTime = 0;
    for (let i = 0; i < totalFrames; i++) {
      await new Promise(r => setTimeout(r, 100));
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
        <h1 className="text-3xl font-bold text-center mb-2">Video to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Extract frames from video as GIF preview</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">FPS: {fps}</label><input type="range" min="1" max="15" value={fps} onChange={e => setFps(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Duration: {duration}s</label><input type="range" min="1" max="10" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <button onClick={capture} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Capturing...' : 'Capture Frames'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-400 text-center">{frames.length} frames captured</p>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((f, i) => <img key={i} src={f} className="w-full rounded" />)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {frames.map((f, i) => <a key={i} href={f} download={"frame-" + i + ".png"} className="block text-center bg-neutral-800 hover:bg-neutral-100 rounded-lg py-1 text-sm transition">Frame {i+1}</a>)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video To Gif</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video To Gif is a free online tool that instantly converts your video files into animated GIFs without requiring any software installation or registration. Perfect for creating shareable animations from YouTube videos, MP4 files, or any video format, this tool makes it easy to extract the exact moments you want as GIFs.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video To Gif</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video To Gif website and click the 'Upload Video' button to select your video file from your computer or paste a video URL</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Trim the video to your desired length by setting the start and end timestamps using the timeline scrubber or input fields</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the GIF settings such as frame rate, quality, and size to optimize the output for your needs</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Convert to GIF' button and wait for processing to complete, then download your new animated GIF file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video To Gif support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video To Gif supports most common video formats including MP4, MOV, AVI, WebM, MKV, and FLV, as well as URLs from YouTube and other video platforms</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free online versions support files up to 100-500MB depending on the specific tool configuration, though larger files may take longer to process</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I adjust the speed and quality of the output GIF?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Video To Gif allows you to customize frame rate, resolution, and quality settings to create the perfect animated GIF for your needs</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Video To Gif?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Video To Gif is completely free and requires no account creation, registration, or login to convert your videos</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your GIF file size small by selecting a lower resolution and reducing the frame rate, which helps with faster loading on social media platforms</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, trim your video to 5-10 seconds as longer GIFs take more time to process and create larger file sizes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different frame rates between 5-15 fps to find the perfect balance between smooth animation and file size</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview your GIF before downloading to ensure the timing, speed, and quality match your expectations before sharing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}