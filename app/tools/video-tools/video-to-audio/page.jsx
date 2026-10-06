'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import ProgressBar from '../../../components/ProgressBar';
import { AUDIO_OUTPUT_FORMATS, AUDIO_BITRATES, DEFAULT_AUDIO_KBPS, formatTakesBitrate, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';
import IosOriginalNote from '../../../components/IosOriginalNote';
import PlayablePreview from '../../../components/PlayablePreview';
import { FileDownload } from '../../../components/FileDownload';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function VideoToAudioPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [kbps, setKbps] = useState(DEFAULT_AUDIO_KBPS);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();
  const ffmpegRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setStatus('');
  };

  const cancel = () => {
    if (ffmpegRef.current) {
      ffmpegRef.current.terminate();
      ffmpegRef.current = null;
    }
    setLoading(false);
    setProgress(0);
  };

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setStatus('Loading ffmpeg...');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(Math.min(1, Math.max(0, progress)) * 100));
      });
      await ffmpeg.load();
      setStatus('Extracting audio...');
      const inputName = 'input.' + sanitizedInputExt(file);
      const { outputName, extraArgs, mime, ext } = buildOutputSpec(format, kbps);
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      // -vn drops the video stream entirely so ffmpeg only demuxes and
      // encodes audio -- no frame decode/encode cost, unlike a real video
      // transcode.
      if (await ffmpeg.exec(['-i', inputName, '-vn', ...extraArgs, outputName]) !== 0) throw new Error('ffmpeg could not write this format with these settings. Try another output format, sample rate or quality.'); // P24: exit code checked
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
      setResult({ url, name: file.name.replace(/\.[^.]+$/, '') + '.' + ext });
      setProgress(100);
      setStatus('');
    } catch (e) {
      console.error('Extraction failed:', e);
      if (ffmpegRef.current) {
        const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
        reportToolError({ tool: 'video-to-audio', file, error: e instanceof Error ? e : new Error(String(reason)) });
        setStatus('Error: ' + reason);
      }
    }
    ffmpegRef.current = null;
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video to Audio</h1>
        <p className="text-neutral-500 text-center mb-8">Extract audio from video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a video file" />}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Format</label>
            <select aria-label="Target Format" value={format} onChange={e => setFormat(e.target.value)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {formatTakesBitrate(format) && (
              <div className="mt-3">
                <label className="block text-sm text-neutral-500 mb-1">Quality</label>
                <select aria-label="Quality" value={kbps} onChange={e => setKbps(Number(e.target.value))} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
                  {AUDIO_BITRATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            )}
          </div>
          {status && <p role="status" className="text-yellow-400 text-center text-sm">{status}</p>}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Extracting…" />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={extract} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Extract Audio</button>
          )}
          {result && <div className="space-y-2"><PlayablePreview src={result.url} name={result.name} /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Video to Audio"
        description="Video to Audio keeps only the sound of a video file and saves it in one of 18 audio formats: MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, AC3, M4R (iPhone ringtone), M4B (audiobook), MP2, WavPack, CAF, AU or MKA. The picture is skipped, so only the audio is decoded and encoded. The work is done by ffmpeg.wasm on your device, inside this browser tab, and the video is not uploaded. It does not cut the sound; for that, use Audio Trimmer on the result."
        howToTitle="How to extract the audio from a video"
        howTo={[
          "Choose or drop the video whose sound you want to keep.",
          "Pick the output in \"Target Format\".",
          "For MP3, AAC, M4A, M4R, M4B, OGG, WMA, AC3 or MP2, choose a bitrate in \"Quality\" (192 kbps is selected first).",
          "Click \"Extract Audio\"; the first run also downloads the ffmpeg.wasm engine, about 10 MB.",
          "Listen to the result and click \"Download\" to save the audio file, named after the video."
        ]}
        specs={[
          { label: 'Input formats', value: "MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS" },
          { label: 'Output formats', value: "MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, AC3, M4R, M4B, MP2, WV, CAF, AU, MKA" },
          { label: 'Bitrate', value: "128, 192, 256 or 320 kbps for the lossy formats that take one, AC3 and MP2 included; lossless formats ignore it" },
          { label: 'File size', value: "The page sets no cap, yet the whole video is copied into the tab's memory, so a very large file can fail" }
        ]}
        privacy="The video is read and converted by ffmpeg.wasm in this tab; neither the video nor the extracted sound is uploaded. The engine itself, about 10 MB, is downloaded from unpkg.com, a public code host, the first time. If extraction fails, we receive the cleaned error text, its type, the tool name, your browser and its version, the file extension and a size range, never the file."
        faqs={[
          { q: "Does extracting the audio lose quality?", a: "No with WAV, FLAC, AIFF, ALAC, WavPack or MKA: they store the decoded sound without loss. MP3, AAC, M4A, OGG, Opus, WMA, AC3 and MP2 compress it again, so some detail goes; a higher \"Quality\" bitrate keeps more. No format can restore what the video's own sound track already lost." },
          { q: "Which bitrate should I choose?", a: "192 kbps is selected first. 128 kbps makes a smaller file, for example for speech, while 256 or 320 kbps makes a larger one that keeps more detail. The setting appears only for MP3, AAC, M4A, M4R, M4B, OGG, WMA, AC3 and MP2." },
          { q: "Will mono or stereo sound stay the same?", a: "Yes: the page sends no channel setting to ffmpeg, so mono stays mono and stereo stays stereo. Sound with more than two channels was not tested here; to keep it, prefer a lossless format such as FLAC or WAV." },
          { q: "Can I make an iPhone ringtone from a video?", a: "Yes. Choose \"M4R (iPhone ringtone, AAC)\" in the format list to get an .m4r file. To use only part of the sound, cut the result with Audio Trimmer before you add it to your phone." },
          { q: "Is there a file size limit?", a: "No. The page sets none, but the whole video is copied into the browser tab's memory before extraction, so a very large file can make the tab run out of memory. If that happens, cut the video with Video Trimmer first." }
        ]}
        tips={[
          "Need the sound of one scene only? Cut it with Video Trimmer's default fast cut first: nothing is re-encoded before the extraction."
        ]}
      />
    </div>
  );
}
