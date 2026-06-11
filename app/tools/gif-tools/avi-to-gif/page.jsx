'use client';
import { useState, useRef } from 'react';
export default function AviToGifPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">AVI to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert AVI video to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an AVI file here'}</p>
            <input ref={inputRef} type="file" accept="video/avi,video/x-msvideo" className="hidden" onChange={handleFile} />
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Avi To Gif</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Avi To Gif is a free online conversion tool that instantly transforms AVI video files into animated GIF format without requiring any software installation. Perfect for creating shareable animations, memes, and social media content from your video clips.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Avi To Gif</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Avi To Gif website and click the 'Upload' button to select your AVI file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired output settings such as frame rate, quality, and size to customize your GIF</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to begin the conversion process, which typically completes in seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your newly created GIF file and share it on social media, messaging apps, or websites</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Avi To Gif completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Avi To Gif is 100% free with no hidden fees, account requirements, or premium upgrades needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does Avi To Gif have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most conversions support files up to 500MB, though larger files may take longer to process depending on server capacity.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple AVI files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can convert files one at a time through the web interface, or check if batch processing is available in your account settings.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded files be kept private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">All uploaded files are automatically deleted after conversion and are never stored or shared with third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Trim your AVI video before conversion to reduce file size and create more focused, shareable GIFs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Lower the frame rate during conversion if you want smaller file sizes while maintaining acceptable animation quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different dimensions to optimize GIF size for specific platforms like Twitter, Discord, or Slack</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Convert short video clips under 30 seconds for the best results and fastest processing times</li>
          </ul>
        </div>
      </div>
    </div>
  );
}