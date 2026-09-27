'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { AUDIO_OUTPUT_FORMATS, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';
import { opusOnService, encodeOpusOnService, LOSSLESS_INTERMEDIATE } from '../../../lib/opusService';
import { ffmpegAudioDuration } from '../../../lib/audioDuration';

const tenth = (x) => Math.round(x * 10) / 10;

export default function AudioSplitterPage() {
  const [file, setFile] = useState(null);
  const [splitAt, setSplitAt] = useState(30);
  const [duration, setDuration] = useState(0);
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  // The browser's player cannot read every format (WMA, AC3… everywhere; more in Safari): ffmpeg.wasm reads the
  // length instead and the page says there is no preview (28/09/2026: the split control never appeared).
  const [noPreview, setNoPreview] = useState(false);
  const fileRef = useRef();
  const audioRef = useRef();
  const fileIdRef = useRef(0);
  const probedRef = useRef(0);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; }
    e.target.value = '';
    setFile(f);
    setResults([]);
    setError('');
    setDuration(0);
    setSplitAt(30);
    setNoPreview(false);
    if (!f) return;
    // Same format as the source by default when it can be written here (it used to be MP3 for everything, so a WAV
    // or FLAC was made lossy unless the visitor changed it).
    const ext = sanitizedInputExt(f);
    setFormat(AUDIO_OUTPUT_FORMATS.some((x) => x.value === ext) ? ext : 'mp3');
    const id = ++fileIdRef.current;
    setAudioUrl(URL.createObjectURL(f));
    setTimeout(() => { const d = audioRef.current?.duration; if (fileIdRef.current === id && !(Number.isFinite(d) && d > 0)) probe(f, id); }, 4000);
  };
  const applyLength = (seconds) => {
    const dur = Math.floor(seconds * 10) / 10; // tenths, never beyond the real end
    setDuration(dur);
    setSplitAt((s) => Math.min(Math.max(tenth(s), 0.1), tenth(dur - 0.1)));
  };
  const probe = async (f, id, playable = false) => {
    if (fileIdRef.current !== id || probedRef.current === id) return;
    probedRef.current = id;
    if (!playable) setNoPreview(true);
    try {
      const seconds = await ffmpegAudioDuration(f);
      if (fileIdRef.current === id) applyLength(seconds);
    } catch (e) {
      if (fileIdRef.current === id) setError(`This file could not be read (${e.message || e}). Please try another file or format.`);
    }
  };
  const onLoaded = () => {
    const d = audioRef.current.duration;
    if (Number.isFinite(d) && d > 0) applyLength(d);
    else probe(file, fileIdRef.current, true); // plays, but no length in its header (a MediaRecorder WebM: Infinity)
  };

  const split = async () => {
    if (!file) return;
    if (splitAt <= 0 || splitAt >= duration) {
      setError('Split point must be within the audio duration.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      // ffmpeg.wasm's own stderr/stdout -- this is where the real reason for
      // a failure lives. Without this, a failed exec() surfaces only as a
      // generic rejection with no way to diagnose what actually happened.
      ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));
      await ffmpeg.load();
      const inputName = 'input.' + sanitizedInputExt(file);
      const { extraArgs, mime, ext } = buildOutputSpec(format);
      const part1Name = 'part1.' + ext;
      const part2Name = 'part2.' + ext;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const baseName = file.name.replace(/\.[^.]+$/, '');
      // Cut in the filter graph (atrim: to the sample, whatever the source's frame size). Measured 28/09/2026
      // (cut-join-audit.mjs): WAV, FLAC, MP3, OGG parts meet with 0 ms of gap or overlap; M4A's part 1 still lasts
      // 17 ms more -- the AAC encoder's last frame, the same with the former "-t", not the cut.
      const cuts = [`atrim=end=${splitAt},asetpts=PTS-STARTPTS`, `atrim=start=${splitAt},asetpts=PTS-STARTPTS`];
      if (opusOnService(format)) { // cut here, losslessly; each part encoded with libopus on our service (lib/opusService.js)
        const parts = [];
        for (const [i, cut] of cuts.entries()) {
          await ffmpeg.exec(['-i', inputName, '-af', cut, '-vn', ...LOSSLESS_INTERMEDIATE.args, LOSSLESS_INTERMEDIATE.name]);
          const name = `part${i + 1}_${baseName}`;
          parts.push({ url: URL.createObjectURL(await encodeOpusOnService(await ffmpeg.readFile(LOSSLESS_INTERMEDIATE.name), name)), name: name + '.opus' });
        }
        setResults(parts);
      } else {
        await ffmpeg.exec(['-i', inputName, '-af', cuts[0], '-vn', ...extraArgs, part1Name]);
        await ffmpeg.exec(['-i', inputName, '-af', cuts[1], '-vn', ...extraArgs, part2Name]);
        const data1 = await ffmpeg.readFile(part1Name);
        const data2 = await ffmpeg.readFile(part2Name);
        setResults([
          { url: URL.createObjectURL(new Blob([data1.buffer], { type: mime })), name: 'part1_' + baseName + '.' + ext },
          { url: URL.createObjectURL(new Blob([data2.buffer], { type: mime })), name: 'part2_' + baseName + '.' + ext },
        ]);
      }
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Split failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      reportToolError({ tool: 'audio-splitter', file, error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Split failed: ' + reason);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Splitter</h1>
        <p className="text-neutral-500 text-center mb-8">Split audio into multiple parts</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          {audioUrl && !noPreview && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} onError={() => probe(file, fileIdRef.current)} controls className="w-full" />}
          {noPreview && !error && <p className="text-sm text-neutral-600" role="status">{duration > 0 ? 'This browser cannot play this format, so there is no preview; splitting works the same.' : 'Reading the file…'}</p>}
          {duration > 0 && (
            <div>
              <label htmlFor="split-at" className="block text-sm text-neutral-500 mb-1">Split at (seconds, to 0.1): {splitAt}s (of {duration}s)</label>
              <input id="split-at" type="number" min={0.1} max={tenth(duration - 0.1)} step={0.1} value={splitAt} onChange={e => setSplitAt(Math.min(tenth(duration - 0.1), Math.max(0.1, tenth(Number(e.target.value) || 0))))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-sm mb-2" />
              <input type="range" min={0.1} max={tenth(duration - 0.1)} step={0.1} value={splitAt} onChange={e => setSplitAt(tenth(Number(e.target.value)))} className="w-full" aria-label="Split point slider" />
            </div>
          )}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Output Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <button onClick={split} disabled={!file || loading || !(duration > 0)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Splitting...' : 'Split Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {results.map((r, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Part {i+1}</p>
              <audio controls src={r.url} className="w-full" />
              <a href={r.url} download={r.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Part {i+1}</a>
            </div>
          ))}
        </div>
      </div>
      <SeoContent
        title="Audio Splitter"
        description="Audio Splitter cuts an audio file into two parts at a single point you choose, using ffmpeg.wasm in your browser — nothing is uploaded, except for Opus, which our own server encodes with libopus and then deletes. Move the slider to set exactly where the split happens, and pick the output format for both parts from a dropdown."
        howTo={[
          "Click the upload area and select an audio file.",
          "Type the split point to a tenth of a second, or use the slider.",
          "Choose an output format for both resulting parts.",
          "Click \"Split Audio\" to process it locally.",
          "Preview and download Part 1 and Part 2 separately."
        ]}
        faqs={[
          { q: "Can I split into more than two parts?", a: "Not in a single pass — this tool creates exactly two parts at one split point. Run the tool again on one of the resulting parts if you need further splits." },
          { q: "What output format do the parts use?", a: "Your source's own format by default when it can be written here, otherwise MP3; or your choice — MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3 — applied to both parts. The cut is made to the sample: measured on WAV, FLAC, MP3 and OGG, the two parts put back together last exactly as long as the original; with M4A (AAC) and WMA, whose audio comes in fixed-size frames, a part can be up to a tenth of a second longer or shorter (measured: M4A +17 ms, WMA −0.1 s)." },
          { q: "Is there a file size limit?", a: "No hard limit is enforced by the tool — you're limited by your browser's available memory." },
          { q: "Is my file uploaded anywhere?", a: "For every format except Opus, no: processing happens in your browser via ffmpeg.wasm. For Opus, the processed audio is sent to our own server (not a third party), encoded with the reference libopus encoder (the in-browser one is not as good), and deleted as soon as you have downloaded the result." }
        ]}
        tips={[
          "Preview the audio near your intended split point first to make sure you're cutting at the right moment.",
          "Pick the same format as your source if you want to avoid a lossy re-encode.",
          "To split a file into more than two pieces, run this tool again on each resulting part.",
          "The first split after loading the page takes longer since the ffmpeg.wasm engine needs to download."
        ]}
      />
    </div>
  );
}
