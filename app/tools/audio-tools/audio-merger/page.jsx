'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { sanitizedInputExt } from '../../../lib/audioFormats';
import {
  MERGE_FORMATS, getMergeFormat, defaultFormat, planMerge, parseProbe, isLosslessCodec, depthOf, combinedDepth,
  FADE_CURVES, FADE_MIN, FADE_MAX, FADE_DEFAULT, maxCrossfade, planLastCount, parseSampleCount,
} from '../../../lib/audioMerge';
import { opusOnService, encodeOpusOnService } from '../../../lib/opusService';
import { reportToolError } from '../../../lib/reportError';
import PlayablePreview from '../../../components/PlayablePreview';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { execChecked } from '../../../lib/ffmpegRun';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

const LOSSLESS = MERGE_FORMATS.filter((f) => f.lossless);
const COMPRESSED = MERGE_FORMATS.filter((f) => !f.lossless);
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}${s < 60 ? `.${Math.floor((s * 10) % 10)}` : ''}`;
const fmtSize = formatBytes;
const CODEC_NAMES = { mp3: 'MP3', aac: 'AAC', vorbis: 'Vorbis', opus: 'Opus', flac: 'FLAC', alac: 'ALAC', wmav2: 'WMA', wmav1: 'WMA', ac3: 'AC3' };
const describe = (p) => {
  const codec = CODEC_NAMES[p.codec] || (p.codec?.startsWith('pcm_') ? 'PCM' : (p.codec || '?').toUpperCase());
  const d = depthOf(p);
  const depth = isLosslessCodec(p.codec) ? (typeof d === 'number' ? ` ${d}-bit` : ' float') : '';
  return `${codec}${depth} · ${p.sampleRate / 1000} kHz · ${p.channels === 1 ? 'mono' : p.channels === 2 ? 'stereo' : `${p.channels} ch`} · ${fmtTime(p.duration)}`;
};

let nextId = 1;
const joinKey = (a, b) => `${a.id}>${b.id}`;

export default function AudioMergerPage() {
  // The files in merge order: { id, file, name (its name inside ffmpeg.wasm), probe }.
  const [items, setItems] = useState([]);
  const [analysing, setAnalysing] = useState(false);
  const [format, setFormat] = useState('mp3');
  const [kbps, setKbps] = useState(null);
  // Crossfade: off by default -- the default join is exact and keeps every second of every file.
  const [fadeOn, setFadeOn] = useState(false);
  const [fadeSecs, setFadeSecs] = useState(FADE_DEFAULT);
  const [fadeCurve, setFadeCurve] = useState(FADE_CURVES[0].value);
  const [fadeOverlap, setFadeOverlap] = useState(true); // false: fade out, then fade in (the length is kept)
  const [fadeInOn, setFadeInOn] = useState(false);
  const [fadeOutOn, setFadeOutOn] = useState(false);
  const [noFadeJoins, setNoFadeJoins] = useState(() => new Set()); // joins unticked by the visitor ("id>id")
  const [dragFrom, setDragFrom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const fileRef = useRef();
  const ffmpegRef = useRef(null); // { ffmpeg, written: Set of names already in ffmpeg.wasm }
  const progressRef = useRef(null);
  const logRef = useRef(null); // collects ffmpeg's log while a sample count runs
  const abortRef = useRef(null);

  // Loads ffmpeg.wasm once and writes into it the files it does not hold yet (after a Cancel it starts afresh).
  const prepare = async (list) => {
    if (!ffmpegRef.current) {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = new FFmpeg();
      // ffmpeg.wasm's own stderr -- the real reason for a failure lives there. Also the progress: "time=" of the join.
      ffmpeg.on('log', ({ message }) => {
        console.log('[ffmpeg]', message);
        logRef.current?.push(message);
        const m =message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (m && progressRef.current) progressRef.current((+m[1] * 3600 + +m[2] * 60 + +m[3]));
      });
      await ffmpeg.load();
      ffmpegRef.current = { ffmpeg, written: new Set() };
    }
    const { fetchFile } = await import('@ffmpeg/util');
    const ref = ffmpegRef.current;
    for (const it of list) {
      if (ref.written.has(it.name)) continue;
      await ref.ffmpeg.writeFile(it.name, await fetchFile(it.file));
      ref.written.add(it.name);
    }
    return ref;
  };

  const readProbe = async (ffmpeg, it) => {
    await ffmpeg.ffprobe(['-v', 'error', '-show_entries',
      'stream=codec_type,codec_name,sample_rate,channels,sample_fmt,bits_per_raw_sample,bits_per_sample:format=format_name,duration',
      '-of', 'json', it.name, '-o', 'probe.json']);
    let p = null;
    try { p = parseProbe(new TextDecoder().decode(await ffmpeg.readFile('probe.json'))); await ffmpeg.deleteFile('probe.json'); } catch { p = null; }
    if (!p || !p.codec || !p.sampleRate) throw new Error(`"${it.file.name}" has no audio this tool can read.`);
    return p;
  };

  // New files are added after the ones already listed (pick or drop them in several goes).
  const addFiles = async (list) => {
    const locked = list.find((x) => encryptedMusicMessage(x.name));
    if (locked) { setError(encryptedMusicMessage(locked.name)); list = list.filter((x) => !encryptedMusicMessage(x.name)); if (!list.length) return; }
    if (!list.length || analysing || loading) return;
    const added = list.map((file) => { const id = nextId++; return { id, file, name: `in${id}.${sanitizedInputExt(file)}`, probe: null }; });
    const all = [...items, ...added];
    setItems(all); setResult(null); setError('');
    setAnalysing(true);
    try {
      const { ffmpeg } = await prepare(added);
      for (const it of added) it.probe = await readProbe(ffmpeg, it);
      setItems([...all]);
      const def = defaultFormat(all.map((it) => it.probe));
      setFormat(def);
      setKbps(getMergeFormat(def).defaultKbps || null);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError((err && err.message) || 'These files could not be read.');
      setItems(items); // the files that could not be read are not kept
    }
    setAnalysing(false);
  };

  const handleFiles = (e) => {
    const list = Array.from(e.target.files);
    e.target.value = '';
    addFiles(list);
  };

  const onDropFiles = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };

  const moveItem = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice(); const [it] = next.splice(from, 1); next.splice(to, 0, it);
    setItems(next); setResult(null);
  };
  const removeItem = (i) => {
    const it = items[i];
    const next = items.filter((_, k) => k !== i);
    setItems(next); setResult(null); setError('');
    if (ffmpegRef.current?.written.delete(it.name)) ffmpegRef.current.ffmpeg.deleteFile(it.name).catch(() => {});
    if (next.length && next.every((x) => x.probe)) {
      const def = defaultFormat(next.map((x) => x.probe)); setFormat(def); setKbps(getMergeFormat(def).defaultKbps || null);
    }
  };
  const clearAll = () => {
    if (ffmpegRef.current) { ffmpegRef.current.ffmpeg.terminate(); ffmpegRef.current = null; }
    setItems([]); setResult(null); setError(''); setNoFadeJoins(new Set());
  };
  const toggleJoin = (key) => {
    setNoFadeJoins((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
    setResult(null);
  };

  const pickFormat = (value) => {
    setFormat(value);
    setKbps(getMergeFormat(value).defaultKbps || null);
    setResult(null);
  };

  const cancel = () => {
    abortRef.current?.abort();
    if (ffmpegRef.current) { ffmpegRef.current.ffmpeg.terminate(); ffmpegRef.current = null; }
    progressRef.current = null; logRef.current = null;
    setLoading(false); setProgress(0); setStage('');
  };

  // The files, the joins and the fades actually applied (shortened to what the files allow).
  const probes = items.map((it) => it.probe);
  const probed = items.length > 0 && probes.every(Boolean);
  const joins = items.slice(1).map((it, i) => fadeOn && !noFadeJoins.has(joinKey(items[i], it)));
  const ends = { fadeIn: fadeInOn, fadeOut: fadeOutOn };
  const wantsFade = joins.some(Boolean) || fadeInOn || fadeOutOn;
  const fadeLimit = probed ? maxCrossfade(probes.map((p) => p.duration), joins, ends) : FADE_MAX;
  const fadeAsked = Math.min(FADE_MAX, Math.max(FADE_MIN, Number(fadeSecs) || FADE_DEFAULT));
  const fadeUsed = Math.min(fadeAsked, fadeLimit);
  const fade = wantsFade && fadeUsed >= FADE_MIN
    ? { seconds: fadeUsed, curve: fadeCurve, joins, overlap: fadeOverlap, fadeIn: fadeInOn, fadeOut: fadeOutOn } : null;
  const crossfaded = fade ? joins.filter(Boolean).length : 0;
  const sumSecs = probed ? probes.reduce((a, p) => a + p.duration, 0) : 0;
  const expectedSecs = Math.max(0, sumSecs - (fade && fadeOverlap ? fade.seconds * crossfaded : 0));

  const merge = async () => {
    if (items.length < 2 || !probed) return;
    setLoading(true); setError(''); setResult(null); setProgress(0);
    const total = Math.max(0.1, expectedSecs);
    const fmt = getMergeFormat(format);
    const service = opusOnService(format);
    const abort = new AbortController(); abortRef.current = abort;
    try {
      setStage('Joining…');
      const { ffmpeg } = await prepare(items);
      const names = items.map((it) => it.name);
      const planFormat = service ? 'flac' : format;
      let plannedFade = fade;
      if (fade?.fadeOut) {
        // The fade-out must end on the last sample: count the last file's samples exactly first (lib/audioMerge.js).
        setStage('Measuring the last file…');
        const c = planLastCount(probes, names, planFormat);
        logRef.current = [];
        await execChecked(ffmpeg, c.args);
        const lastSamples = parseSampleCount(logRef.current.join('\n'), c.channels);
        logRef.current = null;
        if (!lastSamples) throw new Error('The length of the last file could not be measured for the fade-out.');
        plannedFade = { ...fade, lastSamples };
        setStage('Joining…');
      }
      progressRef.current = (t) => setProgress(Math.min(service ? 49 : 99, Math.round((t / total) * (service ? 50 : 100))));
      // Opus: joined here losslessly (FLAC), then encoded with libopus on our media service (lib/opusService.js).
      const plan = planMerge(probes, names, planFormat, kbps, plannedFade);

      const code = await ffmpeg.exec(plan.args);
      progressRef.current = null;
      if (code !== 0) throw new Error('ffmpeg could not join these files (see the browser console for details).');
      const data = await ffmpeg.readFile(plan.outputName);
      await ffmpeg.deleteFile(plan.outputName);
      let blob;
      if (service) {
        setStage('Encoding Opus…');
        blob = await encodeOpusOnService(data, 'merged_audio', { kbps: plan.kbps || kbps, signal: abort.signal, onPct: (p) => setProgress(50 + Math.round(p / 2)) });
      } else {
        blob = new Blob([data.buffer], { type: plan.mime });
      }
      if (!blob.size) throw new Error('The merged file came out empty.');
      setProgress(100);
      // Firefox names a download after the Blob's type: audio/x-m4r was saved as .m4a (26/09/2026). The ringtone is
      // downloaded untyped so it keeps its .m4r name; the player keeps the typed one.
      const url = URL.createObjectURL(blob);
      const downloadUrl = format === 'm4r' ? URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' })) : url;
      setResult({ url, downloadUrl, name: `merged_audio.${fmt.ext}`, size: blob.size, secs: total, label: fmt.label });
    } catch (e) {
      if (!abort.signal.aborted && (ffmpegRef.current || service)) {
        // ffmpeg.wasm often throws non-Error values; the full object goes to the console.
        console.error('Merge failed:', e);
        const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
        reportToolError({ tool: 'audio-merger', error: e instanceof Error ? e : new Error(String(reason)) });
        setError('Merge failed: ' + reason);
      }
    }
    progressRef.current = null;
    setLoading(false); setStage('');
  };

  // What the chosen format does to these files, said before the merge.
  const fmt = getMergeFormat(format);
  const notes = [];
  if (probed && probes.length > 1) {
    const plan = planMerge(probes, probes.map((_, i) => `i${i}`), format, kbps);
    const allLossless = probes.every((p) => isLosslessCodec(p.codec));
    const total = expectedSecs;
    if (fade) {
      const s = `${fade.seconds.toFixed(1)} s`;
      if (crossfaded && fadeOverlap) notes.push(`Crossfade at ${crossfaded === items.length - 1 ? (crossfaded === 1 ? 'the join' : `all ${crossfaded} joins`) : `${crossfaded} of ${items.length - 1} joins`}: the two files overlap for ${s}, so the merged file lasts ${fmtTime(expectedSecs)} instead of ${fmtTime(sumSecs)}.`);
      if (crossfaded && !fadeOverlap) notes.push(`At ${crossfaded === 1 ? '1 join' : `${crossfaded} joins`}, a file fades out over ${s}, then the next one fades in over ${s}: nothing overlaps and the length is kept (${fmtTime(expectedSecs)}).`);
      if (fadeInOn) notes.push(`The first file fades in over ${s}.`);
      if (fadeOutOn) notes.push(`The last file fades out over ${s}, ending on its last sample.`);
      if (fade.seconds < fadeAsked) notes.push(`Fades shortened to ${s} (you asked for ${fadeAsked.toFixed(1)} s): a file can't give more than its own length to its fades — half of it when both of its ends fade.`);
    } else if (wantsFade) {
      notes.push('These files are too short for a fade of at least 0.1 s: they will be joined end to end.');
    }
    if (fmt.lossless && allLossless && !plan.resampled && !plan.rounded) notes.push(fade ? 'Lossless: outside the fades, the merged file holds every sample of your files, unchanged.' : 'Lossless: the merged file holds every sample of your files, unchanged, with no gap at the joins.');
    else if (fmt.lossless && !allLossless) notes.push('No further quality loss: your compressed files are decoded once and stored losslessly (a larger file).');
    else if (!fmt.lossless && allLossless) notes.push(`Your files are lossless; ${fmt.label} is compressed and loses some quality. Pick FLAC or WAV to keep everything.`);
    else if (!fmt.lossless) notes.push(`${fade ? 'Joined' : 'Joined seamlessly'}, then encoded once. Pick FLAC or WAV to add no further quality loss.`);
    if (plan.resampled) notes.push(`Your files use different sample rates: they are converted to ${plan.rate / 1000} kHz so they can be joined.`);
    if (!fmt.lossless && plan.rate < Math.max(...probes.map((p) => p.sampleRate))) notes.push(`${fmt.label} is limited to ${plan.rate / 1000} kHz: the audio is converted to it.`);
    if (plan.rounded) notes.push(`${fmt.label} stores up to 24 bits: your ${combinedDepth(probes.map(depthOf)) === 32 ? '32-bit' : 'floating-point'} audio will be rounded to 24 bits. WAV, AIFF, CAF or W64 keep it exactly.`);
    if (plan.channels < Math.max(...probes.map((p) => p.channels))) notes.push(`${fmt.label} holds ${plan.channels} channels at most: the audio is mixed down.`);
    if (format === 'aac') notes.push("A raw .aac file cannot store its length or the encoder's start delay: it begins with 23 ms of silence and some players show a wrong duration. M4A holds the same AAC audio exactly.");
    if (format === 'm4r' && total > 40) notes.push(`iPhone ringtones must be 40 seconds or shorter; this merge lasts ${fmtTime(total)}.`);
    if (opusOnService(format)) notes.push('Opus is encoded on our own server with libopus, the reference encoder: the joined audio is sent there and deleted once you have downloaded the result.');
  }
  const ready = items.length >= 2 && probed && !analysing;
  const busy = loading || analysing;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge audio files into one — in any order, seamlessly or with a crossfade, in the format you choose</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div
            onClick={() => !busy && fileRef.current.click()}
            onDragOver={(e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); }}
            onDrop={onDropFiles}
            className={`border-2 border-dashed border-neutral-200 rounded-xl text-center transition ${busy ? 'opacity-60' : 'cursor-pointer hover:border-indigo-400'} ${items.length ? 'p-4' : 'p-8'}`}
          >
            {items.length > 0
              ? <p className="text-neutral-700 text-sm font-medium">{items.length} file{items.length > 1 ? 's' : ''} · click or drop here to add more</p>
              : <p className="text-neutral-500 text-sm"><UploadPrompt what="two or more audio files" /></p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} multiple className="hidden" onChange={handleFiles} />
          {items.length > 0 && (
            <div className="space-y-1" data-testid="merge-list">
              {items.length > 1 && <p className="text-xs text-neutral-500">Merged from top to bottom — drag a file or use its arrows to change the order.</p>}
              {items.map((it, i) => (
                <div key={it.id}>
                  <div
                    draggable={!busy}
                    onDragStart={(e) => { setDragFrom(i); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); }}
                    onDragOver={(e) => { if (dragFrom !== null) e.preventDefault(); }}
                    onDrop={(e) => { if (dragFrom === null) return; e.preventDefault(); e.stopPropagation(); moveItem(dragFrom, i); setDragFrom(null); }}
                    onDragEnd={() => setDragFrom(null)}
                    data-testid="merge-item"
                    className={`text-sm text-neutral-600 bg-neutral-50 rounded-lg pl-2 pr-1 py-1.5 border flex items-center gap-2 ${dragFrom === i ? 'border-indigo-400 opacity-60' : 'border-neutral-200'} ${busy ? '' : 'cursor-grab'}`}
                  >
                    <span aria-hidden="true" className="text-neutral-400 select-none">⋮⋮</span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate" data-testid="merge-name">{i + 1}. {it.file.name}</span>
                      <span className="block text-neutral-500 text-xs">{it.probe ? describe(it.probe) : analysing ? 'reading…' : ''}</span>
                    </span>
                    <button type="button" onClick={() => moveItem(i, i - 1)} disabled={busy || i === 0} aria-label={`Move ${it.file.name} up`} title="Move up" className="w-8 h-8 rounded-md hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent">↑</button>
                    <button type="button" onClick={() => moveItem(i, i + 1)} disabled={busy || i === items.length - 1} aria-label={`Move ${it.file.name} down`} title="Move down" className="w-8 h-8 rounded-md hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent">↓</button>
                    <button type="button" onClick={() => removeItem(i)} disabled={busy} aria-label={`Remove ${it.file.name}`} title="Remove" className="w-8 h-8 rounded-md hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent">✕</button>
                  </div>
                  {fadeOn && i < items.length - 1 && (
                    <label className="flex items-center gap-2 text-xs text-neutral-600 pl-8 py-1">
                      <input type="checkbox" data-testid={`join-fade-${i}`} checked={!noFadeJoins.has(joinKey(it, items[i + 1]))} onChange={() => toggleJoin(joinKey(it, items[i + 1]))} disabled={busy} />
                      {fadeOverlap ? 'Crossfade into the next file' : 'Fade out, then fade the next file in'}
                    </label>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center">
                {items.length === 1 ? <p className="text-xs text-neutral-500">Add at least one more file.</p> : <span />}
                <button type="button" onClick={clearAll} disabled={busy} className="text-xs text-neutral-500 hover:text-neutral-800 underline disabled:opacity-40">Remove all</button>
              </div>
            </div>
          )}
          {ready && (
            <fieldset className="border border-neutral-200 rounded-lg p-3 space-y-2" data-testid="transitions">
              <legend className="text-sm text-neutral-500 px-1">Transitions <span className="text-neutral-400">(off: the files are joined end to end, nothing added or cut)</span></legend>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-700">
                <label className="flex items-center gap-2"><input id="crossfade" type="checkbox" checked={fadeOn} onChange={(e) => { setFadeOn(e.target.checked); setResult(null); }} disabled={loading} /> Crossfade between files</label>
                <label className="flex items-center gap-2"><input id="fade-in" type="checkbox" checked={fadeInOn} onChange={(e) => { setFadeInOn(e.target.checked); setResult(null); }} disabled={loading} /> Fade in at the start</label>
                <label className="flex items-center gap-2"><input id="fade-out" type="checkbox" checked={fadeOutOn} onChange={(e) => { setFadeOutOn(e.target.checked); setResult(null); }} disabled={loading} /> Fade out at the end</label>
              </div>
              {(fadeOn || fadeInOn || fadeOutOn) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="fade-secs" className="block text-xs text-neutral-500 mb-1">Length (seconds)</label>
                    <input id="fade-secs" type="number" min={FADE_MIN} max={FADE_MAX} step="0.1" value={fadeSecs} onChange={(e) => { setFadeSecs(e.target.value); setResult(null); }} onBlur={() => setFadeSecs(fadeAsked)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="fade-curve" className="block text-xs text-neutral-500 mb-1">Curve</label>
                    <select id="fade-curve" value={fadeCurve} onChange={(e) => { setFadeCurve(e.target.value); setResult(null); }} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                      {FADE_CURVES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {fadeOn && (
                    <div>
                      <label htmlFor="fade-mode" className="block text-xs text-neutral-500 mb-1">Between files</label>
                      <select id="fade-mode" value={fadeOverlap ? 'overlap' : 'gap'} onChange={(e) => { setFadeOverlap(e.target.value === 'overlap'); setResult(null); }} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                        <option value="overlap">Overlap (shorter result)</option>
                        <option value="gap">Fade out, then in (same length)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </fieldset>
          )}
          {ready && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="merge-format" className="block text-sm text-neutral-500 mb-1">Output format</label>
                <select id="merge-format" value={format} onChange={(e) => pickFormat(e.target.value)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
                  <optgroup label="Lossless — no quality loss">
                    {LOSSLESS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </optgroup>
                  <optgroup label="Compressed — smaller files">
                    {COMPRESSED.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </optgroup>
                </select>
              </div>
              {fmt.kbps && (
                <div>
                  <label htmlFor="merge-kbps" className="block text-sm text-neutral-500 mb-1">Bitrate</label>
                  <select id="merge-kbps" value={kbps ?? fmt.defaultKbps} onChange={(e) => { setKbps(Number(e.target.value)); setResult(null); }} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
                    {fmt.kbps.map((k) => <option key={k} value={k}>{fmt.shownKbps?.[k] || k} kbit/s{k === fmt.defaultKbps ? ' (high quality)' : ''}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
          {ready && notes.length > 0 && (
            <ul className="text-xs text-neutral-600 space-y-1 list-disc pl-5" data-testid="merge-notes">
              {notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={stage || 'Merging…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={merge} disabled={!ready} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
              {analysing ? 'Reading files…' : 'Merge Audio Files'}
            </button>
          )}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <PlayablePreview src={result.url} name={result.name} />
              <p className="text-xs text-neutral-500 text-center">{result.label} · {fmtTime(result.secs)} · {fmtSize(result.size)}</p>
              <FileDownload href={result.downloadUrl} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Merger"
        description={`Audio Merger joins two or more audio files into one. Each file is decoded on its own and the samples are joined, so no gap or click is added at the joins. Set the order by dragging or with the arrows, and, if you want, add a crossfade of ${FADE_MIN} to ${FADE_MAX} seconds, equal power or linear, join by join, plus a fade-in at the start and a fade-out at the end. Output: 6 lossless formats (FLAC, WAV, AIFF, ALAC, CAF, W64) and 8 compressed ones (MP3, M4A, raw AAC, M4R, OGG Vorbis, Opus, WMA, AC3). The joining always happens in the page with ffmpeg.wasm; only the final Opus encoding uses our media service.`}
        howToTitle="How to merge audio files into one"
        howTo={[
          `Add two or more audio files by clicking or dropping them on the upload area; you can add more later.`,
          `Drag files up or down, or use the ↑ and ↓ arrows; they are merged from top to bottom.`,
          `Under "Transitions", tick "Crossfade between files", "Fade in at the start" or "Fade out at the end" if you want them, and set "Length (seconds)" and "Curve".`,
          `Choose the "Output format" and, for a compressed one, the "Bitrate".`,
          `Click "Merge Audio Files", then "Download" to save merged_audio in the chosen format.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Output formats`, value: `Lossless: FLAC, WAV, AIFF, ALAC, CAF, W64. Compressed: MP3, M4A, AAC, M4R, OGG, Opus, WMA, AC3.` },
          { label: `Bitrate`, value: `MP3, M4A, AAC, M4R and OGG: 64 to 320 kbps. Opus: 64 to 256. WMA: 64 to 256 requested, shown with the rate really written. AC3: 192 to 640.` },
          { label: `Files`, value: `Two or more, with no maximum count; all are held in browser memory` },
          { label: `Usage limits`, value: `Opus output: a set number of encodings per connection per hour and per day, and the joined FLAC sent to our media service must stay under its maximum size and length.` },
        ]}
        privacy={`Your files are decoded and joined by ffmpeg.wasm on this page, whatever the output. For Opus output, the joined audio is then rendered as FLAC and sent to our media service for libopus encoding; the service erases that FLAC as soon as it is encoded and the Opus file once your browser has it, or after a set time. If a merge fails, the cleaned error message, the tool name and your browser's name and version are reported to us.`}
        faqs={[
          { q: `Does the merger keep my files' format?`, a: `Yes, by default, when they share one: lossless files stay in their lossless format (FLAC if they differ, WAV for 32-bit or floating-point audio), and all-MP3 or all-Opus sets stay MP3 or Opus; raw AAC becomes M4A. Any other mix defaults to MP3 at 320 kbit/s.` },
          { q: `Can MP3 files be joined without re-encoding?`, a: `No, not without gaps. Our test of 26/09/2026 found that copying the data left 18 to 40 ms of silence at each MP3 join, 26 to 30 ms for AAC, and garbled sound after Opus joins, from each file's encoder delay. This tool decodes each file and encodes once; pick FLAC or WAV to add no further loss.` },
          { q: `Is the result lossless when I merge FLAC or WAV files?`, a: `Yes, with a lossless output: every sample of your files is kept unchanged, at their bit depth. Files at different sample rates are first converted to the highest one, and FLAC or ALAC store 32-bit or floating-point audio at 24 bits; the page says when either happens. Compressed outputs may end a few milliseconds longer than the sum.` },
          { q: `Does a crossfade make the merged file shorter?`, a: `Yes, with "Overlap (shorter result)": each crossfaded join shortens the result by the fade length, shown before you merge. "Fade out, then in (same length)" keeps the full length. You can untick the crossfade at any single join.` },
          { q: `Is equal power better than linear?`, a: `Yes, for two unrelated sounds: in our test of 26/09/2026 on two independent pink noises, equal power kept the level steady (-0.01 dB halfway through) while linear dipped by about 3 dB. Linear stays available for two recordings of the same sound, which add up in phase.` },
        ]}
      />
    </div>
  );
}
