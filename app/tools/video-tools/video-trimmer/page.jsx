'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function VideoTrimmerPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.onloadedmetadata = () => {
        setDuration(Math.floor(videoRef.current.duration));
        setEnd(Math.floor(videoRef.current.duration));
      };
    }
  };

  const trim = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Trimming...');
    try {
      const stream = videoRef.current.captureStream();
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult(URL.createObjectURL(blob));
        setStatus('');
      };
      videoRef.current.currentTime = start;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, (end - start) * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Trimmer</h1>
        <p className="text-neutral-500 text-center mb-8">Trim and cut video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-500 mb-1">Start: {start}s</label><input type="range" min="0" max={duration-1} value={start} onChange={e => setStart(parseInt(e.target.value))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">End: {end}s</label><input type="range" min="1" max={duration} value={end} onChange={e => setEnd(parseInt(e.target.value))} className="w-full" /></div>
            </div>
          )}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={trim} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Trim Video ({end-start}s)</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="trimmed.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Video Trimmer"
        description="Video Trimmer cuts a section from your video by playing it and re-recording just that range using the browser's native MediaRecorder API, entirely client-side. Output is always WebM. Note: since trimming works by playing through the selected range in real time, processing takes as long as the trimmed clip's duration, not the length of your original file."
        howTo={[
          "Click the upload area and select a video file.",
          "Use the Start and End sliders to set the section you want to keep.",
          "Click \"Trim Video\" — the selected range plays through once while it's recorded.",
          "Preview and download the trimmed WebM file."
        ]}
        faqs={[
          { q: "Does trimming preserve the exact original quality?", a: "Not quite — the clip is re-encoded through the browser's WebM encoder rather than cut losslessly." },
          { q: "What output format do I get?", a: "Always WebM, regardless of your original file's format." },
          { q: "Is audio preserved?", a: "Yes, audio is captured along with the video track." },
          { q: "Is my file uploaded anywhere?", a: "No, trimming happens entirely in your browser." }
        ]}
        tips={[
          "Trimming takes about as long as your selected clip's duration, since it plays through in real time while recording — a 30-second trim takes about 30 seconds.",
          "Keep the browser tab open and active while trimming, since the video needs to actively play for the recording to capture it.",
          "Preview your start and end points on the full video before trimming to avoid re-doing the process.",
          "If you need a format other than WebM, convert the trimmed result afterward with a dedicated converter."
        ]}
      />
    </div>
  );
}