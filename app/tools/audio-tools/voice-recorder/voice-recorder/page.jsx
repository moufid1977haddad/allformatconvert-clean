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
    </div>
  );
}