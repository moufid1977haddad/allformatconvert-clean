'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { COMPRESSIBLE_AUDIO_FORMATS, buildOutputSpec, sanitizedInputExt, AUDIO_SAMPLE_RATES } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';
import { opusOnService, encodeOpusOnService, LOSSLESS_INTERMEDIATE } from '../../../lib/opusService';
import PlayablePreview from '../../../components/PlayablePreview';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';

// kb/s of the source's audio: the stream's own figure from ffmpeg ("Audio: aac …, 57 kb/s"), else the file's average.
function sourceKbps(log, bytes) {
  const stream = log.match(/Stream #[^\n]*Audio:[^\n]*?(\d+) kb\/s/);
  if (stream) return Number(stream[1]);
  const d = log.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const secs = d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0;
  return secs > 0 ? (bytes * 8) / secs / 1000 : 0;
}

export default function AudioCompressorPage() {
  const [file, setFile] = useState(null);
  const [bitrate, setBitrate] = useState('128');
  const [format, setFormat] = useState('mp3');
  // P24 (03/10): mono and a lower sample rate, the two other ways to shrink speech (123apps: channels, sample rate)
  const [mono, setMono] = useState(false);
  const [sampleRate, setSampleRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0];
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; } e.target.value = ''; setFile(f); setResult(null); };

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      // ffmpeg.wasm's own stderr/stdout -- this is where the real reason for
      // a failure lives. Without this, a failed exec() surfaces only as a
      // generic rejection with no way to diagnose what actually happened.
      const logs = [];
      ffmpeg.on('log', ({ message }) => { logs.push(message); console.log('[ffmpeg]', message); });
      await ffmpeg.load();
      const inputName = 'input.' + sanitizedInputExt(file);
      const { outputName, extraArgs, mime, ext } = buildOutputSpec(format, undefined, opusOnService(format) ? {} : { sampleRate, channels: mono ? 1 : '' });
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      // The source's real bitrate (28/09, owner: a 0.05 MB iPhone memo "compressed" at 128 kbps came out twice as big):
      // never encode above it. ffmpeg reports the audio stream's own kb/s; else size × 8 / duration.
      await ffmpeg.exec(['-hide_banner', '-i', inputName]).catch(() => {});
      const srcKbps = sourceKbps(logs.join('\n'), file.size);
      const kbps = srcKbps ? Math.min(Number(bitrate), Math.max(8, Math.floor(srcKbps))) : Number(bitrate);
      let blob;
      if (opusOnService(format)) { // decoded here to lossless FLAC; libopus at the chosen bitrate on our service (lib/opusService.js)
        await ffmpeg.exec(['-i', inputName, ...LOSSLESS_INTERMEDIATE.args, LOSSLESS_INTERMEDIATE.name]);
        blob = await encodeOpusOnService(await ffmpeg.readFile(LOSSLESS_INTERMEDIATE.name), 'compressed', { kbps });
      } else {
        if (await ffmpeg.exec(['-i', inputName, '-b:a', kbps + 'k', ...extraArgs, outputName]) !== 0) throw new Error('ffmpeg could not write this format with these settings. Try another output format, sample rate or quality.'); // P24: exit code checked
        const data = await ffmpeg.readFile(outputName);
        blob = new Blob([data.buffer], { type: mime });
      }
      const url = URL.createObjectURL(blob);
      const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1);
      setResult({ url, name: 'compressed_' + file.name.replace(/\.[^.]+$/, '') + '.' + ext, originalSize: formatBytes(file.size), newSize: formatBytes(blob.size), reduction, larger: blob.size >= file.size, srcKbps, kbps, asked: Number(bitrate) });
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Compression failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      reportToolError({ tool: 'audio-compressor', file, error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Compression failed: ' + reason);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress audio files to reduce size</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Bitrate: {bitrate} kbps</label>
            <div className="flex gap-2">
              {['64', '96', '128', '192', '256', '320'].map(b => (
                <button key={b} onClick={() => setBitrate(b)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${bitrate === b ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{b}k</button>
              ))}
            </div>
          </div>
          {!opusOnService(format) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex items-center gap-2"><input id="acp-mono" type="checkbox" checked={mono} onChange={e => setMono(e.target.checked)} /> Mono (half the data for speech)</label>
              <label className="block"><span className="block text-neutral-500 mb-1">Sample rate</span>
                <select id="acp-rate" value={sampleRate} onChange={e => setSampleRate(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">{AUDIO_SAMPLE_RATES.map(([v, l]) => <option key={l} value={v}>{l}</option>)}</select></label>
            </div>
          )}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Output Format</label>
            <select aria-label="Output Format" value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {COMPRESSIBLE_AUDIO_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Compressing...' : 'Compress Audio'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Original</div><div className="font-bold text-sm">{result.originalSize} MB</div></div>
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">Compressed</div><div className="font-bold text-sm text-indigo-600">{result.newSize} MB</div></div>
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200"><div className="text-xs text-neutral-500">{result.larger ? 'Larger by' : 'Saved'}</div><div className={`font-bold text-sm ${result.larger ? 'text-amber-700' : 'text-green-600'}`} data-saved>{result.larger ? `${Math.abs(result.reduction)}%` : `${result.reduction}%`}</div></div>
              </div>
              {result.kbps < result.asked && <p className="text-xs text-neutral-600 text-center" data-capped>Your file is already at about {Math.round(result.srcKbps)} kbps, so it was encoded at {result.kbps} kbps instead of {result.asked} — a higher bitrate would only make it bigger.</p>}
              {result.larger ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 space-y-1" data-larger>
                  <p className="font-semibold">Your file is already well compressed.</p>
                  <p>Re-encoding it gives {result.newSize} MB, not less than your {result.originalSize} MB: keep your original. The re-encoded file is below only if you need this format.</p>
                </div>
              ) : null}
              <PlayablePreview src={result.url} name={result.name} />
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Compressor"
        description="Audio Compressor reduces an audio file's size by re-encoding it at a lower bitrate (64–320 kbps) using ffmpeg.wasm in your browser (Opus is encoded at the chosen bitrate by our own server with libopus, then deleted). Note: this is bitrate-based file-size compression — it does not apply dynamic-range compression (threshold/ratio/attack/release) despite the tool's name. Output format is your choice among the bitrate-controllable codecs (MP3, AAC, M4A, OGG, Opus, WMA, AC3) — lossless formats like WAV and FLAC aren't offered here since a bitrate target doesn't apply to them."
        howTo={[
          "Click the upload area and select an audio file.",
          "Choose a target bitrate from the presets (64k–320k).",
          "Pick an output format — MP3 is the most universally compatible.",
          "Click \"Compress Audio\": the file is re-encoded in your browser (Opus by our own server, then deleted).",
          "Compare the before/after size and download the result."
        ]}
        faqs={[
          { q: "Does this apply dynamic-range compression?", a: "No — despite the name, this tool re-encodes your audio at a lower bitrate to shrink file size. It doesn't touch the audio's dynamic range (loud vs. quiet parts)." },
          { q: "What output format do I get?", a: "Your choice among MP3, AAC, M4A, OGG, Opus, WMA, and AC3 — all bitrate-controllable, lossy codecs where a lower bitrate actually shrinks the file. Lossless formats (WAV, FLAC) aren't offered since bitrate compression doesn't apply to them." },
          { q: "Is there a file size limit?", a: "No hard limit is enforced by the tool — very large files are limited only by your browser's available memory." },
          { q: "Is my file uploaded anywhere?", a: "For every format except Opus, no: processing happens in your browser via ffmpeg.wasm. For Opus, the processed audio is sent to our own server (not a third party), encoded with the reference libopus encoder (the in-browser one is not as good), and deleted as soon as you have downloaded the result." }
        ]}
        tips={[
          "128 kbps is a reasonable default for most music; drop to 64–96 kbps for voice-only content where size matters most.",
          "Lower bitrates noticeably reduce quality for complex music — compare the audio preview before committing.",
          "The first compression after loading the page takes longer since the ffmpeg.wasm engine needs to download.",
          "If you need real dynamic-range compression (leveling loud and quiet parts), you'll need a dedicated audio-editing tool — this one only changes bitrate."
        ]}
      />
    </div>
  );
}
