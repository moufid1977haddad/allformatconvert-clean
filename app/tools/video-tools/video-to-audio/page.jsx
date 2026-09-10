'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { AUDIO_OUTPUT_FORMATS, buildOutputSpec, sanitizedInputExt } from '../../../lib/audioFormats';
import { reportToolError } from '../../../lib/reportError';

export default function VideoToAudioPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
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
      const { outputName, extraArgs, mime, ext } = buildOutputSpec(format);
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      // -vn drops the video stream entirely so ffmpeg only demuxes and
      // encodes audio -- no frame decode/encode cost, unlike a real video
      // transcode.
      await ffmpeg.exec(['-i', inputName, '-vn', ...extraArgs, outputName]);
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
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {AUDIO_OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          {status && <p className="text-yellow-400 text-center text-sm">{status}</p>}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Extracting…" />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={extract} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Extract Audio</button>
          )}
          {result && <div className="space-y-2"><audio controls src={result.url} className="w-full" /><a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download {result.name}</a></div>}
        </div>
      </div>
      <SeoContent
        title="Video to Audio"
        description="Video to Audio extracts the audio track from a video file using ffmpeg.wasm, entirely in your browser — your file is never uploaded to a server. Stereo (and multi-channel) audio is preserved, and you can export to MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3."
        howTo={[
          "Click the upload area and select a video file.",
          "Choose your target audio format from the dropdown.",
          "Click \"Extract Audio\" to demux and encode the audio track locally.",
          "Preview the result in the audio player and download it."
        ]}
        faqs={[
          { q: "What audio formats can I export?", a: "MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3." },
          { q: "Does it keep stereo audio?", a: "Yes — the original channel layout (mono, stereo, or multi-channel) is preserved; nothing is downmixed." },
          { q: "Is Video to Audio free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "No, extraction happens entirely in your browser via ffmpeg.wasm (WebAssembly) — nothing is uploaded to a server." }
        ]}
        tips={[
          "The first extraction after loading the page takes longer since your browser needs to download the ffmpeg.wasm engine (roughly 25–30MB).",
          "Pick FLAC, WAV, or AIFF if you need the extracted audio at full lossless quality; MP3, AAC, or Opus for a smaller file.",
          "This works on the video's audio stream directly — if your browser downloads a very large video, extraction may take a moment even though only the audio is decoded.",
          "Extraction only reads the audio track, so it's typically much faster than a full video re-encode."
        ]}
      />
    </div>
  );
}
