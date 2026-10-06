'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { decodeAnyAudio } from '../../../lib/decodeAudio';
import { AUDIO_ACCEPT, checkedDataURL, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { saveBlob } from '../../../lib/download';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

const MIN_ZOOM = 1;
const MAX_ZOOM = 200;

export default function AudioWaveformPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useToolError('');
  const [view, setView] = useState({ zoom: 1, start: 0 });
  // P24 (03/10): image size, colours and a transparent background (ezgif's waveform: width, height, colours,
  // transparency); the exported PNG is drawn at the chosen size, not copied from the 800-px preview
  const [out, setOut] = useState({ w: 1920, h: 300, wave: '#6366f1', bg: '#f5f5f5', transparent: false });
  const canvasRef = useRef();
  const fileRef = useRef();
  const audioBufferRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startViewStart: 0 });

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; }
    if (!f) return;
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setError('');
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await decodeAnyAudio(f, audioCtx); // ffmpeg.wasm when the browser cannot decode the format
      audioCtx.close();
      audioBufferRef.current = audioBuffer;
      setView({ zoom: 1, start: 0 });
    } catch (err) {
      setError('Could not decode audio file: ' + err.message);
      audioBufferRef.current = null;
    }
  };

  // draws the visible part of the sound on any canvas (the preview, or the export at the chosen size)
  const drawOn = useCallback((canvas, colours) => {
    const buffer = audioBufferRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!colours.transparent) { ctx.fillStyle = colours.bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    if (!buffer) return;

    // Every channel is taken (29/09): only the left one was drawn, so a sound present only on the right channel
    // showed as a flat line. Each column spans the min and max of all channels, as Audacity's and wavesurfer's
    // overview; positive values are drawn upward (they were drawn downward: the picture was upside down).
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
    const totalLength = channels[0].length;
    const viewLength = Math.max(1, Math.floor(totalLength / view.zoom));
    const maxStart = Math.max(0, totalLength - viewLength);
    const start = Math.min(Math.max(0, Math.floor(view.start)), maxStart);
    // P24 review (03/10): each column covers its exact share of the visible samples (fractional bounds). A whole-number
    // step drew only 68 % of the view on a 3000-px export at zoom 20, and ran past it when zoomed further
    const per = viewLength / canvas.width;
    const amp = canvas.height / 2;

    ctx.strokeStyle = colours.wave;
    ctx.lineWidth = Math.max(1, Math.round(canvas.width / 1200));
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
      let min = 1, max = -1;
      const sampleStart = start + Math.floor(i * per);
      const sampleEnd = Math.max(sampleStart + 1, start + Math.floor((i + 1) * per));
      for (const data of channels) {
        for (let idx = sampleStart; idx < sampleEnd; idx++) {
          if (idx >= totalLength) break;
          const val = data[idx] || 0;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
      if (min > max) { min = 0; max = 0; }
      ctx.moveTo(i, (1 - max) * amp);
      ctx.lineTo(i, (1 - min) * amp + 1);
    }
    ctx.stroke();
  }, [view]);
  const drawWaveform = useCallback(() => { if (canvasRef.current) drawOn(canvasRef.current, out); }, [drawOn, out]);

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
    // Never hand over the empty placeholder canvas as if it were a waveform.
    if (!canvas || !audioBufferRef.current) { setError('Load an audio file first — there is no waveform to save yet.'); return; }
    // 30/09: a Blob, not a data: URL (iOS saves nothing from a data: link).
    const big = document.createElement('canvas'); big.width = out.w; big.height = out.h; drawOn(big, out);
    big.toBlob((blob) => {
      if (!blob || !blob.size) { setError('The waveform image could not be made on this device.'); return; }
      saveBlob(blob, (file?.name.replace(/\.[^.]+$/, '') || 'waveform') + '-waveform.png');
    }, 'image/png');
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Waveform</h1>
        <p className="text-neutral-500 text-center mb-8">Visualize your audio waveform</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          {error && <p className="text-red-400 text-center text-sm break-words">{error}</p>}
          <canvas
            ref={canvasRef}
            width={800}
            height={200}
            className="w-full rounded-xl border border-neutral-200 cursor-grab active:cursor-grabbing"
            onPointerDown={handleMouseDown}
            onPointerMove={handleMouseMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
            style={{ touchAction: 'none' }}
          />
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Scroll (or + / −) to zoom, drag to pan — with a finger too</span>
            <span>Zoom: {view.zoom.toFixed(1)}x</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm text-neutral-600" data-wave-options>
              <label>Width<select id="wf-w" value={out.w} onChange={(e) => setOut({ ...out, w: Number(e.target.value) })} className="w-full border border-neutral-200 rounded px-1 py-1 bg-white">{[800, 1200, 1920, 3000].map((v) => <option key={v} value={v}>{v} px</option>)}</select></label>
              <label>Height<select id="wf-h" value={out.h} onChange={(e) => setOut({ ...out, h: Number(e.target.value) })} className="w-full border border-neutral-200 rounded px-1 py-1 bg-white">{[150, 200, 300, 500, 800].map((v) => <option key={v} value={v}>{v} px</option>)}</select></label>
              <label>Wave<input type="color" value={out.wave} onChange={(e) => setOut({ ...out, wave: e.target.value })} className="w-full h-8" aria-label="Wave color" /></label>
              <label>Background<input type="color" value={out.bg} onChange={(e) => setOut({ ...out, bg: e.target.value, transparent: false })} className="w-full h-8" aria-label="Background color" /></label>
              <label className="flex items-center gap-1 sm:pt-5"><input id="wf-transparent" type="checkbox" checked={out.transparent} onChange={(e) => setOut({ ...out, transparent: e.target.checked })} /> Transparent</label>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setView((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, v.zoom * 1.5) }))} disabled={!file} className="w-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-xl py-2 font-semibold">Zoom in +</button>
              <button type="button" onClick={() => setView((v) => ({ ...v, zoom: Math.max(MIN_ZOOM, v.zoom / 1.5) }))} disabled={!file} className="w-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-xl py-2 font-semibold">Zoom out −</button>
            </div>
            <button onClick={resetZoom} disabled={!file} className="w-full bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 rounded-xl py-2 font-semibold transition">Reset Zoom</button>
            <button onClick={downloadPng} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-2 font-semibold transition">Download PNG</button>
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        </div>
      </div>
      <SeoContent
        title="Audio Waveform"
        description={`Audio Waveform draws the sound of one audio file as a waveform built from every channel, so a sound present on one side only is not missed. Scroll or use "Zoom in +" to look closer, up to ${MAX_ZOOM}x, and drag to move along the file with a mouse or a finger. "Download PNG" redraws the part on screen at the size you choose, from 800 to 3000 px wide and 150 to 800 px high, in your wave and background colors or on a transparent background. WMA and AMR files, which browsers cannot decode, are first turned into WAV by ffmpeg.wasm.`}
        howToTitle="How to make a waveform image of an audio file"
        howTo={[
          `Pick or drop an audio file; the waveform appears above the player.`,
          `Scroll over it, or click "Zoom in +" and "Zoom out −"; drag to pan.`,
          `Choose the "Width", "Height", "Wave" and "Background" colors, or tick "Transparent".`,
          `Click "Download PNG" to save the visible part; "Reset Zoom" brings back the whole file.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AC3, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Output format`, value: `PNG` },
          { label: `Image size`, value: `Width 800, 1200, 1920 or 3000 px; height 150, 200, 300, 500 or 800 px` },
          { label: `Zoom`, value: `${MIN_ZOOM}x to ${MAX_ZOOM}x; the scroll wheel zooms around the pointer, the buttons from the left edge of the view` },
        ]}
        privacy={`The audio is decoded in your browser with the Web Audio API, after ffmpeg.wasm has turned any format the browser cannot read into WAV; the waveform and the PNG are drawn on a canvas in the same tab. The audio and the PNG are not sent to any server. Should an error appear, the cleaned message goes to our error log along with the tool name and your browser's name and version.`}
        faqs={[
          { q: `Can I choose the image size and colors?`, a: `Yes: four widths from 800 to 3000 px, five heights from 150 to 800 px, any wave and background color, or a transparent background. The PNG is drawn at that size from the part on screen, not copied from the small preview.` },
          { q: `Can I save a close-up of one moment?`, a: `Yes. Zoom on that moment, then click "Download PNG": only the visible part is drawn, at the full width you chose. "Reset Zoom" brings back the whole file.` },
          { q: `Does it show sound that is on one channel only?`, a: `Yes. Each column of the picture spans the lowest and highest values of all channels together, so a sound on the right channel alone still shows. The two channels are not drawn as separate lanes.` },
          { q: `Can I open WMA or AMR files?`, a: `Yes. Formats your browser cannot decode, such as WMA and AMR, are converted to WAV by ffmpeg.wasm on the page first; the first time takes longer while that engine loads.` },
        ]}
        tips={[
          `Tick "Transparent" to lay the waveform over a video thumbnail or a cover picture.`,
        ]}
      />
    </div>
  );
}
