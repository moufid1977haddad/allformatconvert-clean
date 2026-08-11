'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function VoiceRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [wavUrl, setWavUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const blobRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.current.start();
      setRecording(true);
      setAudioUrl(null);
      setWavUrl(null);
      setError('');
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

  const encodeWav = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;
    const blockAlign = numChannels * 2;
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return buffer;
  };

  const exportWav = async () => {
    if (!blobRef.current) return;
    setConverting(true);
    setError('');
    try {
      const arrayBuffer = await blobRef.current.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      ctx.close();
      const wavBuffer = encodeWav(audioBuffer);
      setWavUrl(URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' })));
    } catch (e) {
      setError('WAV conversion failed: ' + e.message);
    }
    setConverting(false);
  };

  const downloadWav = () => {
    const a = document.createElement('a');
    a.href = wavUrl;
    a.download = 'recording.wav';
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
              <div className="grid grid-cols-2 gap-3">
                <button onClick={download} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download WebM</button>
                <button onClick={exportWav} disabled={converting} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-2 font-semibold transition">
                  {converting ? 'Converting...' : 'Export as WAV'}
                </button>
              </div>
              {wavUrl && (
                <button onClick={downloadWav} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download WAV</button>
              )}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Voice Recorder"
        description="Voice Recorder captures audio from your microphone directly in your browser using the MediaRecorder API — nothing is uploaded to a server. Recordings are saved as WebM by default, and can also be converted and downloaded as a standard WAV file using the Web Audio API entirely on your device."
        howTo={[
          "Click \"Start Recording\" and allow microphone access if prompted.",
          "Speak into your microphone — the indicator pulses red while recording.",
          "Click \"Stop Recording\" when you're finished.",
          "Download the recording as WebM directly, or click \"Export as WAV\" to convert it and download a WAV file instead."
        ]}
        faqs={[
          { q: "What audio format do recordings download as?", a: "Recordings are captured as WebM by default. Click \"Export as WAV\" to decode and re-encode the recording as a standard WAV file, then download it separately." },
          { q: "Is Voice Recorder free to use?", a: "Yes, it's completely free with no signup and no limit on how many recordings you can make." },
          { q: "Do I need to install anything?", a: "No, it works directly in your browser as long as you grant microphone access." },
          { q: "Is my recording private?", a: "Yes. Recording and WAV conversion both happen entirely on your device via the browser's MediaRecorder and Web Audio APIs — audio is never uploaded to a server unless you choose to share the downloaded file yourself." }
        ]}
        tips={[
          "Record in a quiet space and keep the microphone 6–12 inches from your mouth for clearer audio.",
          "Use \"Export as WAV\" if you need an uncompressed, universally compatible format instead of WebM.",
          "Download your recording promptly after stopping — refreshing the page will lose it since nothing is saved automatically.",
          "If you accidentally deny microphone permission, you'll need to reset the site's microphone permission in your browser settings to try again."
        ]}
      />
    </div>
  );
}
