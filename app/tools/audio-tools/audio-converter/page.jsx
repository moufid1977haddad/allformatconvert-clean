'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import ProgressBar from '../../../components/ProgressBar';
import { AUDIO_OUTPUT_FORMATS, AUDIO_BITRATES, DEFAULT_AUDIO_KBPS, formatTakesBitrate, buildOutputSpec, sanitizedInputExt, AUDIO_SAMPLE_RATES, AUDIO_CHANNELS, audioOutputProblem } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';
import { runMediaJob, mediaServiceConfigured } from '../../../lib/mediaJob';
import PlayablePreview from '../../../components/PlayablePreview';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function AudioConverterPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [kbps, setKbps] = useState(DEFAULT_AUDIO_KBPS);
  const [sampleRate, setSampleRate] = useState('');
  const [channels, setChannels] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const fileRef = useRef();
  const ffmpegRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; }
    e.target.value = '';
    setFile(f);
    setResult(null);
    setError('');
  };

  const cancel = () => {
    if (ffmpegRef.current) {
      ffmpegRef.current.terminate();
      ffmpegRef.current = null;
    }
    setLoading(false);
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setError('');
    // Opus: encoded on our media service with the real libopus (what the reference converters use).
    // libopus crashes inside the browser's ffmpeg.wasm, reproduced 2026-09-23 (see lib/audioFormats.js).
    if (format === 'opus' && mediaServiceConfigured()) {
      try {
        const out = await runMediaJob({
          file, op: 'convert', params: { target: 'opus', quality: 'medium' },
          onStage: (s) => { if (typeof s.pct === 'number') setProgress(Math.round(s.pct)); },
        });
        if (!out.bytes || out.ext !== 'opus') throw new Error('The service returned no Opus file.');
        // Re-typed: sent as audio/ogg, Firefox saved "x.opus" as "x.ogg" (measured 26/09/2026 on the other audio tools).
        setResult({ url: URL.createObjectURL(new Blob([out.blob], { type: 'audio/opus' })), name: file.name.replace(/\.[^.]+$/, '') + '.opus' });
        setProgress(100);
      } catch (e) {
        reportToolError({ tool: 'audio-converter', file, error: e instanceof Error ? e : new Error(String(e)) });
        setError('Conversion failed: ' + (e?.message || 'unknown error'));
      }
      setLoading(false);
      return;
    }
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      // ffmpeg.wasm's own stderr/stdout -- this is where the real reason for
      // a failure lives (e.g. an unsupported input format). Without this, a
      // failed exec() surfaces only as a generic rejection with no way to
      // diagnose what actually happened.
      ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(Math.min(1, Math.max(0, progress)) * 100));
      });
      await ffmpeg.load();
      const inputName = 'input.' + sanitizedInputExt(file);
      const { outputName, extraArgs, mime, ext } = buildOutputSpec(format, kbps, format === 'opus' ? {} : { sampleRate, channels });
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      // P24: ffmpeg.exec resolves even when ffmpeg fails — its exit code is checked (a failed run must never look done)
      if (await ffmpeg.exec(['-i', inputName, ...extraArgs, outputName]) !== 0) throw new Error('ffmpeg could not write this format with these settings. Try another output format, sample rate or quality.');
      const data = await ffmpeg.readFile(outputName);
      const bad = audioOutputProblem(format, data); // P31: never offer a file that is not the format named
      if (bad) throw new Error(bad);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
      setResult({ url, name: file.name.replace(/\.[^.]+$/, '') + '.' + ext });
      setProgress(100);
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Conversion failed:', e);
      if (ffmpegRef.current) {
        const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
        reportToolError({ tool: 'audio-converter', file, error: e instanceof Error ? e : new Error(String(reason)) });
        setError('Conversion failed: ' + reason);
      }
    }
    ffmpegRef.current = null;
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert audio to MP3, WAV, AAC, FLAC and more</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Format</label>
            <select aria-label="Target Format" value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {format === 'm4r' && (
              <p className="mt-2 text-xs text-neutral-600" data-ringtone-help>
                An iPhone ringtone lasts 40 seconds at most. To install it: on the iPhone, with Apple&apos;s GarageBand app; on a computer, with the Finder (Mac) or iTunes (Windows) while the iPhone is connected.
              </p>
            )}
            {formatTakesBitrate(format) && (
              <div className="mt-3">
                <label className="block text-sm text-neutral-500 mb-1">Quality</label>
                <select aria-label="Quality" value={kbps} onChange={e => setKbps(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
                  {AUDIO_BITRATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            )}
            {format !== 'opus' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block"><span className="block text-sm text-neutral-500 mb-1">Sample rate</span>
                  <select id="ac-rate" value={sampleRate} onChange={e => setSampleRate(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">{AUDIO_SAMPLE_RATES.map(([v, l]) => <option key={l} value={v}>{l}</option>)}</select></label>
                <label className="block"><span className="block text-sm text-neutral-500 mb-1">Channels</span>
                  <select id="ac-channels" value={channels} onChange={e => setChannels(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">{AUDIO_CHANNELS.map(([v, l]) => <option key={l} value={v}>{l}</option>)}</select></label>
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Converting…" />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
              Convert Audio
            </button>
          )}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <PlayablePreview src={result.url} name={result.name} />
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Converter"
        description={`Audio Converter turns one audio file into another format. It writes 18 formats: MP3, WAV, AAC, FLAC, OGG Vorbis, M4A, Opus, WMA, AIFF, ALAC, AC3, M4R (iPhone ringtone), M4B (audiobook), MP2, WavPack, CAF, AU and MKA. For lossy targets except Opus, which is always made at 128 kbit/s, you pick the bitrate; for every target but Opus you can also change the sample rate or mix to mono or stereo. ffmpeg.wasm converts on this page; only an Opus target sends your original file to our media service. It handles one file at a time, and its picker lists audio files only: for the sound of a video, use Video to Audio.`}
        howToTitle="How to convert an audio file to another format"
        howTo={[
          `Pick or drop the one audio file you want in another format.`,
          `Choose the "Target Format".`,
          `For a lossy format, pick the "Quality"; if needed, set "Sample rate" and "Channels".`,
          `Click "Convert Audio" and follow the progress bar.`,
          `Play the result, then click "Download" to save it under your file name with the new extension.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AC3, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Output formats`, value: `MP3, WAV, AAC, FLAC, OGG (Vorbis), M4A, Opus, WMA, AIFF, ALAC, AC3, M4R, M4B, MP2, WV (WavPack), CAF, AU, MKA` },
          { label: `Quality`, value: `128, 192 (default), 256 or 320 kbps for MP3, AAC, M4A, M4R, M4B, OGG, WMA, AC3 and MP2, written as chosen. Opus: 128 kbit/s.` },
          { label: `Sample rate and channels`, value: `Keep the original, or 48 down to 8 kHz (OGG, AC3 and MP2: 48, 44.1 or 32 kHz only); mono or stereo. Not offered for Opus.` },
          { label: `Files at once`, value: `One` },
          { label: `Usage limits`, value: `Opus target: our media service counts conversions per connection per hour and per day, and refuses files over its maximum size or length.` },
        ]}
        privacy={`Every target except Opus is converted in your browser by ffmpeg.wasm, downloaded from unpkg.com. For Opus, your original file is uploaded in pieces to our media service, converted with libopus at 128 kbit/s and downloaded back by the page; the service removes your upload as soon as the conversion ends and the Opus file once it has been downloaded, or after a set time. A failed conversion sends us its cleaned message, the file extension, a size range and your browser's name and version.`}
        faqs={[
          { q: `Can I convert several files at once?`, a: `No. The converter takes one file per run, and the picker does not allow more. Pick the next file after the first download. To join several files into one instead, use Audio Merger.` },
          { q: `Can I change the bitrate, sample rate or channels?`, a: `Yes. "Quality" offers 128 to 320 kbps for the lossy formats, "Sample rate" goes from 48 kHz down to 8 kHz, and "Channels" gives mono or stereo. A rate a format cannot store, such as 22.05 kHz for OGG, is refused with a sentence before encoding.` },
          { q: `Can I make an iPhone ringtone?`, a: `Yes. Choose M4R as the target: the page reminds you that a ringtone lasts 40 seconds at most and how to install it with GarageBand, the Finder or iTunes. Shorten a longer song first with Audio Trimmer.` },
          { q: `Can it convert to AMR?`, a: `No. AMR files can be read, but the ffmpeg build used here has no AMR encoder, so AMR is not in the list of targets. Convert to M4A or MP3 for a small speech file instead.` },
          { q: `Which formats are made on your server?`, a: `Opus only: the whole original file goes to our media service, which counts conversions per connection per hour and per day and refuses files over its maximum size or length. Any other target is produced by ffmpeg.wasm without leaving the tab.` },
        ]}
        tips={[
          `To take the sound out of a video, use Video to Audio: it offers the same 18 formats.`,
          `ALAC writes Apple Lossless audio inside a .m4a file, the way Apple Lossless files are usually stored.`,
        ]}
      />
    </div>
  );
}
