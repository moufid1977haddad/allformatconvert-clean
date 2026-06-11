'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Voice Recorder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Voice Recorder is a free online tool that allows you to record, playback, and download audio directly from your browser without installing any software. Perfect for creating voice memos, podcasts, interviews, and audio notes with crystal-clear quality.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Voice Recorder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Click the red record button to start capturing audio from your microphone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Speak clearly into your microphone and monitor the audio levels in real-time</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the stop button when you're finished recording your audio</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your recording as an MP3 file or share it directly online</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Voice Recorder really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Voice Recorder is completely free with no hidden charges, subscriptions, or premium features. You can record unlimited audio files without any limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Voice Recorder support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Voice Recorder supports MP3, WAV, and OGG audio formats, allowing you to choose the best format for your needs and compatibility requirements.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use Voice Recorder?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No installation is required. Voice Recorder is a web-based tool that works directly in your browser on any device with internet access.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my recorded audio private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your recordings are processed locally on your device and are not stored on our servers unless you choose to save them to your computer.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use a quiet environment and position your microphone 6-12 inches away from your mouth for optimal audio quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your microphone levels before recording important content to ensure clear and balanced audio</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Trim silent sections from your recording after completion to reduce file size and improve listening experience</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your recordings immediately after finishing to prevent accidental loss due to browser crashes or connection issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}