'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function AudioEqualizerPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [bands, setBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const fileRef = useRef();
  const audioCtxRef = useRef();
  const sourceRef = useRef();
  const bassRef = useRef();
  const midRef = useRef();
  const trebleRef = useRef();
  const audioElRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setPlaying(false);
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
        </div>
      </div>
      <SeoContent
        title="Audio Equalizer"
        description="Audio Equalizer lets you shape an audio file's bass, mid, and treble in real time as it plays, using the Web Audio API entirely in your browser. Note: this is a live playback effect only — there's currently no way to export or download the equalized audio, and settings aren't saved as presets."
        howTo={[
          "Click the upload area and select an audio file.",
          "Press play on the audio player to start listening.",
          "Adjust the Bass, Mid, and Treble sliders (-12dB to +12dB) while it plays.",
          "Keep tweaking until the sound matches what you want — changes apply live to playback only."
        ]}
        faqs={[
          { q: "Can I download the equalized audio file?", a: "Not currently — the EQ only affects live playback through your speakers; there's no export or save-to-file feature yet." },
          { q: "Can I save my EQ settings as a preset?", a: "Not currently — each adjustment only applies to the current playback session." },
          { q: "What audio formats can I upload?", a: "Any format your browser can play, such as MP3, WAV, OGG, or FLAC." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything happens locally in your browser via the Web Audio API — your file is never uploaded to a server." }
        ]}
        tips={[
          "Make small adjustments and listen carefully — extreme boosts near ±12dB can introduce distortion.",
          "Boost the bass shelf for warmth, cut the mid range to reduce muddiness, and boost treble for clarity and presence.",
          "Since changes aren't saved, note down settings you like so you can reapply them manually next time.",
          "Use headphones for the most accurate sense of how your adjustments affect the sound."
        ]}
      />
    </div>
  );
}