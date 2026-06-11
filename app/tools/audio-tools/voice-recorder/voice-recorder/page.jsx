'use client';
import { useState, useRef } from 'react';
export default function VoiceRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.current.start();
    setRecording(true);
    setDuration(0);
    timer.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stop = () => {
    mediaRecorder.current.stop();
    setRecording(false);
    clearInterval(timer.current);
  };

  const fmt = (s) => Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Voice Recorder</h1>
        <p className="text-neutral-500 text-center mb-8">Record voice from your microphone</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6 text-center">
          <div className="text-6xl font-mono">{fmt(duration)}</div>
          {recording && <div className="flex justify-center gap-2">{[...Array(5)].map((_,i) => <div key={i} className="w-2 bg-red-500 rounded animate-bounce" style={{height: Math.random()*40+10+'px', animationDelay: i*0.1+'s'}}></div>)}</div>}
          <div className="flex gap-4 justify-center">
            {!recording ? (
              <button onClick={start} className="bg-red-600 hover:bg-red-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl transition">🎙️</button>
            ) : (
              <button onClick={stop} className="bg-neutral-200 hover:bg-neutral-200 rounded-full w-16 h-16 flex items-center justify-center text-2xl transition">⏹️</button>
            )}
          </div>
          {audioUrl && (
            <div className="space-y-3">
              <audio controls src={audioUrl} className="w-full" />
              <a href={audioUrl} download="recording.webm" className="block w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download Recording</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Voice Recorder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Voice Recorder is a free online tool that allows you to easily record, save, and share audio directly from your browser without any software installation. Perfect for capturing ideas, interviews, music, and voice memos with crystal-clear quality.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Voice Recorder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Click the record button to start capturing audio from your microphone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Speak clearly into your microphone or play audio you want to record</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the stop button when you're finished recording your audio</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your recording as an MP3 or WAV file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Voice Recorder free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Voice Recorder is completely free with no hidden fees or premium subscriptions required to access all features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use Voice Recorder?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Voice Recorder is a web-based tool that works directly in your browser, so no installation or downloads are necessary.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats can I download?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can download your recordings in MP3 and WAV formats, which are compatible with all devices and audio players.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my recorded audio private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your recordings are stored securely and you have full control over your files. You can delete them anytime.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your microphone before recording to ensure optimal audio quality and volume levels</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use a quiet environment and minimize background noise for clearer, more professional recordings</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your browser tab open during recording to avoid interruptions or accidental stops</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Name your files descriptively before downloading to easily organize and find your recordings later</li>
          </ul>
        </div>
      </div>
    </div>
  );
}