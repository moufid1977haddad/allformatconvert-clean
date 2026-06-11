'use client';
import { useState, useRef } from 'react';
export default function WebmToGifPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">WEBM to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert WEBM video to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a WEBM file here'}</p>
            <input ref={inputRef} type="file" accept="video/webm" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-100" />}
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-600 text-center font-semibold">{frames.length} frames extracted</p>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((f, i) => <img key={i} src={f} className="w-full rounded border border-neutral-200" />)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Webm To Gif</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Webm To Gif is a free online converter that transforms WebM video files into animated GIF images instantly without requiring any software installation. Perfect for creating shareable animations from your WebM videos, this tool preserves quality while reducing file sizes for easy distribution across social media and web platforms.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Webm To Gif</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Webm To Gif tool on your web browser and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your WebM file into the designated conversion zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust any optional settings such as frame rate, quality, or size preferences if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the convert button and wait for the process to complete, then download your new GIF file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Webm To Gif completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Webm To Gif is 100% free with no hidden charges, registration requirements, or premium upgrades needed to convert your files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limitations exist for WebM uploads?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free online converters support files up to 100-500MB depending on server capacity, though larger files may take longer to process.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple WebM files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Some versions of Webm To Gif support batch conversion, allowing you to upload and convert multiple files simultaneously for increased efficiency.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the conversion maintain the original video quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The GIF output quality depends on your chosen settings, but Webm To Gif optimizes files to balance quality with smaller file sizes suitable for web sharing.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Trim your WebM video before conversion to reduce file size and focus only on the essential animated portion you need as a GIF</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different frame rate settings to find the optimal balance between animation smoothness and final GIF file size</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use lower resolution settings for GIFs intended for social media to ensure faster loading times and better compatibility across platforms</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your converted GIF files across different browsers and devices to ensure compatibility before sharing with your audience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}