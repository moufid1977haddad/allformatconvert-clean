'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function VoiceRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.current.start();
      setRecording(true);
      setAudioUrl(null);
    } catch(e) {
      setError('Microphone access denied: ' + e.message);
    }
  };

  const stop = () => {
    mediaRecorder.current.stop();
    mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'recording.webm';
    a.click();
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Voice Recorder</h1>
        <p className="text-neutral-500 text-center mb-8">Record voice from your microphone</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition ${recording ? 'bg-red-100 animate-pulse' : 'bg-indigo-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-10 h-10 ${recording ? 'text-red-500' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          {recording && <p className="text-red-500 font-medium animate-pulse">Recording...</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-center">
            {!recording ? (
              <button onClick={start} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-3 font-semibold transition">Start Recording</button>
            ) : (
              <button onClick={stop} className="bg-red-500 hover:bg-red-400 text-white rounded-xl px-6 py-3 font-semibold transition">Stop Recording</button>
            )}
          </div>
          {audioUrl && (
            <div className="space-y-3">
              <audio controls src={audioUrl} className="w-full" />
              <button onClick={download} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Recording</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Voice Recorder"
        description="Voice Recorder captures audio from your microphone directly in your browser using the MediaRecorder API — nothing is uploaded to a server. Recordings are saved as a WebM audio file, which you can preview and download instantly."
        howTo={[
          "Click \"Start Recording\" and allow microphone access if prompted.",
          "Speak into your microphone — the indicator pulses red while recording.",
          "Click \"Stop Recording\" when you're finished.",
          "Preview the recording, then click \"Download Recording\" to save it as a WebM file."
        ]}
        faqs={[
          { q: "What audio format do recordings download as?", a: "Always WebM (.webm) — the tool doesn't offer MP3, WAV, or OGG export directly." },
          { q: "Is Voice Recorder free to use?", a: "Yes, it's completely free with no signup and no limit on how many recordings you can make." },
          { q: "Do I need to install anything?", a: "No, it works directly in your browser as long as you grant microphone access." },
          { q: "Is my recording private?", a: "Yes. Recording happens entirely on your device via the browser's MediaRecorder API — audio is never uploaded to a server unless you choose to share the downloaded file yourself." }
        ]}
        tips={[
          "Record in a quiet space and keep the microphone 6–12 inches from your mouth for clearer audio.",
          "If you need MP3 or WAV instead of WebM, convert the downloaded file afterward with the Audio Converter tool.",
          "Download your recording promptly after stopping — refreshing the page will lose it since nothing is saved automatically.",
          "If you accidentally deny microphone permission, you'll need to reset the site's microphone permission in your browser settings to try again."
        ]}
      />
    </div>
  );
}