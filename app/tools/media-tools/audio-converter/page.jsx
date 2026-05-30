'use client';
import { useState, useRef } from 'react';
export default function AudioConverterPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting to WAV...');
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const data = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + data.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
      let o = 44;
      for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert audio files to WAV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an audio file here'}</p>
            <p className="text-neutral-400 text-sm mt-1">Supports MP3, OGG, M4A, FLAC, WebM</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {status && <p className="text-yellow-400 text-center text-sm">{status}</p>}
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to WAV'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="converted.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download WAV</a></div>}
        </div>
      </div>
    </div>
  );
}