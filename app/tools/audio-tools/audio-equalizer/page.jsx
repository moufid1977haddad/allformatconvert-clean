'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function AudioEqualizerPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [bands, setBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const audioCtxRef = useRef();
  const sourceRef = useRef();
  const bassRef = useRef();
  const midRef = useRef();
  const trebleRef = useRef();
  const audioElRef = useRef();
  const decodedBufferRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setPlaying(false);
    setExportUrl(null);
    setError('');
    decodedBufferRef.current = null;
  };

  const setupEQ = () => {
    if (!audioElRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaElementSource(audioElRef.current);
    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 200;
    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    const treble = ctx.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 3000;
    source.connect(bass).connect(mid).connect(treble).connect(ctx.destination);
    bassRef.current = bass;
    midRef.current = mid;
    trebleRef.current = treble;
  };

  const updateBand = (band, value) => {
    setBands(prev => ({ ...prev, [band]: value }));
    if (band === 'bass' && bassRef.current) bassRef.current.gain.value = value;
    if (band === 'mid' && midRef.current) midRef.current.gain.value = value;
    if (band === 'treble' && trebleRef.current) trebleRef.current.gain.value = value;
  };

  const encodeWav = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;
    const blockAlign = numChannels * 2;
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return buffer;
  };

  const exportAudio = async () => {
    if (!file) return;
    setExporting(true);
    setError('');
    try {
      if (!decodedBufferRef.current) {
        const arrayBuffer = await file.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        decodedBufferRef.current = await ctx.decodeAudioData(arrayBuffer);
        ctx.close();
      }
      const original = decodedBufferRef.current;
      const offlineCtx = new OfflineAudioContext(original.numberOfChannels, original.length, original.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = original;
      const bass = offlineCtx.createBiquadFilter();
      bass.type = 'lowshelf'; bass.frequency.value = 200; bass.gain.value = bands.bass;
      const mid = offlineCtx.createBiquadFilter();
      mid.type = 'peaking'; mid.frequency.value = 1000; mid.gain.value = bands.mid;
      const treble = offlineCtx.createBiquadFilter();
      treble.type = 'highshelf'; treble.frequency.value = 3000; treble.gain.value = bands.treble;
      source.connect(bass).connect(mid).connect(treble).connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const wavBuffer = encodeWav(rendered);
      setExportUrl(URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' })));
    } catch (e) { setError('Export failed: ' + e.message); }
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Equalizer</h1>
        <p className="text-neutral-500 text-center mb-8">Adjust bass, mid, and treble frequencies</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {audioUrl && <audio ref={audioElRef} src={audioUrl} controls onPlay={setupEQ} className="w-full" />}
          <div className="grid grid-cols-3 gap-4">
            {[['bass', 'Bass', 200], ['mid', 'Mid', 1000], ['treble', 'Treble', 3000]].map(([key, label]) => (
              <div key={key} className="text-center">
                <label className="block text-sm font-medium text-neutral-700 mb-2">{label}: {bands[key]} dB</label>
                <input type="range" min={-12} max={12} value={bands[key]} onChange={e => updateBand(key, Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-neutral-400 mt-1"><span>-12</span><span>+12</span></div>
              </div>
            ))}
          </div>
          <button onClick={exportAudio} disabled={!file || exporting} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {exporting ? 'Exporting...' : 'Export as WAV'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {exportUrl && (
            <div className="space-y-2">
              <audio controls src={exportUrl} className="w-full" />
              <a href={exportUrl} download={'equalized_' + (file?.name.replace(/\.[^.]+$/, '') || 'audio') + '.wav'} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download WAV</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Equalizer"
        description="Audio Equalizer lets you shape an audio file's bass, mid, and treble in real time as it plays, then export the equalized result as a downloadable WAV file — using the Web Audio API entirely in your browser. Export renders the file offline through the same filter settings, so you don't need to play it back in real time to get the processed file."
        howTo={[
          "Click the upload area and select an audio file.",
          "Press play on the audio player to preview changes live.",
          "Adjust the Bass, Mid, and Treble sliders (-12dB to +12dB) while it plays.",
          "Click \"Export as WAV\" to render the equalized audio at your current slider settings and download it."
        ]}
        faqs={[
          { q: "Can I download the equalized audio file?", a: "Yes — click \"Export as WAV\" to render the audio through your current Bass/Mid/Treble settings and get a downloadable WAV file, independent of what's currently playing." },
          { q: "Can I save my EQ settings as a preset?", a: "Not currently — each adjustment only applies to the current session; there's no saved-preset feature." },
          { q: "What format is the exported file?", a: "Always WAV, regardless of the format you uploaded." },
          { q: "What audio formats can I upload?", a: "Any format your browser can play, such as MP3, WAV, OGG, or FLAC." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything happens locally in your browser via the Web Audio API — your file is never uploaded to a server." }
        ]}
        tips={[
          "Make small adjustments and listen carefully — extreme boosts near ±12dB can introduce distortion audible in the exported file too.",
          "Boost the bass shelf for warmth, cut the mid range to reduce muddiness, and boost treble for clarity and presence.",
          "The exported WAV reflects whatever the sliders are set to at the moment you click \"Export as WAV\" — no need to have the track playing first.",
          "WAV files are uncompressed and can be large — convert the download afterward with the Audio Converter if you need a smaller MP3."
        ]}
      />
    </div>
  );
}