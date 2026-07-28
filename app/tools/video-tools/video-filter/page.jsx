'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      <SeoContent
        title="Video Filter"
        description="Video Filter applies one visual effect (Grayscale, Sepia, Invert, Blur, Brightness, Contrast, or Saturate) to your video by redrawing each frame on a canvas and re-recording it, entirely in your browser. Note: the output is always WebM and has no audio, since canvas recordings don't carry sound; only one filter can be active at a time, each at a fixed intensity."
        howTo={[
          "Click the upload area and select a video file.",
          "Click one of the 8 filter buttons to preview it live on the video player.",
          "Click \"Apply Filter\" — the video plays through once while the filtered version is recorded.",
          "Preview and download the filtered WebM file."
        ]}
        faqs={[
          { q: "Can I combine multiple filters?", a: "No, only one filter can be applied at a time — selecting a new one replaces the previous choice." },
          { q: "Can I adjust filter intensity?", a: "Not currently — each filter uses a fixed preset value (e.g., Blur is always 3px, Contrast is always 200%)." },
          { q: "Does the output have sound?", a: "No — filtering re-records the video through a canvas, and canvas recordings never include audio, so the filtered result is silent." },
          { q: "Is my file uploaded anywhere?", a: "No, filtering happens entirely in your browser." }
        ]}
        tips={[
          "Preview the filter on the live player (it updates instantly) before committing to the longer \"Apply Filter\" render step.",
          "Since output has no audio, only use this on videos where sound doesn't matter, or re-add audio afterward with an editing tool.",
          "Applying a filter takes as long as the video's full duration, since frames are captured in real time as it plays.",
          "Trim your video first if you only need a filtered clip from a longer video, to reduce processing time."
        ]}
      />
    </div>
  );
}