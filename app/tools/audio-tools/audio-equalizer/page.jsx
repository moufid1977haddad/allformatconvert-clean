'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Equalizer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Equalizer is a free online tool that allows you to adjust the frequency response of your audio files with precision control over multiple frequency bands. Enhance your music, podcasts, and videos by boosting or cutting specific frequencies to achieve the perfect sound for your needs.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Equalizer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your audio file by clicking the upload button or dragging and dropping your file into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the frequency sliders to adjust different frequency bands according to your preferences</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your changes in real-time by clicking the play button to hear the modified audio</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your equalized audio file by clicking the download button when satisfied with the adjustments</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Equalizer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Equalizer supports popular formats including MP3, WAV, OGG, and FLAC files for both uploading and downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my audio file stored on your servers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your audio files are processed directly in your browser and are never stored on our servers, ensuring complete privacy.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I save my equalizer settings as presets?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can save your custom equalizer settings as presets that you can quickly apply to other audio files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Audio Equalizer work on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Equalizer is fully responsive and works on smartphones, tablets, and desktop devices.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with preset profiles designed for different genres like pop, rock, jazz, and classical to quickly achieve professional-sounding results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the bass frequency slider (20-250 Hz) to add warmth and depth to your audio without introducing unwanted noise</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Apply subtle adjustments rather than extreme boosts or cuts to maintain audio quality and prevent distortion</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the presence peak around 2-4 kHz to enhance vocal clarity and make instruments stand out in your mix</li>
          </ul>
        </div>
      </div>
    </div>
  );
}