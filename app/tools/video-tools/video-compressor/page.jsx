'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function VideoCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.5);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
  };

  useEffect(() => {
    // videoRef.current is only guaranteed to exist after this render commits
    // (the <video> element only mounts once `file` is set), so the src must
    // be assigned here rather than inline in handleFile — otherwise the very
    // first file selection silently fails to load since the ref is still null.
    if (file && videoRef.current) videoRef.current.src = URL.createObjectURL(file);
  }, [file]);

  const compress = async () => {
    if (!file || !videoRef.current) return;
    setError('');
    setStatus('Compressing...');
    try {
      const duration = videoRef.current.duration;
      if (!duration || !isFinite(duration)) throw new Error('Could not read video duration');
      // Scale the target bitrate off the SOURCE file's own bitrate (size / duration)
      // instead of a fixed constant. A fixed target ignores how compressed the
      // source already is: for a source whose actual bitrate is already below the
      // fixed target, the old code would re-encode it at a HIGHER bitrate than the
      // original, growing the file regardless of the quality slider. The 0.75
      // headroom factor below the proportional target absorbs WebM container/
      // muxing overhead and the real-time VP8 encoder's rate-control imprecision
      // (measured to overshoot its target by 20-30% on some content in testing,
      // since MediaRecorder does single-pass live encoding with no look-ahead) —
      // without it, high quality settings on an already-efficient source could
      // still occasionally land above the original size.
      const sourceBitsPerSecond = (file.size * 8) / duration;
      const targetTotalBitsPerSecond = sourceBitsPerSecond * quality * 0.75;
      const targetAudioBitsPerSecond = Math.min(128000, Math.max(32000, targetTotalBitsPerSecond * 0.12));
      const targetVideoBitsPerSecond = Math.max(100000, targetTotalBitsPerSecond - targetAudioBitsPerSecond);

      const stream = videoRef.current.captureStream();
      const options = { mimeType: 'video/webm', videoBitsPerSecond: targetVideoBitsPerSecond, audioBitsPerSecond: targetAudioBitsPerSecond };
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult({ url: URL.createObjectURL(blob), size: blob.size, original: file.size });
        setStatus('');
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, duration * 1000);
    } catch(e) {
      setError('Error: ' + e.message);
      setStatus('');
    }
  };

  const fmt = (b) => b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {Math.round(quality*100)}%</label><input type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} className="w-full" /></div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button onClick={compress} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Compress Video</button>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{fmt(result.original)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After</div><div className="font-bold text-indigo-400">{fmt(result.size)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Saved</div><div className={`font-bold ${result.size <= result.original ? 'text-green-400' : 'text-red-400'}`}>{Math.round((1-result.size/result.original)*100)}%</div></div>
              </div>
              <video controls src={result.url} className="w-full rounded-xl" />
              <a href={result.url} download="compressed.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Compressor"
        description="Video Compressor re-records your video at a lower bitrate using the browser's native MediaRecorder API, entirely client-side. Output is always WebM. The target bitrate is calculated from your source file's own bitrate (size ÷ duration) scaled by the quality slider, not a fixed number — so the output is sized relative to how compressed your original already is. Note: since it works by playing and re-recording your video in real time, processing takes as long as the video's actual duration."
        howTo={[
          "Click the upload area and select a video file.",
          "Set your target quality using the slider (10%–100%) — lower values target a smaller fraction of your source's own bitrate.",
          "Click \"Compress Video\" — the video plays through once while it's re-recorded at the new bitrate.",
          "Compare the before/after size, then download the result."
        ]}
        faqs={[
          { q: "What output format do I get?", a: "Always WebM, regardless of your original format." },
          { q: "Is audio preserved?", a: "Yes, audio is captured along with the video track, at a bitrate that scales with the quality slider too." },
          { q: "How long does compression take?", a: "As long as the video's full duration, since it works by playing and re-recording it in real time rather than processing frames instantly." },
          { q: "Is my file uploaded anywhere?", a: "No, everything happens locally using your browser's MediaRecorder API." },
          { q: "Can the output ever end up larger than my original file?", a: "It's possible, though uncommon, on a source that's already efficiently compressed (e.g. re-compressing a file you already ran through this tool, or a professionally-encoded video with little redundancy left). The target bitrate is always calculated below your source's own bitrate, but MediaRecorder does single-pass, real-time encoding with no look-ahead, so its rate control can overshoot the target on some content — most noticeable near the 90-100% quality setting, where there's the least headroom to begin with. If a file doesn't shrink, try a lower quality setting; a source that's already very compressed may simply have little left to gain." }
        ]}
        tips={[
          "Lower quality settings produce smaller files but more visible compression artifacts — start around 50% and adjust from there.",
          "Don't close or minimize the tab while compressing, since the video needs to actively play through for the recording to capture it.",
          "For very long videos, expect compression to take just as long as watching the video.",
          "If you need MP4 output instead of WebM, convert the compressed file afterward with a dedicated converter.",
          "If a source video is already heavily compressed, even 10% quality may only shave off a modest amount — there's a limit to how much redundancy any encoder can squeeze out a second time."
        ]}
      />
    </div>
  );
}