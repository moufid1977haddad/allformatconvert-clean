'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function AudioWaveformPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const canvasRef = useRef();
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const arrayBuffer = await f.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    drawWaveform(audioBuffer);
  };

  const drawWaveform = (audioBuffer) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const val = data[i * step + j] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Waveform</h1>
        <p className="text-neutral-500 text-center mb-8">Visualize your audio waveform</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <canvas ref={canvasRef} width={800} height={200} className="w-full rounded-xl border border-neutral-200" />
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        </div>
      </div>
    </div>
  );
}
