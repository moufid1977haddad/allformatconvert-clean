'use client';
import { useState, useRef } from 'react';
export default function AudioMergerPage() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFiles = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const buffers = await Promise.all(files.map(async f => {
        const ab = await f.arrayBuffer();
        return audioCtx.decodeAudioData(ab);
      }));
      const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
      const merged = audioCtx.createBuffer(1, totalLength, audioCtx.sampleRate);
      let offset = 0;
      buffers.forEach(b => {
        merged.getChannelData(0).set(b.getChannelData(0), offset);
        offset += b.length;
      });
      const offlineCtx = new OfflineAudioContext(1, totalLength, audioCtx.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = merged;
      source.connect(offlineCtx.destination);
      source.start();
      const renderedBuffer = await offlineCtx.startRendering();
      const wav = audioBufferToWav(renderedBuffer);
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    const writeString = (offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    return arrayBuffer;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge multiple audio files into one</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add audio files</p>
            <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={merge} disabled={files.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Merging...' : 'Merge Audio'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="merged.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}