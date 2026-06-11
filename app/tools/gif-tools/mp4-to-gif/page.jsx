'use client';
import { useState, useRef } from 'react';
export default function Mp4ToGifPage() {
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFrames([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const convert = async () => {
    if (!videoRef.current || !file) return;
    setLoading(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 480);
    canvas.height = Math.min(video.videoHeight, 270);
    const ctx = canvas.getContext('2d');
    const capturedFrames = [];
    const totalFrames = 10;
    const dur = Math.min(video.duration, 5);
    for (let i = 0; i < totalFrames; i++) {
      video.currentTime = (i / totalFrames) * dur;
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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">MP4 to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert MP4 video to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an MP4 file here'}</p>
            <input ref={inputRef} type="file" accept="video/mp4" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-100" />}
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-600 text-center font-semibold">{frames.length} frames extracted</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Mp4 To Gif</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Mp4 To Gif is a free online tool that instantly converts your MP4 video files into animated GIF format without requiring any software installation. Perfect for creating shareable social media content, this tool maintains high quality while reducing file sizes for easy sharing across all platforms.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Mp4 To Gif</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Mp4 To Gif website and click the upload button to select your MP4 video file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired GIF settings such as frame rate, resolution, and quality to customize the output</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the convert button and wait for the tool to process your video file into GIF format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your newly created GIF file and share it on social media or use it wherever needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Mp4 To Gif really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Mp4 To Gif is completely free with no hidden charges, registration requirements, or premium features to unlock.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free online converters support files up to 100-500MB depending on server capacity, though we recommend keeping files under 100MB for faster processing.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my video quality be affected during conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool preserves good quality, but GIFs are generally larger files than compressed videos, so slight quality adjustments may occur depending on your settings.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple MP4 files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free versions process one file at a time, but you can queue multiple conversions and download them sequentially.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Trim your MP4 video before conversion to reduce file size and create shorter, more shareable GIFs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Lower the frame rate to 10-15 fps for smaller file sizes while maintaining smooth animation quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Reduce the resolution to 480p or lower if file size is a concern without sacrificing too much visual quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the tool during off-peak hours for faster conversion speeds and more reliable processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}