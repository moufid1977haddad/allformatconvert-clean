'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

const MIN_ZOOM = 1;
const MAX_ZOOM = 200;

export default function AudioWaveformPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState({ zoom: 1, start: 0 });
  const canvasRef = useRef();
  const fileRef = useRef();
  const audioBufferRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startViewStart: 0 });

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setError('');
    try {
      const arrayBuffer = await f.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();
      audioBufferRef.current = audioBuffer;
      setView({ zoom: 1, start: 0 });
    } catch (err) {
      setError('Could not decode audio file: ' + err.message);
      audioBufferRef.current = null;
    }
  };

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const buffer = audioBufferRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!buffer) return;

    const data = buffer.getChannelData(0);
    const totalLength = data.length;
    const viewLength = Math.max(1, Math.floor(totalLength / view.zoom));
    const maxStart = Math.max(0, totalLength - viewLength);
    const start = Math.min(Math.max(0, Math.floor(view.start)), maxStart);
    const step = Math.max(1, Math.floor(viewLength / canvas.width));
    const amp = canvas.height / 2;

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
      let min = 1, max = -1;
      const sampleStart = start + i * step;
      for (let j = 0; j < step; j++) {
        const idx = sampleStart + j;
        if (idx >= totalLength) break;
        const val = data[idx] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      if (min > max) { min = 0; max = 0; }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();
  }, [view]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      const buffer = audioBufferRef.current;
      if (!buffer) return;
      e.preventDefault();
      const totalLength = buffer.getChannelData(0).length;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      setView(prev => {
        const factor = e.deltaY < 0 ? 1.25 : 0.8;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor));
        const prevViewLength = totalLength / prev.zoom;
        const cursorSample = prev.start + (mouseX / canvas.width) * prevViewLength;
        const newViewLength = totalLength / newZoom;
        const maxStart = Math.max(0, totalLength - newViewLength);
        const newStart = Math.min(Math.max(0, cursorSample - (mouseX / canvas.width) * newViewLength), maxStart);
        return { zoom: newZoom, start: newStart };
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e) => {
    if (!audioBufferRef.current) return;
    dragRef.current = { dragging: true, startX: e.clientX, startViewStart: view.start };
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.dragging) return;
    const buffer = audioBufferRef.current;
    const canvas = canvasRef.current;
    if (!buffer || !canvas) return;
    const totalLength = buffer.getChannelData(0).length;
    const viewLength = totalLength / view.zoom;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaSamples = (deltaX / canvas.width) * viewLength;
    const maxStart = Math.max(0, totalLength - viewLength);
    const newStart = Math.min(Math.max(0, dragRef.current.startViewStart - deltaSamples), maxStart);
    setView(prev => ({ ...prev, start: newStart }));
  };

  const stopDrag = () => { dragRef.current.dragging = false; };

  const resetZoom = () => setView({ zoom: 1, start: 0 });

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, '') || 'waveform') + '-waveform.png';
    a.click();
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
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <canvas
            ref={canvasRef}
            width={800}
            height={200}
            className="w-full rounded-xl border border-neutral-200 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          />
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Scroll to zoom, drag to pan</span>
            <span>Zoom: {view.zoom.toFixed(1)}x</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={resetZoom} disabled={!file} className="w-full bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 rounded-xl py-2 font-semibold transition">Reset Zoom</button>
            <button onClick={downloadPng} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-2 font-semibold transition">Download PNG</button>
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        </div>
      </div>
      <SeoContent
        title="Audio Waveform"
        description="Audio Waveform draws an interactive visual waveform of your audio file directly in your browser using the Web Audio API and canvas — nothing is uploaded to a server. Scroll to zoom in on the waveform and drag to pan across it, then export the current view as a PNG image."
        howTo={[
          "Click the upload area and select an audio file.",
          "The tool decodes the audio and renders its waveform on the canvas automatically.",
          "Scroll over the waveform to zoom in or out, and click-and-drag to pan across it.",
          "Click \"Download PNG\" to save the current waveform view as an image, or \"Reset Zoom\" to return to the full view."
        ]}
        faqs={[
          { q: "Can I zoom or pan the waveform?", a: "Yes — scroll over the canvas to zoom in or out (centered on your cursor), and click-and-drag to pan across the waveform. Use \"Reset Zoom\" to return to the full view." },
          { q: "Can I export or download the waveform image?", a: "Yes — click \"Download PNG\" to save the currently visible waveform (including your current zoom/pan) as a PNG image." },
          { q: "What audio formats are supported?", a: "Any format your browser's Web Audio API can decode, such as MP3, WAV, FLAC, or OGG." },
          { q: "Is my file uploaded anywhere?", a: "No. Decoding and rendering happen entirely in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "Zoom in near a specific moment to inspect individual peaks, clipping, or silence in detail.",
          "The PNG export captures exactly what's on screen, so zoom in first if you need a detailed close-up image.",
          "Use \"Reset Zoom\" any time to quickly get back to the full-length overview.",
          "Very large audio files may take a moment to decode before the waveform appears."
        ]}
      />
    </div>
  );
}
