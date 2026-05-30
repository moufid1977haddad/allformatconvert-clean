'use client';
import { useState, useRef } from 'react';
export default function AudioTrimmerPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const audio = document.createElement('audio');
    audio.onloadedmetadata = () => { setDuration(Math.floor(audio.duration)); setEnd(Math.floor(audio.duration)); };
    audio.src = url;
  };

  const trim = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const sampleRate = buffer.sampleRate;
      const startSample = start * sampleRate;
      const endSample = end * sampleRate;
      const length = endSample - startSample;
      const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
      const trimBuffer = offlineCtx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0).slice(startSample, endSample);
      trimBuffer.getChannelData(0).set(data);
      const source = offlineCtx.createBufferSource();
      source.buffer = trimBuffer;
      source.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const rdata = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + rdata.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+rdata.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,rdata.length*2,true);
      let o = 44;
      for (let i = 0; i < rdata.length; i++) { const s = Math.max(-1,Math.min(1,rdata[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Trimmer</h1>
        <p className="text-neutral-500 text-center mb-8">Trim and cut audio files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-500 mb-1">Start: {start}s</label><input type="range" min="0" max={duration-1} value={start} onChange={e => setStart(parseInt(e.target.value))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">End: {end}s</label><input type="range" min="1" max={duration} value={end} onChange={e => setEnd(parseInt(e.target.value))} className="w-full" /></div>
            </div>
          )}
          <button onClick={trim} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Trimming...' : 'Trim Audio (' + (end-start) + 's)'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="trimmed.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}