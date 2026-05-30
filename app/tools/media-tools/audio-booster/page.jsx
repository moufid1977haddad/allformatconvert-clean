'use client';
import { useState, useRef } from 'react';
export default function AudioBoosterPage() {
  const [file, setFile] = useState(null);
  const [gain, setGain] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const boost = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = gain;
      source.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const wav = bufferToWav(rendered);
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
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
        <h1 className="text-3xl font-bold text-center mb-2">Audio Booster</h1>
        <p className="text-neutral-500 text-center mb-8">Boost audio volume</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Gain: {gain}x</label><input type="range" min="0.5" max="5" step="0.5" value={gain} onChange={e => setGain(parseFloat(e.target.value))} className="w-full" /></div>
          <button onClick={boost} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : 'Boost Audio'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="boosted.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}