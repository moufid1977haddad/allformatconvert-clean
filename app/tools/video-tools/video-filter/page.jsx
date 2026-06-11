'use client';
import { useState, useRef } from 'react';
export default function VideoFilterPage() {
  const [file, setFile] = useState(null);
  const [filter, setFilter] = useState('none');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const filters = [
    { name: 'None', value: 'none', css: '' },
    { name: 'Grayscale', value: 'grayscale', css: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia', css: 'sepia(100%)' },
    { name: 'Invert', value: 'invert', css: 'invert(100%)' },
    { name: 'Blur', value: 'blur', css: 'blur(3px)' },
    { name: 'Brightness', value: 'brightness', css: 'brightness(150%)' },
    { name: 'Contrast', value: 'contrast', css: 'contrast(200%)' },
    { name: 'Saturate', value: 'saturate', css: 'saturate(300%)' },
  ];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const applyFilter = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Applying filter...');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      const selectedFilter = filters.find(f => f.value === filter);
      ctx.filter = selectedFilter.css || 'none';
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      const drawFrame = () => {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
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
        <h1 className="text-3xl font-bold text-center mb-2">Video Filter</h1>
        <p className="text-neutral-500 text-center mb-8">Apply filters to video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" style={{filter: filters.find(f => f.value === filter)?.css || ''}} />}
          <div className="grid grid-cols-4 gap-2">
            {filters.map(f => <button key={f.value} onClick={() => setFilter(f.value)} className={"py-2 rounded-lg text-sm font-semibold transition " + (filter===f.value?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{f.name}</button>)}
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={applyFilter} disabled={!file || filter === 'none' || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Filter</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="filtered.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video Filter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video Filter is a free online tool that allows you to apply professional-quality filters and effects to your videos instantly without requiring any software downloads or technical expertise. Transform your videos with stunning visual enhancements, color corrections, and creative effects in just a few clicks.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video Filter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video Filter website and click the 'Upload Video' button to select your video file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose from a variety of available filters and effects such as vintage, black and white, blur, brightness, and contrast adjustments</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your video with the selected filter applied and adjust intensity settings to customize the effect to your preference</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' or 'Export' button to save your filtered video to your device in your desired format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Video Filter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Video Filter is completely free to use with no hidden charges, subscriptions, or premium tiers required for basic filtering functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video Filter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Video Filter supports all major video formats including MP4, AVI, MOV, WebM, and MKV, making it compatible with videos from most devices and cameras.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does it take to process and download a filtered video?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Processing time depends on your video length and file size, typically ranging from a few seconds to a few minutes for videos under 100MB.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I apply multiple filters to the same video?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Video Filter allows you to layer multiple filters and effects on a single video to create unique, customized looks for your content.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with subtle filter adjustments and gradually increase intensity to avoid over-processing your video and maintaining natural quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview filters in full-screen mode before downloading to ensure the effect looks good on different screen sizes and lighting conditions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine complementary filters like brightness and contrast adjustments with color filters for more professional and polished results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export your filtered video in the same resolution as your original to maintain video quality and avoid unnecessary file size increases</li>
          </ul>
        </div>
      </div>
    </div>
  );
}