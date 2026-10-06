'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { AUDIO_OUTPUT_FORMATS, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';
import { opusOnService, encodeOpusOnService, LOSSLESS_INTERMEDIATE } from '../../../lib/opusService';
import { ffmpegAudioDuration } from '../../../lib/audioDuration';
import PlayablePreview from '../../../components/PlayablePreview';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { execChecked } from '../../../lib/ffmpegRun';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

const tenth = (x) => Math.round(x * 10) / 10;
const MAX_PARTS = 100;
const MIN_PART = 0.1; // seconds

// Where the parts start and end, in seconds; the last part runs to the real end of the file (end: null).
// P19 (01/10): the split point used to default to 30 s, clamped to the end — 5.9 s of a 6 s file, a 0.1 s part 2.
// Split tools of the market offer equal parts (NoteVibes: 2, 3, 4, 5 or 10; ChunkAudio: pieces of N seconds;
// AudioMultiCut: several points); mp3cut (123apps) and Clideo only trim. Here: one point (in the MIDDLE by default),
// N equal parts, or a piece every N seconds.
function splitSegments(mode, { splitAt, parts, every }, exact) {
  let cuts = [];
  if (mode === 'point') cuts = [splitAt];
  else if (mode === 'equal') cuts = Array.from({ length: parts - 1 }, (_, k) => Math.round(((k + 1) * exact / parts) * 1000) / 1000);
  else if (mode === 'every') for (let t = every; t < exact - MIN_PART / 2 && cuts.length <= MAX_PARTS; t += every) cuts.push(Math.round(t * 1000) / 1000);
  const starts = [0, ...cuts];
  return starts.map((start, i) => ({ start, end: i < cuts.length ? cuts[i] : null }));
}

export default function AudioSplitterPage() {
  const [file, setFile] = useState(null);
  const [splitAt, setSplitAt] = useState(0);
  const [mode, setMode] = useState('point'); // 'point' | 'equal' | 'every'
  const [parts, setParts] = useState(2);
  const [every, setEvery] = useState(60);
  const [duration, setDuration] = useState(0);
  const [exact, setExact] = useState(0); // the real length, unrounded (equal parts are cut on it)
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useToolError('');
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
    setExact(0);
    setSplitAt(0);
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
    setExact(seconds);
    setSplitAt(Math.min(Math.max(tenth(seconds / 2), 0.1), tenth(dur - 0.1))); // the middle of the file
    // a piece every minute by default, or every tenth of the file when it is shorter than two minutes
    setEvery(seconds >= 120 ? 60 : Math.max(MIN_PART, tenth(seconds / 10)));
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

  const segments = duration > 0 ? splitSegments(mode, { splitAt, parts, every }, exact) : [];
  const tooMany = segments.length > MAX_PARTS;
  const shortest = segments.length ? Math.min(...segments.map((g) => (g.end ?? exact) - g.start)) : 0;
  const split = async () => {
    if (!file) return;
    if (mode === 'point' && (splitAt <= 0 || splitAt >= duration)) {
      setError('Split point must be within the audio duration.');
      return;
    }
    if (segments.length < 2 || tooMany || shortest < MIN_PART - 0.0005) {
      setError(tooMany ? `At most ${MAX_PARTS} parts: choose longer pieces.` : 'Each part must last at least 0.1 s: choose fewer parts or longer pieces.');
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
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const baseName = file.name.replace(/\.[^.]+$/, '');
      // Cut in the filter graph (atrim: to the sample, whatever the source's frame size). Measured 28/09/2026
      // (cut-join-audit.mjs): WAV, FLAC, MP3, OGG parts meet with 0 ms of gap or overlap; M4A's part 1 still lasts
      // 17 ms more -- the AAC encoder's last frame, the same with the former "-t", not the cut.
      // Same filter for 2 or 100 parts: every part is its own atrim of the source, so the parts meet exactly.
      const cuts = segments.map(({ start, end }) => `atrim=${[start ? `start=${start}` : '', end != null ? `end=${end}` : ''].filter(Boolean).join(':')},asetpts=PTS-STARTPTS`);
      const width = String(cuts.length).length; // part01…part12: the files sort in order
      const partName = (i) => `part${String(i + 1).padStart(width, '0')}_${baseName}`;
      const out = [];
      for (const [i, cut] of cuts.entries()) {
        if (opusOnService(format)) { // cut here, losslessly; each part encoded with libopus on our service (lib/opusService.js)
          await execChecked(ffmpeg, ['-i', inputName, '-af', cut, '-vn', ...LOSSLESS_INTERMEDIATE.args, LOSSLESS_INTERMEDIATE.name]);
          out.push({ url: URL.createObjectURL(await encodeOpusOnService(await ffmpeg.readFile(LOSSLESS_INTERMEDIATE.name), partName(i))), name: partName(i) + '.opus' });
        } else {
          const tmp = `part${i + 1}.${ext}`;
          await execChecked(ffmpeg, ['-i', inputName, '-af', cut, '-vn', ...extraArgs, tmp]);
          const data = await ffmpeg.readFile(tmp);
          await ffmpeg.deleteFile(tmp); // 100 parts of a long file would otherwise stay twice in memory
          out.push({ url: URL.createObjectURL(new Blob([data.buffer], { type: mime })), name: `${partName(i)}.${ext}` });
        }
      }
      setResults(out);
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
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          {audioUrl && !noPreview && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} onError={() => probe(file, fileIdRef.current)} controls className="w-full" />}
          {noPreview && !error && <p className="text-sm text-neutral-600" role="status">{duration > 0 ? 'This browser cannot play this format, so there is no preview; splitting works the same.' : 'Reading the file…'}</p>}
          {duration > 0 && (
            <div>
              <div role="radiogroup" aria-label="How to split" className="grid grid-cols-3 gap-2 mb-3">
                {[['point', 'At one point'], ['equal', 'Equal parts'], ['every', 'Every N seconds']].map(([id, label]) => (
                  <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => { setMode(id); setResults([]); setError(''); }}
                    className={`rounded-lg py-2 text-sm font-semibold border ${mode === id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-700 border-neutral-200 hover:border-indigo-400'}`}>{label}</button>
                ))}
              </div>
              {mode === 'point' && (<>
                <label htmlFor="split-at" className="block text-sm text-neutral-500 mb-1">Split at (seconds, to 0.1): {splitAt}s (of {duration}s)</label>
                <input id="split-at" type="number" min={0.1} max={tenth(duration - 0.1)} step={0.1} value={splitAt} onChange={e => setSplitAt(Math.min(tenth(duration - 0.1), Math.max(0.1, tenth(Number(e.target.value) || 0))))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-sm mb-2" />
                <input type="range" min={0.1} max={tenth(duration - 0.1)} step={0.1} value={splitAt} onChange={e => setSplitAt(tenth(Number(e.target.value)))} className="w-full" aria-label="Split point slider" />
              </>)}
              {mode === 'equal' && (<>
                <label htmlFor="split-parts" className="block text-sm text-neutral-500 mb-1">Number of equal parts (2 to {MAX_PARTS})</label>
                <input id="split-parts" type="number" min={2} max={MAX_PARTS} step={1} value={parts} onChange={e => setParts(Math.min(MAX_PARTS, Math.max(2, Math.round(Number(e.target.value) || 2))))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-sm" />
              </>)}
              {mode === 'every' && (<>
                <label htmlFor="split-every" className="block text-sm text-neutral-500 mb-1">One part every (seconds, to 0.1)</label>
                <input id="split-every" type="number" min={0.1} step={0.1} value={every} onChange={e => setEvery(Math.max(0.1, tenth(Number(e.target.value) || 0.1)))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-sm" />
              </>)}
              <p className="text-xs text-neutral-600 mt-2" data-split-plan>
                {tooMany ? `That makes more than ${MAX_PARTS} parts. Choose longer pieces.`
                  : shortest < MIN_PART - 0.0005 ? 'Each part must last at least 0.1 s.'
                  : segments.length < 2 ? 'The piece is as long as the file: nothing to split.'
                  : `${segments.length} parts: ${segments.slice(0, 4).map((g) => `${tenth(g.start)}–${tenth(g.end ?? exact)} s`).join(', ')}${segments.length > 4 ? ', …' : ''}`}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Output Format</label>
            <select aria-label="Output Format" value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <button onClick={split} disabled={!file || loading || !(duration > 0) || segments.length < 2 || tooMany} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Splitting...' : 'Split Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {results.length > 0 && (
            <DownloadGroup zipName={(file?.name || 'audio').replace(/\.[^.]+$/, '') + '-parts.zip'} className="space-y-4">
              {results.map((r, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">Part {i+1}</p>
                  <PlayablePreview src={r.url} name={r.name} />
                  <FileDownload href={r.url} name={r.name} note={`part ${i + 1}`} />
                </div>
              ))}
            </DownloadGroup>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Splitter"
        description={`Audio Splitter cuts one audio file into several files. Choose a single split point (the middle by default), 2 to ${MAX_PARTS} equal parts, or one part every N seconds; before you split, the page shows how many parts you will get and where the first ones start and end. Each part is cut to the sample and encoded in the format you pick from 18 choices, the same for all parts. Formats your browser cannot play, such as WMA, are measured by ffmpeg.wasm and split the same way. The cutting is done in the page; for Opus, each part is encoded separately on our media service.`}
        howToTitle="How to split an audio file into parts"
        howTo={[
          `Pick or drop the recording to cut; the page reads its length, even when there is no player for its format.`,
          `Choose "At one point", "Equal parts" or "Every N seconds", then set the point, the number of parts or the length of each part.`,
          `Check the line that lists the parts, then choose the "Output Format".`,
          `Click "Split Audio".`,
          `Play each part, then click "Download" for one of them or "Download all" for a ZIP.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Output formats`, value: `MP3, WAV, AAC, FLAC, OGG (Vorbis), M4A, Opus, WMA, AIFF, ALAC, AC3, M4R, M4B, MP2, WV (WavPack), CAF, AU, MKA` },
          { label: `Parts`, value: `2 to ${MAX_PARTS} per run, each at least ${MIN_PART} s long` },
          { label: `Precision`, value: `Cut to the sample. In a test of 28/09/2026, WAV, FLAC, MP3 and OGG parts put back together matched the original length; M4A added 17 ms and WMA lost 0.1 s.` },
          { label: `Usage limits`, value: `Opus only: each part is a separate job on our media service, counted in an hourly and daily allowance per connection, with a maximum size and length per part.` },
        ]}
        privacy={`The file is cut in your browser by ffmpeg.wasm, except when the output is Opus. Then each part is rendered here as FLAC and sent on its own to our media service for libopus encoding; each part's FLAC is removed there once encoded, and its Opus file after your browser takes it or a set time. A failed split leaves us one report: its cleaned message, the tool, the file's extension and size range, and your browser with its version.`}
        faqs={[
          { q: `Can I split into more than two parts?`, a: `Yes. "Equal parts" makes 2 to ${MAX_PARTS} parts of the same length, and "Every N seconds" makes a part every N seconds, with the remainder in the last one. Each run allows at most ${MAX_PARTS} parts of at least ${MIN_PART} s.` },
          { q: `Does the splitter keep my file's format?`, a: `Yes, when its extension matches one of the 18 outputs: a .flac stays FLAC and a .wav stays WAV, written in 16 bits. Other extensions, such as .aif or .amr, default to MP3, and an Apple Lossless .m4a defaults to M4A (AAC). You can pick any of the 18 formats for all parts.` },
          { q: `Will splitting lose quality?`, a: `Yes for lossy formats: every part is encoded again, even in the source format, so an MP3 is compressed a second time. Parts saved as FLAC or ALAC are exact; WAV and AIFF parts come out at 16 bits, which trims a deeper recording.` },
          { q: `Do Opus parts go through a server?`, a: `Yes, each one is sent to our media service as a separate job, so a long split can reach the hourly or daily job allowance of your connection. Any part in another format is cut and encoded right in this tab.` },
        ]}
        tips={[
          `To keep a single passage instead of splitting the whole file, use Audio Trimmer.`,
          `Put parts back together, in any order, with Audio Merger.`,
        ]}
      />
    </div>
  );
}
