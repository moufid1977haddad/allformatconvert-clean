'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { AUDIO_ACCEPT } from '../../../lib/mediaSupport';
import { sanitizedInputExt } from '../../../lib/audioFormats';
import { MERGE_FORMATS, getMergeFormat, defaultFormat, planMerge, parseProbe, isLosslessCodec, depthOf, combinedDepth } from '../../../lib/audioMerge';
import { opusOnService, encodeOpusOnService } from '../../../lib/opusService';
import { reportToolError } from '../../../lib/reportError';

const LOSSLESS = MERGE_FORMATS.filter((f) => f.lossless);
const COMPRESSED = MERGE_FORMATS.filter((f) => !f.lossless);
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}${s < 60 ? `.${Math.floor((s * 10) % 10)}` : ''}`;
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const CODEC_NAMES = { mp3: 'MP3', aac: 'AAC', vorbis: 'Vorbis', opus: 'Opus', flac: 'FLAC', alac: 'ALAC', wmav2: 'WMA', wmav1: 'WMA', ac3: 'AC3' };
const describe = (p) => {
  const codec = CODEC_NAMES[p.codec] || (p.codec?.startsWith('pcm_') ? 'PCM' : (p.codec || '?').toUpperCase());
  const d = depthOf(p);
  const depth = isLosslessCodec(p.codec) ? (typeof d === 'number' ? ` ${d}-bit` : ' float') : '';
  return `${codec}${depth} · ${p.sampleRate / 1000} kHz · ${p.channels === 1 ? 'mono' : p.channels === 2 ? 'stereo' : `${p.channels} ch`} · ${fmtTime(p.duration)}`;
};

export default function AudioMergerPage() {
  const [files, setFiles] = useState([]);
  const [probes, setProbes] = useState([]);
  const [analysing, setAnalysing] = useState(false);
  const [format, setFormat] = useState('mp3');
  const [kbps, setKbps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const ffmpegRef = useRef(null); // { ffmpeg, names, files } -- the files already written into ffmpeg.wasm
  const progressRef = useRef(null);
  const abortRef = useRef(null);

  // Loads ffmpeg.wasm once and writes the chosen files into it (reused by the merge).
  const prepare = async (list) => {
    if (ffmpegRef.current && ffmpegRef.current.files === list) return ffmpegRef.current;
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();
    // ffmpeg.wasm's own stderr -- the real reason for a failure lives there. Also the progress: "time=" of the join.
    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
      const m = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (m && progressRef.current) progressRef.current((+m[1] * 3600 + +m[2] * 60 + +m[3]));
    });
    await ffmpeg.load();
    const names = [];
    for (let i = 0; i < list.length; i++) {
      const name = `input${i}.${sanitizedInputExt(list[i])}`;
      await ffmpeg.writeFile(name, await fetchFile(list[i]));
      names.push(name);
    }
    ffmpegRef.current = { ffmpeg, names, files: list };
    return ffmpegRef.current;
  };

  const handleFiles = async (e) => {
    const list = Array.from(e.target.files);
    e.target.value = '';
    if (ffmpegRef.current) { ffmpegRef.current.ffmpeg.terminate(); ffmpegRef.current = null; }
    setFiles(list); setProbes([]); setResult(null); setError('');
    if (list.length === 0) return;
    setAnalysing(true);
    try {
      const { ffmpeg, names } = await prepare(list);
      const found = [];
      for (let i = 0; i < names.length; i++) {
        await ffmpeg.ffprobe(['-v', 'error', '-show_entries',
          'stream=codec_type,codec_name,sample_rate,channels,sample_fmt,bits_per_raw_sample,bits_per_sample:format=format_name,duration',
          '-of', 'json', names[i], '-o', 'probe.json']);
        let p = null;
        try { p = parseProbe(new TextDecoder().decode(await ffmpeg.readFile('probe.json'))); await ffmpeg.deleteFile('probe.json'); } catch { p = null; }
        if (!p || !p.codec || !p.sampleRate) throw new Error(`"${list[i].name}" has no audio this tool can read.`);
        found.push(p);
      }
      setProbes(found);
      const def = defaultFormat(found);
      setFormat(def);
      setKbps(getMergeFormat(def).defaultKbps || null);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError((err && err.message) || 'These files could not be read.');
      if (ffmpegRef.current) { ffmpegRef.current.ffmpeg.terminate(); ffmpegRef.current = null; }
    }
    setAnalysing(false);
  };

  const pickFormat = (value) => {
    setFormat(value);
    setKbps(getMergeFormat(value).defaultKbps || null);
    setResult(null);
  };

  const cancel = () => {
    abortRef.current?.abort();
    if (ffmpegRef.current) { ffmpegRef.current.ffmpeg.terminate(); ffmpegRef.current = null; }
    progressRef.current = null;
    setLoading(false); setProgress(0); setStage('');
  };

  const merge = async () => {
    if (files.length < 2 || probes.length !== files.length) return;
    setLoading(true); setError(''); setResult(null); setProgress(0);
    const total = probes.reduce((a, p) => a + p.duration, 0) || 1;
    const fmt = getMergeFormat(format);
    const service = opusOnService(format);
    const abort = new AbortController(); abortRef.current = abort;
    try {
      setStage('Joining…');
      const { ffmpeg, names } = await prepare(files);
      progressRef.current = (t) => setProgress(Math.min(service ? 49 : 99, Math.round((t / total) * (service ? 50 : 100))));
      // Opus: joined here losslessly (FLAC), then encoded with libopus on our media service (lib/opusService.js).
      const plan = planMerge(probes, names, service ? 'flac' : format, kbps);
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
  if (probes.length === files.length && probes.length > 1) {
    const plan = planMerge(probes, probes.map((_, i) => `i${i}`), format, kbps);
    const allLossless = probes.every((p) => isLosslessCodec(p.codec));
    const total = probes.reduce((a, p) => a + p.duration, 0);
    if (fmt.lossless && allLossless && !plan.resampled && !plan.rounded) notes.push('Lossless: the merged file holds every sample of your files, unchanged, with no gap at the joins.');
    else if (fmt.lossless && !allLossless) notes.push('No further quality loss: your compressed files are decoded once and stored losslessly (a larger file).');
    else if (!fmt.lossless && allLossless) notes.push(`Your files are lossless; ${fmt.label} is compressed and loses some quality. Pick FLAC or WAV to keep everything.`);
    else if (!fmt.lossless) notes.push(`Joined seamlessly, then encoded once. Pick FLAC or WAV to add no further quality loss.`);
    if (plan.resampled) notes.push(`Your files use different sample rates: they are converted to ${plan.rate / 1000} kHz so they can be joined.`);
    if (!fmt.lossless && plan.rate < Math.max(...probes.map((p) => p.sampleRate))) notes.push(`${fmt.label} is limited to ${plan.rate / 1000} kHz: the audio is converted to it.`);
    if (plan.rounded) notes.push(`${fmt.label} stores up to 24 bits: your ${combinedDepth(probes.map(depthOf)) === 32 ? '32-bit' : 'floating-point'} audio will be rounded to 24 bits. WAV, AIFF, CAF or W64 keep it exactly.`);
    if (plan.channels < Math.max(...probes.map((p) => p.channels))) notes.push(`${fmt.label} holds ${plan.channels} channels at most: the audio is mixed down.`);
    if (format === 'aac') notes.push("A raw .aac file cannot store its length or the encoder's start delay: it begins with 23 ms of silence and some players show a wrong duration. M4A holds the same AAC audio exactly.");
    if (format === 'm4r' && total > 40) notes.push(`iPhone ringtones must be 40 seconds or shorter; this merge lasts ${fmtTime(total)}.`);
    if (opusOnService(format)) notes.push('Opus is encoded on our own server with libopus, the reference encoder: the joined audio is sent there and deleted once you have downloaded the result.');
  }
  const ready = files.length >= 2 && probes.length === files.length && !analysing;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge multiple audio files into one — seamlessly, in the format you choose</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {files.length > 0 ? <p className="text-neutral-700 font-medium">{files.length} files selected</p> : <p className="text-neutral-400 text-sm">Click to upload multiple audio files</p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200 flex justify-between gap-3">
                  <span className="truncate">{i + 1}. {f.name}</span>
                  <span className="text-neutral-500 shrink-0 text-xs self-center">{probes[i] ? describe(probes[i]) : analysing ? 'reading…' : ''}</span>
                </div>
              ))}
              {files.length === 1 && <p className="text-xs text-neutral-500">Select at least two files (they are joined in the order you pick them).</p>}
            </div>
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
            <button onClick={merge} disabled={!ready} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              {analysing ? 'Reading files…' : 'Merge Audio Files'}
            </button>
          )}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              {result.noPreview
                ? <p className="text-sm text-neutral-600 text-center" data-testid="no-preview">Your browser can&apos;t play {result.label} files, so there is no preview — the downloaded file is complete and plays in apps that support {result.label}.</p>
                : <audio controls src={result.url} className="w-full" onError={() => setResult((r) => (r ? { ...r, noPreview: true } : r))} />}
              <p className="text-xs text-neutral-500 text-center">{result.label} · {fmtTime(result.secs)} · {fmtSize(result.size)}</p>
              <a href={result.downloadUrl} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download {result.name}</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Merger"
        description="Audio Merger joins two or more audio files into one, in your browser via ffmpeg.wasm. Each file is decoded on its own and the samples are joined end to end, so there is no gap, click or lost fraction of a second at the joins — the length of the result is exactly the sum of your files. You choose the output format: 6 lossless formats (FLAC, WAV, AIFF, ALAC, CAF, W64) and 8 compressed ones (MP3, M4A, AAC, M4R ringtone, OGG Vorbis, Opus, WMA, AC3) with a choice of bitrate. When all your files are lossless, the result is lossless by default, with their bit depth and sample rate kept. Your files are not uploaded, except for Opus output: it is encoded on our own server with libopus and deleted after download."
        howTo={[
          "Click the upload area and select two or more audio files — they merge in the order you pick them.",
          "Check the list: each file's format, sample rate and length is shown.",
          "Choose the output format (and the bitrate for a compressed format). The default keeps your files' quality: lossless stays lossless.",
          "Click \"Merge Audio Files\", then preview and download the result."
        ]}
        faqs={[
          { q: "Which output format is picked by default?", a: "If all your files are lossless (FLAC, WAV, AIFF, ALAC…), the result is lossless too: the same format when they share one, otherwise FLAC (or WAV for 32-bit and floating-point audio, which FLAC can't hold exactly). If all your files share a compressed format (all MP3, all Opus…), that format is kept. Any other mix gives MP3 at 320 kbit/s. You can always pick another format before merging." },
          { q: "Why not just join MP3 (or AAC, Opus) files without re-encoding?", a: "We measured it: joining compressed files by copying their data leaves a silence of about 18 to 40 ms at each join for MP3, 26 to 30 ms for AAC, and garbled audio for the first milliseconds after each join for Opus, because every file carries its own encoder delay and padding. This tool decodes each file on its own, which removes that delay and padding exactly, then encodes once. To add no further quality loss at all, choose FLAC or WAV." },
          { q: "Is the result really lossless when I merge FLAC or WAV files?", a: "Yes, as long as you keep a lossless output format: the merged file contains every sample of your files unchanged, at their bit depth (16-bit, 24-bit or floating point for WAV). The only exception is files recorded at different sample rates, which have to be converted to a common rate (the highest one) to be joined — the page tells you when that happens." },
          { q: "Can I reorder files before merging?", a: "Not currently — files merge in the order they were selected. There is no crossfade either: files are joined end to end." },
          { q: "Is there a limit on file count or size?", a: "No limit is set by the tool; your browser's available memory is the limit, since the files are processed on your device." },
          { q: "Is my data private?", a: "Yes. Everything is done in your browser with ffmpeg.wasm, and your files never leave your device — except when you choose Opus: the joined audio is then sent to our own server (not a third party), encoded with libopus and deleted as soon as you have downloaded the result." }
        ]}
        tips={[
          "Merging lossless files? Keep the lossless default: the result is exact and plays in full everywhere.",
          "For a smaller file from lossless sources, MP3 at 320 kbit/s or Opus at 192 kbit/s are both high quality; Opus is smaller at the same quality.",
          "An iPhone ringtone (M4R) must last 40 seconds or less.",
          "The first merge after loading the page takes longer since your browser downloads the ffmpeg.wasm engine."
        ]}
      />
    </div>
  );
}
