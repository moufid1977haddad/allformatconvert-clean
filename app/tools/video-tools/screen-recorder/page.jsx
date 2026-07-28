'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ScreenRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const preview = useRef(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (preview.current) preview.current.srcObject = stream;
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      setVideoUrl(URL.createObjectURL(blob));
      if (preview.current) preview.current.srcObject = null;
      stream.getTracks().forEach(t => t.stop());
    };
    stream.getVideoTracks()[0].onended = () => stop();
    mediaRecorder.current.start();
    setRecording(true);
    setDuration(0);
    timer.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stop = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') mediaRecorder.current.stop();
    setRecording(false);
    clearInterval(timer.current);
  };

  const fmt = (s) => Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Screen Recorder</h1>
        <p className="text-neutral-500 text-center mb-8">Record your screen directly in the browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          {recording && <video ref={preview} autoPlay muted className="w-full rounded-xl bg-neutral-800" />}
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono">{fmt(duration)}</div>
            <div className="flex gap-4 justify-center">
              {!recording ? (
                <button onClick={start} className="bg-red-600 hover:bg-red-500 rounded-xl px-8 py-3 font-semibold transition">Start Recording</button>
              ) : (
                <button onClick={stop} className="bg-neutral-200 hover:bg-neutral-200 rounded-xl px-8 py-3 font-semibold transition">Stop Recording</button>
              )}
            </div>
          </div>
          {videoUrl && (
            <div className="space-y-3">
              <video controls src={videoUrl} className="w-full rounded-xl" />
              <a href={videoUrl} download="recording.webm" className="block w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-center">Download Recording</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Screen Recorder"
        description="Screen Recorder captures your screen, window, or browser tab using the browser's built-in screen-sharing and MediaRecorder APIs — entirely client-side, with no software installation. Recordings are saved as a WebM video file."
        howTo={[
          "Click \"Start Recording\" and choose which screen, window, or tab to share when your browser prompts you.",
          "Perform the actions you want to record while the live preview plays.",
          "Click \"Stop Recording\" when you're finished.",
          "Preview the result, then click \"Download Recording\" to save it as a WebM file."
        ]}
        faqs={[
          { q: "What video format do recordings download as?", a: "Always WebM (.webm) — there's no option to export as MP4 or other formats directly." },
          { q: "Is Screen Recorder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it record audio?", a: "It can capture audio from the screen or tab you're sharing if your browser and the shared source support it — it does not separately capture your microphone." },
          { q: "Is my recording uploaded anywhere?", a: "No, recording happens entirely through your browser's native screen-capture and MediaRecorder APIs — nothing is uploaded to a server." }
        ]}
        tips={[
          "Choose \"Chrome Tab\" instead of your whole screen when recording to also capture that tab's audio, if your browser supports it.",
          "Close unnecessary tabs and apps before recording for smoother performance.",
          "If you need MP4 instead of WebM, convert the downloaded file afterward with a dedicated video converter.",
          "Recording also stops if you stop sharing from the browser's own sharing indicator, not just the \"Stop Recording\" button."
        ]}
      />
    </div>
  );
}