'use client';
import { useState, useRef } from 'react';
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Screen Recorder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Screen Recorder is a free online tool that allows you to capture video recordings of your screen activity without downloading any software or creating an account. Perfect for creating tutorials, presentations, gameplay videos, and technical demonstrations with high-quality output.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Screen Recorder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Click the 'Start Recording' button to begin capturing your screen activity in real-time.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select the portion of your screen you want to record or choose full-screen recording from the options.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Perform the actions you want to record and click 'Stop Recording' when finished.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your recorded video file or share it directly to your preferred platform.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Screen Recorder free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Screen Recorder is completely free with no hidden fees, subscriptions, or premium features required to record and download videos.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use Screen Recorder?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Screen Recorder is web-based and works directly in your browser without any downloads or installations needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats can I download?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Screen Recorder supports popular video formats including MP4, WebM, and other common formats compatible with most devices and platforms.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I record audio along with my screen?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Screen Recorder can capture both system audio and microphone input simultaneously for complete multimedia recordings.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Close unnecessary browser tabs and applications before recording to ensure smooth performance and faster file processing.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your audio levels and microphone settings before starting your main recording to avoid quality issues.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use keyboard shortcuts to pause and resume recording, which helps reduce unnecessary footage and saves editing time later.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Record in a quiet environment and ensure good lighting if using your webcam to enhance the overall quality of your screen recording.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}