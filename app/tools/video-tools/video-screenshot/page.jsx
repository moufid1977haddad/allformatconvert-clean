'use client';
import { useState, useRef } from 'react';
export default function VideoScreenshotPage() {
  const [file, setFile] = useState(null);
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
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const url = canvas.toDataURL('image/png');
    const time = videoRef.current.currentTime.toFixed(2);
    setScreenshots(prev => [...prev, { url, time }]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Screenshot</h1>
        <p className="text-neutral-500 text-center mb-8">Capture screenshots from video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && (
            <div className="space-y-3">
              <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />
              <button onClick={capture} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Capture Screenshot</button>
            </div>
          )}
          {screenshots.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{screenshots.length} screenshot(s) captured</p>
              <div className="grid grid-cols-2 gap-3">
                {screenshots.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <img src={s.url} className="w-full rounded" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-500">At {s.time}s</span>
                      <a href={s.url} download={"screenshot-" + s.time + ".png"} className="text-xs text-indigo-400 hover:text-indigo-300">Download</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Screenshot</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Screenshot is a free online tool that allows you to capture and extract frames from any video instantly without downloading software. Simply upload your video, select the frame you want, and download your screenshot in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Screenshot</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your video file by clicking the upload button or dragging and dropping a video onto the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the video player controls to navigate to the exact frame you want to capture as a screenshot</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the screenshot button to capture the current frame from the video player</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your screenshot image to your device in your preferred format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Screenshot support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Screenshot supports all major video formats including MP4, AVI, MOV, MKV, FLV, WMV, and WebM formats.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading videos?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">While most browsers can handle videos up to several gigabytes, we recommend keeping videos under 2GB for optimal performance.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I edit the screenshot after capturing it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Screenshot focuses on capturing frames, but you can use any image editor to further enhance or edit your downloaded screenshot.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my videos after I use the tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all videos and screenshots are processed locally in your browser and are not stored on our servers for privacy protection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the timeline slider for precise frame selection by clicking and dragging along the video progress bar</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Pause the video before clicking screenshot to ensure you capture the exact moment you want without motion blur</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Try adjusting your browser zoom level if you need to see more detail before capturing your screenshot</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Download screenshots in PNG format for better quality and lossless compression compared to JPEG</li>
          </ul>
        </div>
      </div>
    </div>
  );
}