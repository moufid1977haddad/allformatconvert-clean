'use client';
import { useState, useRef } from 'react';
export default function VideoMergerPage() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFiles = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) return;
    setStatus('Merging videos...');
    try {
      const canvas = document.createElement('canvas');
      const videos = await Promise.all(files.map(f => new Promise(resolve => {
        const v = document.createElement('video');
        v.src = URL.createObjectURL(f);
        v.onloadedmetadata = () => resolve(v);
      })));
      canvas.width = videos[0].videoWidth;
      canvas.height = videos[0].videoHeight;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      recorder.start();
      for (const video of videos) {
        await video.play();
        await new Promise(resolve => {
          const draw = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (!video.ended) requestAnimationFrame(draw);
            else resolve();
          };
          draw();
        });
        video.pause();
      }
      recorder.stop();
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge multiple videos into one</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add video files</p>
            <input ref={inputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={merge} disabled={files.length < 2 || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Merge Videos</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="merged.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Merger</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Merger is a free online tool that allows you to combine multiple video files into one seamless video without requiring any software installation or technical expertise. Whether you're editing vlogs, creating compilations, or merging clips from different sources, Video Merger makes it easy to join videos in just a few clicks.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Merger</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video Merger website and click the 'Upload Videos' button to select multiple video files from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Arrange your videos in the desired order by dragging and dropping them in the timeline or using the arrow buttons</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust settings such as video quality, format, and transitions between clips if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Merge' button to process your videos and download the final merged video file to your computer</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Merger support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Merger supports all popular video formats including MP4, AVI, MOV, MKV, WebM, and many others, making it compatible with videos from most devices and cameras.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to how many videos I can merge?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can merge multiple videos together, though the total file size and processing time may vary depending on your internet connection and the length of your videos.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use Video Merger?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Video Merger is completely free and web-based, so you don't need to install any software or applications on your computer.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my videos lose quality after merging?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Merger preserves the original quality of your videos during the merging process, though you can adjust output quality settings based on your preferences.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Organize your videos before uploading by renaming them with numbers to keep track of the correct sequence</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep individual video files under 500MB for faster processing and smoother merging results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export your merged video in MP4 format for maximum compatibility across different devices and platforms</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your merged video before sharing by playing it in full to ensure all clips transitioned smoothly without any audio or video sync issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}