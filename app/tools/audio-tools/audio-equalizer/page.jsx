'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { decodeAnyAudio } from '../../../lib/decodeAudio';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import PlayablePreview from '../../../components/PlayablePreview';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function AudioEqualizerPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [bands, setBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState(null);
  const [error, setError] = useToolError('');
  const [note, setNote] = useState('');
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
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; }
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setPlaying(false);
    setExportUrl(null);
    setError('');
    decodedBufferRef.current = null;
  };

  // P24 review (03/10): the graph is built once per audio element, with the sliders' CURRENT values — it was rebuilt
  // on every play with gains of 0 (settings made before the first play were not heard until a slider moved) and a new
  // AudioContext each time (createMediaElementSource then threw on the second play).
  const graphElRef = useRef(null);
  const bandsRef = useRef(bands);
  bandsRef.current = bands;
  const setupEQ = () => {
    if (!audioElRef.current) return;
    if (graphElRef.current === audioElRef.current && audioCtxRef.current) { audioCtxRef.current.resume?.(); return; }
    audioCtxRef.current?.close?.();
    graphElRef.current = audioElRef.current;
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
    bass.gain.value = bandsRef.current.bass; mid.gain.value = bandsRef.current.mid; treble.gain.value = bandsRef.current.treble;
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        decodedBufferRef.current = await decodeAnyAudio(file, ctx); // ffmpeg.wasm when the browser cannot decode the format
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
      // A boost could push samples past full scale; they were then clipped
      // (hard distortion) without a word (29/09). As an equalizer's preamp
      // does, the whole output is lowered just enough to fit, and we say so.
      let peak = 0;
      for (let c = 0; c < rendered.numberOfChannels; c++) {
        const d = rendered.getChannelData(c);
        for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
      }
      if (peak > 1) {
        const g = 0.999 / peak;
        for (let c = 0; c < rendered.numberOfChannels; c++) {
          const d = rendered.getChannelData(c);
          for (let i = 0; i < d.length; i++) d[i] *= g;
        }
        setNote(`Your settings pushed the sound past full scale; the whole file was lowered by ${(20 * Math.log10(peak / 0.999)).toFixed(1)} dB to avoid distortion (clipping).`);
      } else setNote('');
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
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          {audioUrl && <audio ref={audioElRef} src={audioUrl} controls onPlay={setupEQ} onError={() => setError('This browser cannot play this format, so there is no live preview; "Export as WAV" still applies the equalizer to the whole file.')} className="w-full" />}
          <div className="grid grid-cols-3 gap-4">
            {[['bass', 'Bass', 200], ['mid', 'Mid', 1000], ['treble', 'Treble', 3000]].map(([key, label]) => (
              <div key={key} className="text-center">
                <label className="block text-sm font-medium text-neutral-700 mb-2">{label}: {bands[key]} dB</label>
                <input aria-label=": dB" type="range" min={-12} max={12} value={bands[key]} onChange={e => updateBand(key, Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-neutral-400 mt-1"><span>-12</span><span>+12</span></div>
              </div>
            ))}
          </div>
          <button onClick={exportAudio} disabled={!file || exporting} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {exporting ? 'Exporting...' : 'Export as WAV'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {note && <p className="text-amber-700 text-sm text-center">{note}</p>}
          {exportUrl && (
            <div className="space-y-2">
              <PlayablePreview src={exportUrl} name="equalized.wav" />
              <FileDownload href={exportUrl} name={'equalized_' + (file?.name.replace(/\.[^.]+$/, '') || 'audio') + '.wav'} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Equalizer"
        description={`Audio Equalizer has three bands: a low shelf at 200 Hz (Bass), a peak at 1 kHz (Mid) and a high shelf at 3 kHz (Treble), each adjustable from -12 to +12 dB. Press play and the sliders act on the sound live; "Export as WAV" then renders the whole file through the same settings, without real-time playback. If your settings push the sound past full scale, the export lowers the whole file just enough and says by how many dB. WMA, AC3 and AMR files, which browsers cannot decode, are first read by ffmpeg.wasm. The export is always a 16-bit WAV.`}
        howToTitle="How to equalize an audio file"
        howTo={[
          `Pick or drop an audio file; a player appears above the three sliders.`,
          `Press play, then move the "Bass", "Mid" and "Treble" sliders while you listen.`,
          `Click "Export as WAV" to render the file with the current settings.`,
          `Listen to the result, then click "Download" to save equalized_ followed by your file name, as WAV.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Output format`, value: `WAV, 16-bit PCM, at the sample rate your browser decodes at` },
          { label: `Bands`, value: `Bass: low shelf at 200 Hz · Mid: peak at 1 kHz · Treble: high shelf at 3 kHz · each from -12 to +12 dB` },
          { label: `File size`, value: `Set by your device's memory: the whole file is decoded before export.` },
        ]}
        privacy={`The Web Audio API applies the three filters on your device, both for the live preview and for the exported WAV, which is assembled in this tab; ffmpeg.wasm, downloaded from unpkg.com, steps in only when your browser cannot decode the file itself (WMA, AC3 or AMR, for example). The audio itself is not uploaded. When the page shows an error, that message, cleaned, goes to our error log with the tool name and your browser's name and version.`}
        faqs={[
          { q: `Can I hear the changes before exporting?`, a: `Yes. Start the player above the sliders: every move of Bass, Mid or Treble changes the sound at once. Formats your browser cannot play, such as WMA or AMR, have no live preview, but "Export as WAV" still applies the settings to the whole file.` },
          { q: `Will a big bass boost make the export distort?`, a: `No. If the rendered sound goes past full scale, the whole file is lowered just enough before saving, and the page tells you by how many dB. The live preview has no such protection, so it may crackle at high settings while the export stays clean.` },
          { q: `Can I save the result as MP3?`, a: `No, the export is always a 16-bit WAV, at the sample rate your browser decodes at. Convert it afterwards with Audio Converter if you need MP3, FLAC or another format.` },
          { q: `Can I save my settings as a preset?`, a: `No. The three sliders start at 0 dB on every visit and nothing is stored. Note the values if you want to apply the same curve to another file.` },
        ]}
        tips={[
          `If the export note says the file was lowered, reduce the boosts a little to keep the original level.`,
          `Open the exported WAV in Audio Waveform to see where the loudest peaks are.`,
        ]}
      />
    </div>
  );
}