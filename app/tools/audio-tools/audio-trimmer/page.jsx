'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { reportToolError } from '../../../lib/reportError';
import { ffmpegAudioDuration } from '../../../lib/audioDuration';
import PlayablePreview from '../../../components/PlayablePreview';
import { FileDownload } from '../../../components/FileDownload';
import { execChecked } from '../../../lib/ffmpegRun';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

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
  const [error, setError] = useToolError('');
  // The browser's own player cannot read every format ffmpeg.wasm can (WMA, AC3, AMR… in every browser; more in
  // Safari): the duration then comes from ffmpeg.wasm itself, and the page says there is no preview (27-28/09/2026:
  // the controls never appeared and nothing was said).
  const [noPreview, setNoPreview] = useState(false);
  const [probing, setProbing] = useState(false);
  const fileRef = useRef();
  const audioRef = useRef();
  const fileIdRef = useRef(0);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; }
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setStart(0);
    setEnd(0);
    setDuration(0);
    setNoPreview(false);
    const id = ++fileIdRef.current;
    setAudioUrl(URL.createObjectURL(f));
    // Some engines never fire either event for a format they cannot play: do not wait on them forever.
    setTimeout(() => { const d = audioRef.current?.duration; if (fileIdRef.current === id && !(Number.isFinite(d) && d > 0)) probeWithFfmpeg(f, id); }, 4000);
  };

  const applyDuration = (seconds) => {
    const dur = Math.floor(seconds * 10) / 10; // tenths, never beyond the real end
    setDuration(dur);
    setStart(0);
    setEnd(dur);
  };
  const onLoaded = () => {
    const d = audioRef.current.duration;
    if (Number.isFinite(d) && d > 0) applyDuration(d);
    else probeWithFfmpeg(file, fileIdRef.current, true); // plays, but no length in its header (a MediaRecorder WebM: Infinity)
  };
  const probedRef = useRef(0);
  const probeWithFfmpeg = async (f, id, playable = false) => {
    // Once per file: the player's error and the 4-second check can both ask for it.
    if (fileIdRef.current !== id || probedRef.current === id) return;
    probedRef.current = id;
    if (!playable) setNoPreview(true);
    setProbing(true);
    try {
      const seconds = await ffmpegAudioDuration(f); // releases its ffmpeg.wasm instance on every path
      if (fileIdRef.current !== id) return;
      applyDuration(seconds);
    } catch (e) {
      if (fileIdRef.current === id) setError(`This file could not be read (${e.message || e}). Please try another file or format.`);
    } finally {
      if (fileIdRef.current === id) setProbing(false);
    }
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
      await execChecked(ffmpeg, exact
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
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          {audioUrl && !noPreview && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} onError={() => probeWithFfmpeg(file, fileIdRef.current)} controls className="w-full" />}
          {noPreview && !error && <p className="text-sm text-neutral-600" role="status">{probing ? 'Reading the file…' : 'This browser cannot play this format, so there is no preview; trimming works the same (type the start and end).'}</p>}
          {duration > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {[['start', 'Start', start], ['end', 'End', end]].map(([k, label, v]) => (
                  <div key={k} className="space-y-1">
                    <label htmlFor={`at-${k}`} className="block text-sm text-neutral-500">{label} (seconds): {clock(v)}</label>
                    <input id={`at-${k}`} type="number" min="0" max={duration} step="0.1" value={v} onChange={e => setTime(k, e.target.value)} className={num} />
                    <input type="range" min={0} max={duration} step={0.1} value={v} onChange={e => setTime(k, e.target.value)} className="w-full" aria-label={`${label} slider`} />
                    {!noPreview && <button type="button" onClick={() => fromPlayer(k)} className="text-xs text-indigo-600 underline">Set to the player's position</button>}
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
              {(fadeIn > 0 || fadeOut > 0) && <p className="text-xs text-neutral-500">With a fade, MP3, OGG, M4A and AAC are re-encoded at a high setting, WAV, AIFF and FLAC losslessly, other formats as WAV. Without one, it is copied exactly.</p>}
            </>
          )}
          <button onClick={trim} disabled={!file || loading || !(duration > 0)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Trimming...' : 'Trim Audio'}
          </button>
          {error && <p className="text-red-600 text-center text-sm" role="alert">{error}</p>}
          {result && (
            <div className="space-y-2">
              <PlayablePreview src={result.url} name={result.name} />
              {result.changedFormat && <p className="text-xs text-amber-700">Saved as WAV: with a fade, this tool keeps only MP3, OGG, M4A, AAC, WAV, AIFF and FLAC in their own format.</p>}
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Trimmer"
        description={`Audio Trimmer keeps one section of an audio file, from a start to an end set to a tenth of a second, and drops the rest; it cannot remove a passage from the middle. Without a fade, compressed audio is copied without re-encoding and keeps its format; WAV, AIFF and 16-bit FLAC are cut to the exact sample in their own format. A fade-in or fade-out re-encodes the audio: MP3, OGG (Vorbis), M4A and AAC at a high setting, WAV, AIFF and FLAC losslessly, and every other format as WAV; an Apple Lossless .m4a then becomes AAC, and Opus in an .ogg file becomes Vorbis. The cut is made by ffmpeg.wasm on your device.`}
        howToTitle="How to trim an audio file"
        howTo={[
          `Pick or drop the audio file; "Kept" then shows how long the section will be.`,
          `Set "Start" and "End" by typing seconds, moving the sliders, or playing and clicking "Set to the player's position".`,
          `If you want, enter a "Fade in (seconds)" and a "Fade out (seconds)".`,
          `Click "Trim Audio", listen, then click "Download" to save trimmed_ followed by your file name.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AC3, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Output format`, value: `The source's format; with a fade, MP3, WAV, FLAC, OGG, M4A, AAC and AIFF keep theirs and other formats become WAV` },
          { label: `Precision`, value: `Times to a tenth of a second; exact sample for WAV, AIFF, 16-bit FLAC and faded files; nearest audio frame for other copied files` },
          { label: `Fades`, value: `In and out, each in tenths of a second; together no longer than the part kept` },
        ]}
        privacy={`Trimming happens on your device: ffmpeg.wasm, downloaded from unpkg.com the first time, cuts the file inside the browser tab, and the audio is not sent to any server. If a trim fails, the cleaned error message, your file's extension and size range, and your browser's name and version reach our error log.`}
        faqs={[
          { q: `Can I remove a part from the middle of a song?`, a: `No. The trimmer keeps one continuous section, from "Start" to "End". To drop a middle passage, split the file at both ends with Audio Splitter and join the two outer parts with Audio Merger.` },
          { q: `Will trimming reduce quality?`, a: `No, without fades: compressed files are copied as they are, and WAV, AIFF and 16-bit FLAC are rewritten sample for sample. A fade needs a new encode; MP3, OGG, M4A and AAC are then written at a high setting and lose a little, and an Apple Lossless .m4a is saved as AAC.` },
          { q: `Is the cut exact to the millisecond?`, a: `No, the times are set to the tenth of a second. From there, WAV, AIFF, 16-bit FLAC and any file with a fade are cut to the exact sample, while a copied MP3 or other compressed file starts on the nearest audio frame: 0.3 to 39.5 ms late in our test of 27/09/2026.` },
          { q: `Can I make an iPhone ringtone with it?`, a: `Yes, in two steps: keep at most 40 seconds here, then convert the result to M4R with Audio Converter. A short fade-out avoids an abrupt stop when the ringtone loops.` },
        ]}
        tips={[
          `Play the file, pause where the section should begin, and click "Set to the player's position" under Start.`,
          `On a format your browser cannot play, such as WMA, type the start and end: there is no player, but trimming works the same.`,
        ]}
      />
    </div>
  );
}
