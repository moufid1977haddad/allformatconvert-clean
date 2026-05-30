'use client';
import { useState, useRef, useEffect } from 'react';
export default function AudioWaveformPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveform, setWaveform] = useState([]);
  const inputRef = useRef();
  const canvasRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const audioCtx = new AudioContext();
    const arrayBuffer = await f.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const samples = 200;
    const blockSize = Math.floor(data.length / samples);
    const waveData = [];
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) sum += Math.abs(data[i * blockSize + j]);
      waveData.push(sum / blockSize);
    }
    const max = Math.max(...waveData);
    setWaveform(waveData.map(v => v / max));
  };

  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, w, h);
    const barWidth = w / waveform.length;
    waveform.forEach((v, i) => {
      const barH = v * h * 0.8;
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(i * barWidth, (h - barH) / 2, barWidth - 1, barH);
    });
  }, [waveform]);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Waveform</h1>
        <p className="text-neutral-500 text-center mb-8">Visualize audio waveform</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {waveform.length > 0 && (
            <div className="space-y-3">
              <canvas ref={canvasRef} width={800} height={200} className="w-full rounded-xl" />
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}