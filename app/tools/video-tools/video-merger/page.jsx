'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { videoReRecordSupport, finishRecording } from '../../../lib/mediaSupport';
export default function VideoMergerPage() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [supportReason, setSupportReason] = useState('');
  // Checked on mount so the visitor learns BEFORE running anything.
  useEffect(() => { setSupportReason(videoReRecordSupport().reason); }, []);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) return;
    setError('');
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
      const videoStream = canvas.captureStream(30);
      // The sound of every clip goes through Web Audio into the recording (28/09/2026: the merged file had no
      // sound at all, and Firefox never finished -- its recorder waits forever for the audio track that
      // "video/webm;codecs=vp8,opus" promises when the stream has none).
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      const audioOut = audioContext.createMediaStreamDestination();
      for (const v of videos) audioContext.createMediaElementSource(v).connect(audioOut);
      if (audioContext.state === 'suspended') await audioContext.resume();
      const stream = new MediaStream([...videoStream.getVideoTracks(), ...audioOut.stream.getAudioTracks()]);
      const support = videoReRecordSupport();
      if (!support.ok) throw new Error(support.reason);
      const recorder = new MediaRecorder(stream, { mimeType: support.mime });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        try {
          const { blob, ext } = finishRecording(chunks, recorder, support.mime);
          setResult({ url: URL.createObjectURL(blob), ext });
        } catch (e) { setError(e.message); }
        setStatus('');
        audioContext.close().catch(() => {});
      };
      recorder.onerror = () => { setError('Recording failed in this browser.'); setStatus(''); };
      recorder.start();
      for (const video of videos) {
        await video.play();
        await new Promise(resolve => {
          // Fitted, not stretched: a clip of another shape keeps its proportions, with black bars.
          const k = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
          const w = video.videoWidth * k, h = video.videoHeight * k;
          const draw = () => {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
            if (!video.ended) requestAnimationFrame(draw);
            else resolve();
          };
          draw();
        });
        video.pause();
      }
      recorder.stop();
    } catch(e) { setError('Error: ' + e.message); setStatus(''); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge multiple videos into one</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add video files</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} multiple className="hidden" onChange={handleFiles} />
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
          {supportReason && <p role="alert" className="text-red-500 text-center text-sm">{supportReason}</p>}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          <button onClick={merge} disabled={files.length < 2 || !!status || !!supportReason} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Merge Videos</button>
          {result && <div className="space-y-2"><video controls src={result.url} className="w-full rounded-xl" /><a href={result.url} download={`merged.${result.ext}`} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Video Merger"
        description="Video Merger plays your videos back-to-back onto a canvas and records the result as one file, entirely in your browser. The sound of each clip is kept. Note: the output is the format your browser records (WebM in Chrome, Edge and Firefox; MP4 in Safari), made in real time (a 1-minute result takes about a minute); videos merge in the order you added them, at the first video's dimensions — a clip of another shape keeps its proportions, with black bars."
        howTo={[
          "Click the upload area and add two or more video files — they'll merge in the order you add them.",
          "Review the list and remove any you don't want.",
          "Click \"Merge Videos\" — each video plays through in sequence while the combined result is recorded.",
          "Preview and download the merged file (WebM, or MP4 in Safari)."
        ]}
        faqs={[
          { q: "Can I reorder videos before merging?", a: "Not currently — they merge in the order they were added; remove and re-add files if you need a different order." },
          { q: "Does the merged video have audio?", a: "Yes: the sound of each clip is recorded with its pictures." },
          { q: "What if my videos have different resolutions?", a: "The result has the first video's dimensions; a clip of another shape keeps its proportions, with black bars (letterboxed), never stretched." },
          { q: "Is my file uploaded anywhere?", a: "No, merging happens entirely in your browser." }
        ]}
        tips={[
          "Merge videos with matching resolution and aspect ratio for the cleanest-looking result.",
          "Merging takes roughly as long as the combined duration of all your clips, since each one plays through in full.",
          "Each clip keeps its own sound; if a clip is silent, that part of the result is silent too.",
          "Keep the browser tab active and visible while merging, since the videos need to actually play for the canvas to capture them."
        ]}
      />
    </div>
  );
}