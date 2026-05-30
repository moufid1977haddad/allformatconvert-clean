'use client';
import { useState, useRef } from 'react';
export default function AudioToTextPage() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef();
  const recognition = useRef(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SR();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
    };
    recognition.current.onerror = (e) => setStatus('Error: ' + e.error);
    recognition.current.start();
    setIsRecording(true);
    setStatus('Listening...');
  };

  const stopRecording = () => {
    if (recognition.current) recognition.current.stop();
    setIsRecording(false);
    setStatus('');
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio to Text</h1>
        <p className="text-neutral-500 text-center mb-8">Transcribe speech to text in real time</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">{isRecording ? '🔴' : '🎙️'}</div>
            {!isRecording ? (
              <button onClick={startRecording} className="bg-red-600 hover:bg-red-500 rounded-xl px-8 py-3 font-semibold transition">Start Transcription</button>
            ) : (
              <button onClick={stopRecording} className="bg-neutral-200 hover:bg-neutral-200 rounded-xl px-8 py-3 font-semibold transition">Stop</button>
            )}
            {status && <p className="text-yellow-400 text-sm">{status}</p>}
          </div>
          {transcript && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={transcript} readOnly />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => navigator.clipboard.writeText(transcript)} className="bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Copy</button>
                <button onClick={() => { const b = new Blob([transcript],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='transcript.txt'; a.click(); }} className="bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</button>
              </div>
            </div>
          )}
          <p className="text-neutral-500 text-xs text-center">Note: Works best in Google Chrome with microphone permission</p>
        </div>
      </div>
    </div>
  );
}