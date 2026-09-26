'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT } from '../../../lib/mediaSupport';
import { reportToolError } from '../../../lib/reportError';

// Start and end to a tenth of a second (typed, slid, or taken from the player) and fades in/out, as the reference
// cutter offers (mp3cut.net, read 26/09/2026: fades, keyboard nudges). The duration used to be rounded down to whole
// seconds, so the last fraction of a second could not be kept.
// Without a fade the cut is a stream copy (no quality loss, as before); a fade needs the audio re-encoded, done in
// the source's own format at a high setting (WAV when ffmpeg.wasm cannot write that format).
const REENCODE = {
  mp3: ['-c:a', 'libmp3lame', '-q:a', '2'], wav: ['-c:a', 'pcm_s16le'], flac: ['-c:a', 'flac'], ogg: ['-c:a', 'libvorbis', '-q:a', '6'],
  m4a: ['-c:a', 'aac', '-b:a', '192k'], aac: ['-c:a', 'aac', '-b:a', '192k'], aiff: ['-c:a', 'pcm_s16be'],
};
const MIME = { mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac', aiff: 'audio/aiff' };
const tenth = (x) => Math.round(x * 10) / 10;
const clock = (s) => { const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`; };

export default function AudioTrimmerPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [duration, setDuration] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setStart(0);
    setEnd(0);
    setDuration(0);
    setAudioUrl(URL.createObjectURL(f));
  };

  const onLoaded = () => {
    const dur = Math.floor(audioRef.current.duration * 10) / 10; // tenths, never beyond the real end
    setDuration(dur);
    setStart(0);
    setEnd(dur);
  };
  const setTime = (which, v) => {
    const x = Math.min(duration, Math.max(0, tenth(Number(v) || 0)));
    (which === 'start' ? setStart : setEnd)(x); setResult(null);
  };
  const fromPlayer = (which) => audioRef.current && setTime(which, audioRef.current.currentTime);
  const len = tenth(end - start);

  const trim = async () => {
    if (!file) return;
    if (start >= end) { setError('Start time must be before end time.'); return; }
    if (fadeIn + fadeOut > len + 1e-9) { setError(`The fades (${fadeIn} s + ${fadeOut} s) are longer than the part kept (${len} s).`); return; }
    setLoading(true);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      const log = [];
      ffmpeg.on('log', ({ message }) => { log.push(message); console.log('[ffmpeg]', message); });
      await ffmpeg.load();
      const raw = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'mp3';
      const sourceExt = /^[a-z0-9]{1,10}$/.test(raw) ? raw : 'dat';
      const inputName = 'input.' + sourceExt;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const fades = fadeIn > 0 || fadeOut > 0;
      // PCM and 16-bit FLAC are cut in the filter graph too, to the sample: a stream copy of a WAV cut 1.3-4.7 s gave
      // 3.437 s (measured, 26/09/2026). Re-writing them loses nothing when the format is the source's own, read from
      // ffmpeg's report on the input (a 24-bit WAV stays 24-bit). 24-bit FLAC keeps the stream copy.
      let pcm = null; let flac16 = false;
      if (['wav', 'aiff', 'aif', 'flac'].includes(sourceExt)) {
        await ffmpeg.exec(['-hide_banner', '-i', inputName]).catch(() => {}); // no output: only prints the streams
        const report = log.join(' ');
        pcm = (report.match(/Audio: (pcm_[a-z0-9]+)/) || [])[1] || null;
        flac16 = /Audio: flac[^\n]*\bs16\b/.test(report);
      }
      const exact = fades || !!pcm || flac16;
      // With a fade: re-encoded (same format when possible), cut inside the filter graph (atrim: to the sample; the
      // fades then count from the cut, not from the start of the file).
      const outExt = !exact ? sourceExt : pcm ? sourceExt : REENCODE[sourceExt] ? sourceExt : 'wav';
      const outputName = 'output.' + outExt;
      const af = [`atrim=start=${start}:end=${end}`, 'asetpts=PTS-STARTPTS', fadeIn > 0 && `afade=t=in:st=0:d=${fadeIn}`, fadeOut > 0 && `afade=t=out:st=${tenth(len - fadeOut)}:d=${fadeOut}`].filter(Boolean).join(',');
      await ffmpeg.exec(exact
        ? ['-i', inputName, '-af', af, ...(pcm ? ['-c:a', pcm] : REENCODE[outExt]), '-vn', outputName]
        : ['-i', inputName, '-ss', String(start), '-to', String(end), '-c', 'copy', outputName]);
      const data = await ffmpeg.readFile(outputName);
      if (!data.length) throw new Error('ffmpeg produced an empty file');
      const type = exact ? (MIME[outExt] || file.type || 'application/octet-stream') : (file.type || 'application/octet-stream');
      const url = URL.createObjectURL(new Blob([data.buffer], { type }));
      setResult({ url, name: 'trimmed_' + file.name.replace(/\.[^.]+$/, '') + '.' + outExt, reencoded: fades, changedFormat: outExt !== sourceExt });
    } catch(e) {
      console.error('Trim failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      reportToolError({ tool: 'audio-trimmer', file, error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Trim failed: ' + reason);
    }
    setLoading(false);
  };

  const num = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-sm';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Trimmer</h1>
        <p className="text-neutral-500 text-center mb-8">Trim and cut audio to a tenth of a second, with fades</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          {audioUrl && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} controls className="w-full" />}
          {duration > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {[['start', 'Start', start], ['end', 'End', end]].map(([k, label, v]) => (
                  <div key={k} className="space-y-1">
                    <label htmlFor={`at-${k}`} className="block text-sm text-neutral-500">{label} (seconds): {clock(v)}</label>
                    <input id={`at-${k}`} type="number" min="0" max={duration} step="0.1" value={v} onChange={e => setTime(k, e.target.value)} className={num} />
                    <input type="range" min={0} max={duration} step={0.1} value={v} onChange={e => setTime(k, e.target.value)} className="w-full" aria-label={`${label} slider`} />
                    <button type="button" onClick={() => fromPlayer(k)} className="text-xs text-indigo-600 underline">Set to the player's position</button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-neutral-600" data-length>Kept: {len > 0 ? `${len.toFixed(1)} s` : '—'} (of {duration.toFixed(1)} s)</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm"><span className="block text-neutral-500 mb-1">Fade in (seconds)</span>
                  <input id="at-fade-in" type="number" min="0" max="30" step="0.1" value={fadeIn} onChange={e => { setFadeIn(Math.max(0, tenth(Number(e.target.value) || 0))); setResult(null); }} className={num} /></label>
                <label className="block text-sm"><span className="block text-neutral-500 mb-1">Fade out (seconds)</span>
                  <input id="at-fade-out" type="number" min="0" max="30" step="0.1" value={fadeOut} onChange={e => { setFadeOut(Math.max(0, tenth(Number(e.target.value) || 0))); setResult(null); }} className={num} /></label>
              </div>
              {(fadeIn > 0 || fadeOut > 0) && <p className="text-xs text-neutral-500">With a fade, the audio is re-encoded (same format at a high setting; WAV if this format cannot be written here). Without one, it is copied exactly.</p>}
            </>
          )}
          <button onClick={trim} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Trimming...' : 'Trim Audio'}
          </button>
          {error && <p className="text-red-600 text-center text-sm" role="alert">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              {result.changedFormat && <p className="text-xs text-amber-700">Saved as WAV: this format cannot be re-encoded with fades in the browser.</p>}
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Trimmer"
        description="Audio Trimmer cuts a section out of an audio file to a tenth of a second, with optional fade in and fade out, entirely in your browser with ffmpeg.wasm — nothing is uploaded to a server. Type the start and end, drag the sliders, or take them from the player's position."
        howTo={[
          "Click the upload area and select an audio file.",
          "Set the start and end: type them (to 0.1 s), drag the sliders, or play the file and click \"Set to the player's position\".",
          "Optionally add a fade in and a fade out, in seconds.",
          "Click \"Trim Audio\", then preview and download the result."
        ]}
        faqs={[
          { q: "Is Audio Trimmer free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What audio formats can I trim?", a: "Any format ffmpeg.wasm can decode for input." },
          { q: "How precise is the cut?", a: "Start and end are set to a tenth of a second. WAV, AIFF and 16-bit FLAC, and any file with a fade, are cut to the exact sample. Other compressed formats without a fade are copied without re-encoding, so the cut lands on the nearest audio frame (a few hundredths of a second for MP3)." },
          { q: "Does it change the format?", a: "No: without a fade you get exactly your source's format and quality (WAV, AIFF and 16-bit FLAC are cut to the sample in their own format; other formats are copied without re-encoding). With a fade the audio must be re-encoded; it stays in the same format (MP3, WAV, FLAC, OGG, M4A, AAC, AIFF) at a high setting, and other formats are saved as WAV, which the page tells you." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything happens locally via ffmpeg.wasm — your file is never uploaded to a server." }
        ]}
        tips={[
          "Play the file, pause where you want to cut, and click \"Set to the player's position\" for the start or end.",
          "A short fade (0.5–2 s) avoids a click at the edges of the cut, useful for ringtones.",
          "Without fades nothing is re-encoded, so the quality is exactly the source's.",
          "The first trim after loading the page takes longer since the ffmpeg.wasm engine needs to download."
        ]}
      />
    </div>
  );
}
