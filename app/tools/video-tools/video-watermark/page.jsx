'use client';
import { useState, useRef } from 'react';
export default function VideoWatermarkPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('Watermark');
  const [position, setPosition] = useState('bottom-right');
  const [screenshots, setScreenshots] = useState([]);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setScreenshots([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const capture = () => {
    if (!videoRef.current || !text) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const tw = ctx.measureText(text).width;
    let x = 20, y = 40;
    if (position === 'bottom-right') { x = canvas.width - tw - 20; y = canvas.height - 20; }
    else if (position === 'bottom-left') { x = 20; y = canvas.height - 20; }
    else if (position === 'top-right') { x = canvas.width - tw - 20; y = 40; }
    else if (position === 'center') { x = (canvas.width - tw) / 2; y = canvas.height / 2; }
    ctx.fillText(text, x, y);
    const url = canvas.toDataURL('image/png');
    const time = videoRef.current.currentTime.toFixed(2);
    setScreenshots(prev => [...prev, { url, time }]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Watermark</h1>
        <p className="text-neutral-500 text-center mb-8">Add watermark to video frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div><label className="block text-sm text-neutral-500 mb-1">Watermark Text</label><input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <div><label className="block text-sm text-neutral-500 mb-2">Position</label><div className="grid grid-cols-3 gap-2">{['top-left','top-right','center','bottom-left','bottom-right'].map(p => <button key={p} onClick={() => setPosition(p)} className={"py-2 rounded-lg text-sm font-semibold transition " + (position===p?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{p}</button>)}</div></div>
          <button onClick={capture} disabled={!file || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Capture Frame with Watermark</button>
          {screenshots.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {screenshots.map((s, i) => (
                <div key={i} className="space-y-1">
                  <img src={s.url} className="w-full rounded" />
                  <a href={s.url} download={"watermarked-" + s.time + ".png"} className="block text-center text-sm text-indigo-400 hover:text-indigo-300">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Watermark</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Watermark is a free online tool that allows you to easily add watermarks to your videos without any software installation or subscription fees. Protect your video content and brand identity by adding text, image, or logo watermarks in just a few clicks.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Watermark</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your video file by clicking the upload button or dragging and dropping your video onto the platform</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your watermark type (text, image, or logo) and customize its appearance, size, position, and opacity</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your watermarked video to ensure the watermark placement and styling matches your preferences</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your watermarked video to your device in your preferred format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Watermark support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Watermark supports all major video formats including MP4, AVI, MOV, WMV, FLV, MKV, and WebM for both uploading and downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The free version supports videos up to 500MB. For larger files, you can split your video into smaller segments or consider upgrading to a premium plan.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I add multiple watermarks to a single video?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Video Watermark allows you to add multiple watermarks by layering text, images, and logos at different positions and with different opacity levels.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the watermark quality affect my video quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, adding a watermark does not reduce your video quality. Your video maintains its original resolution and bitrate after watermarking.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Position your watermark in the corner of your video to minimize obstruction of important content while maintaining brand visibility</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use semi-transparent watermarks (30-50% opacity) to protect your content without making the watermark overly distracting to viewers</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test different watermark sizes on sample videos before watermarking your entire collection to find the optimal balance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Consider using your logo as a watermark instead of text for stronger brand recognition and more professional appearance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}