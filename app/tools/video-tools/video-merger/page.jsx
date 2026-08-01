'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function VideoMergerPage() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) return;
    setStatus('Merging videos...');
    try {
      const canvas = document.createElement('canvas');
      const videos = await Promise.all(files.map(f => new Promise((resolve, reject) => {
        const v = document.createElement('video');
        v.onloadedmetadata = () => resolve(v);
        v.onerror = () => reject(new Error(`Failed to load video: ${f.name}`));
        v.src = URL.createObjectURL(f);
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
      <SeoContent
        title="Video Merger"
        description="Video Merger plays your videos back-to-back onto a canvas and records the result as one file, entirely in your browser. Note: the output is always WebM and has no audio, since canvas recordings don't carry sound; videos merge in the order you added them, and all clips are drawn at the first video's dimensions — later videos with a different aspect ratio will be stretched to fit."
        howTo={[
          "Click the upload area and add two or more video files — they'll merge in the order you add them.",
          "Review the list and remove any you don't want.",
          "Click \"Merge Videos\" — each video plays through in sequence while the combined result is recorded.",
          "Preview and download the merged WebM file."
        ]}
        faqs={[
          { q: "Can I reorder videos before merging?", a: "Not currently — they merge in the order they were added; remove and re-add files if you need a different order." },
          { q: "Does the merged video have audio?", a: "No — since merging works by drawing frames to a canvas, and canvas recordings never carry audio, the output is silent." },
          { q: "What if my videos have different resolutions?", a: "All videos are drawn at the first video's dimensions, so later clips with a different aspect ratio will appear stretched rather than letterboxed." },
          { q: "Is my file uploaded anywhere?", a: "No, merging happens entirely in your browser." }
        ]}
        tips={[
          "Merge videos with matching resolution and aspect ratio for the cleanest-looking result.",
          "Merging takes roughly as long as the combined duration of all your clips, since each one plays through in full.",
          "Since output has no audio, add a soundtrack afterward with a dedicated video editor if you need sound.",
          "Keep the browser tab active and visible while merging, since the videos need to actually play for the canvas to capture them."
        ]}
      />
    </div>
  );
}