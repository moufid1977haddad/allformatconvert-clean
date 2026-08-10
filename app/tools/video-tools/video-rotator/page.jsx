'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function VideoRotatorPage() {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState(90);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();
  const audioGraphRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
  };

  useEffect(() => {
    // videoRef.current is only guaranteed to exist after this render commits
    // (the <video> element only mounts once `file` is set), so the src must
    // be assigned here rather than inline in handleFile — otherwise the very
    // first file selection silently fails to load since the ref is still null.
    if (file && videoRef.current) videoRef.current.src = URL.createObjectURL(file);
  }, [file]);

  // createMediaElementSource() can only be called once per <video> element,
  // so the Web Audio graph (context, source, and stream destination) is
  // built once and cached — a second "Rotate Video" click on the same video
  // would otherwise throw InvalidStateError. The source is connected to both
  // the stream destination (for recording) and audioContext.destination (so
  // the preview stays audible during processing, since routing an element
  // through Web Audio detaches it from its default audio output).
  const getAudioTrack = () => {
    try {
      if (!audioGraphRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioCtx();
        const destination = audioContext.createMediaStreamDestination();
        const source = audioContext.createMediaElementSource(videoRef.current);
        source.connect(destination);
        source.connect(audioContext.destination);
        audioGraphRef.current = { audioContext, destination };
      }
      if (audioGraphRef.current.audioContext.state === 'suspended') {
        audioGraphRef.current.audioContext.resume();
      }
      return audioGraphRef.current.destination.stream.getAudioTracks()[0] || null;
    } catch (e) { return null; }
  };

  const rotate = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Rotating...');
    try {
      const canvas = document.createElement('canvas');
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      if (angle === 90 || angle === 270) { canvas.width = vh; canvas.height = vw; }
      else { canvas.width = vw; canvas.height = vh; }
      const ctx = canvas.getContext('2d');
      const videoStream = canvas.captureStream(30);
      const audioTrack = getAudioTrack();
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...(audioTrack ? [audioTrack] : []),
      ]);
      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(angle * Math.PI / 180);
        ctx.drawImage(videoRef.current, -vw/2, -vh/2, vw, vh);
        ctx.restore();
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
        <h1 className="text-3xl font-bold text-center mb-2">Video Rotator</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={"px-4 py-2 rounded-lg font-semibold transition " + (angle===a?'bg-indigo-600 text-white':'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800')}>{a}°</button>)}</div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={rotate} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Rotate Video</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="rotated.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Video Rotator"
        description="Video Rotator rotates your video by 90°, 180°, or 270° by redrawing each frame on a rotated canvas and recording the result, entirely in your browser. The original audio is preserved by routing it through the Web Audio API alongside the rotated video track, so the output isn't silent. Note: the output is always WebM, and only these three fixed angles are available — there's no custom-angle option."
        howTo={[
          "Click the upload area and select a video file.",
          "Click 90°, 180°, or 270° to choose your rotation angle.",
          "Click \"Rotate Video\" — the video plays through once while the rotated version (with its original audio) is recorded.",
          "Preview and download the rotated WebM file."
        ]}
        faqs={[
          { q: "Can I rotate by a custom angle?", a: "Not currently — only 90°, 180°, and 270° are available." },
          { q: "Does the rotated video have audio?", a: "Yes — the source video's original audio is captured alongside the rotated picture and included in the output unchanged." },
          { q: "Does rotating reduce quality?", a: "Yes, some — the video is re-encoded through the canvas and MediaRecorder, so it isn't a lossless operation." },
          { q: "Is my file uploaded anywhere?", a: "No, rotation happens entirely in your browser." }
        ]}
        tips={[
          "Use 90° to fix a video recorded holding your phone sideways.",
          "The audio is carried straight through unchanged — rotating only affects the picture.",
          "Rotating takes about as long as the video's full duration, since it plays through in real time while recording.",
          "Preview the live player after selecting an angle — it shows the CSS-rotated preview before you commit to the full render."
        ]}
      />
    </div>
  );
}