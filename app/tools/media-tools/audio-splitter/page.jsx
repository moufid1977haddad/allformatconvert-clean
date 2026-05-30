'use client';
import { useState, useRef } from 'react';
export default function AudioSplitterPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [splitAt, setSplitAt] = useState(30);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setParts([]);
    const audioCtx = new AudioContext();
    const ab = await f.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(ab);
    setDuration(Math.floor(buffer.duration));
    setSplitAt(Math.floor(buffer.duration / 2));
  };

  const split = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const sampleRate = buffer.sampleRate;
      const splitSample = splitAt * sampleRate;
      const splitPoints = [0, splitSample, buffer.length];
      const results = [];
      for (let i = 0; i < splitPoints.length - 1; i++) {
        const start = splitPoints[i];
        const end = splitPoints[i+1];
        const length = end - start;
        const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
        const partBuffer = offlineCtx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0).slice(start, end);
        partBuffer.getChannelData(0).set(data);
        const source = offlineCtx.createBufferSource();
        source.buffer = partBuffer;
        source.connect(offlineCtx.destination);
        source.start();
        const rendered = await offlineCtx.startRendering();
        const wav = bufferToWav(rendered);
        results.push(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
      }
      setParts(results);
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const bufferToWav = (buffer) => {
    const data = buffer.getChannelData(0);
    const ab = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(ab);
    const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
    write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
    view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
    view.setUint32(24,buffer.sampleRate,true); view.setUint32(28,buffer.sampleRate*2,true);
    view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
    let o = 44;
    for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
    return ab;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Splitter</h1>
        <p className="text-neutral-500 text-center mb-8">Split audio into parts</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {duration > 0 && (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Split at: {splitAt}s (Total: {duration}s)</label>
              <input type="range" min="1" max={duration-1} value={splitAt} onChange={e => setSplitAt(parseInt(e.target.value))} className="w-full" />
            </div>
          )}
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Splitting...' : 'Split Audio'}</button>
          {parts.length > 0 && (
            <div className="space-y-3">
              {parts.map((url, i) => (
                <div key={i} className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 space-y-2">
                  <p className="text-sm text-neutral-500">Part {i+1}</p>
                  <audio controls src={url} className="w-full" />
                  <a href={url} download={"part-" + (i+1) + ".wav"} className="block text-center bg-green-600 hover:bg-green-500 rounded-lg py-1 text-sm transition">Download Part {i+1}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}