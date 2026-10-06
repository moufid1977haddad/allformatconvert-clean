'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { AUDIO_OUTPUT_FORMATS, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';
import { opusOnService, encodeOpusOnService, LOSSLESS_INTERMEDIATE } from '../../../lib/opusService';
import PlayablePreview from '../../../components/PlayablePreview';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function AudioBoosterPage() {
  const [file, setFile] = useState(null);
  const [volume, setVolume] = useState(2);
  const [format, setFormat] = useState('mp3');
  // Limiter (29/09): a plain gain cut the waveform flat as soon as the boosted signal passed full scale (a 0.5
  // sine boosted 4x: 67 % of the samples clipped). As mp3louder offers, a limiter now holds the peaks under
  // 0.95 (ffmpeg's alimiter, automatic level off) -- on by default, can be turned off for the raw gain.
  const [limiter, setLimiter] = useState(true);
  const [normalize, setNormalize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0];
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; } e.target.value = ''; setFile(f); setResult(null); };

  const boost = async () => {
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
      const { outputName, extraArgs, mime, ext } = buildOutputSpec(format);
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const base = file.name.replace(/\.[^.]+$/, '');
      // P24 (03/10): FreeConvert sets any volume from 0 % (ours went 1× to 5× only) and normalising is the other common
      // need (podcasts, voice memos): EBU R128 loudness to -16 LUFS, true peak -1.5 dB (ffmpeg loudnorm)
      // loudnorm works (and outputs) at 192 kHz: resampled back to the source's own rate, read from ffmpeg's report
      if (normalize) await ffmpeg.exec(['-hide_banner', '-i', inputName]).catch(() => {});
      const srcRate = Number((/, (\d{4,6}) Hz/.exec(logs.join('\n')) || [])[1]) || 48000;
      // (an aresample filter after loudnorm fails channel negotiation in this ffmpeg build: the rate is set on the output)
      const rateArgs = normalize ? ['-ar', String(srcRate)] : [];
      const af = normalize ? 'loudnorm=I=-16:TP=-1.5:LRA=11' : limiter && volume > 1 ? `volume=${volume},alimiter=limit=0.95:level=0` : `volume=${volume}`;
      if (opusOnService(format)) { // boosted here, losslessly; libopus on our service (lib/opusService.js)
        // ffmpeg.exec resolves even when ffmpeg fails: its exit code is checked, never a stale or empty file handed over
        if (await ffmpeg.exec(['-i', inputName, '-af', af, ...rateArgs, ...LOSSLESS_INTERMEDIATE.args, LOSSLESS_INTERMEDIATE.name]) !== 0) throw new Error('The audio could not be processed. Please try another file or output format.');
        const opus = await encodeOpusOnService(await ffmpeg.readFile(LOSSLESS_INTERMEDIATE.name), 'boosted_' + base);
        setResult({ url: URL.createObjectURL(opus), name: 'boosted_' + base + '.opus' });
      } else {
        if (await ffmpeg.exec(['-i', inputName, '-af', af, ...rateArgs, ...extraArgs, outputName]) !== 0) throw new Error('The audio could not be processed. Please try another file or output format.');
        const data = await ffmpeg.readFile(outputName);
        if (!data || !data.byteLength) throw new Error('The audio could not be processed: the result was empty.');
        const url = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
        setResult({ url, name: 'boosted_' + base + '.' + ext });
      }
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Boost failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      reportToolError({ tool: 'audio-booster', file, error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Boost failed: ' + reason);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Booster</h1>
        <p className="text-neutral-500 text-center mb-8">Boost and increase audio volume</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Volume Boost: {volume}x</label>
            <input aria-label="Volume Boost" type="range" min={0.25} max={5} step={0.25} value={volume} disabled={normalize} onChange={e => setVolume(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-neutral-400 mt-1"><span>0.25x (quieter)</span><span>1x (normal)</span><span>5x (max)</span></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700"><input id="ab-normalize" type="checkbox" checked={normalize} onChange={e => { setNormalize(e.target.checked); setResult(null); }} />Normalize instead (even loudness at -16 LUFS)</label>
          <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={limiter} onChange={e => { setLimiter(e.target.checked); setResult(null); }} />Prevent distortion (limiter: loud peaks are held just under full scale instead of being cut flat)</label>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Output Format</label>
            <select aria-label="Output Format" value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <button onClick={boost} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Boosting...' : 'Boost Audio'}
          </button>
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
        title="Audio Booster"
        description={`Audio Booster changes the volume of one audio file. Move the slider from 0.25x (quieter) to 5x (louder), or tick "Normalize instead" to bring the whole file to an even loudness of -16 LUFS with true peaks at -1.5 dB. When you boost above 1x with "Prevent distortion" ticked, as it is by default, a limiter holds the peaks just under full scale instead of cutting them flat. You choose among 18 output formats, from MP3 to FLAC and M4R. The gain is applied by ffmpeg.wasm on this page; an Opus result is the one case encoded on our media service.`}
        howToTitle="How to boost or normalize the volume of an audio file"
        howTo={[
          `Pick or drop the recording that sounds too quiet or too loud.`,
          `Set "Volume Boost" with the slider, or tick "Normalize instead" to aim at -16 LUFS.`,
          `Leave "Prevent distortion" ticked to keep loud peaks under full scale, or untick it for the raw gain.`,
          `Choose the "Output Format", then click "Boost Audio".`,
          `Listen to the result and click "Download" to save it as boosted_ followed by your file name.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Output formats`, value: `MP3, WAV, AAC, FLAC, OGG (Vorbis), M4A, Opus, WMA, AIFF, ALAC, AC3, M4R, M4B, MP2, WV (WavPack), CAF, AU, MKA` },
          { label: `Volume`, value: `0.25x to 5x in steps of 0.25x, or loudness normalization to -16 LUFS (true peak -1.5 dB)` },
          { label: `Maximum file size`, value: `Not set by the tool for the formats made on the page; the whole file is held in memory. For Opus, the lossless FLAC sent to our media service must fit its maximum size and length.` },
          { label: `Usage limits`, value: `Opus output counts toward an hourly and a daily number of jobs per connection on our media service.` },
        ]}
        privacy={`ffmpeg.wasm, downloaded from unpkg.com the first time, applies the gain to your file in your browser, except when you choose Opus. Then the boosted audio is rendered here as lossless FLAC, sent to our media service and encoded with libopus; the service erases that FLAC when encoding ends and the Opus file once your browser has fetched it, or after a set time. A failed boost is reported to us with its cleaned message, the file extension and size range, and your browser's name and version.`}
        faqs={[
          { q: `Will boosting make the audio distort?`, a: `No, not with the default settings. With "Prevent distortion" ticked and a boost above 1x, the limiter turns down only the peaks that would pass full scale, so they are not cut flat; strong boosts then sound more compressed. Untick it to get the raw gain, clipping included.` },
          { q: `Does "Normalize instead" make every file equally loud?`, a: `Yes, it aims at the same target: the loudnorm filter brings the file to -16 LUFS with true peaks at -1.5 dB, at the source sample rate (an Opus result takes a rate the Opus encoder supports, which can differ from the source). The slider is then disabled and the limiter box is ignored. A plain boost multiplies every sample by one factor instead.` },
          { q: `Can I make a file quieter?`, a: `Yes. Move the slider below 1x, down to 0.25x. The limiter is not used there, since lowering the volume cannot push peaks past full scale. The file is still re-encoded into the output format you pick.` },
          { q: `Will I lose quality if I keep the same format?`, a: `Yes, if that format is lossy. Changing the volume always means encoding again, so an MP3 saved as MP3 is compressed a second time. FLAC or ALAC add no further loss; WAV and AIFF are written in 16 bits, so a higher-resolution source loses depth.` },
          { q: `Does boosting to Opus use a server?`, a: `Yes, Opus is the only output that does: the boosted audio goes to our media service as FLAC and is encoded there with libopus. That service limits jobs per connection per hour and per day. Every other format is boosted and saved in this tab by ffmpeg.wasm.` },
        ]}
        tips={[
          `For voice memos recorded at different levels, try "Normalize instead" before the slider.`,
          `To boost only one passage, cut it out first with Audio Trimmer.`,
        ]}
      />
    </div>
  );
}
