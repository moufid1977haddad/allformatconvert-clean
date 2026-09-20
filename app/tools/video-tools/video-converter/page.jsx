'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { videoReRecordSupport, captureMediaElementStream, finishRecording } from '../../../lib/mediaSupport';
export default function VideoConverterPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [support, setSupport] = useState({ ok: true, mime: null, ext: 'webm', reason: '' });
  const inputRef = useRef();
  const videoRef = useRef();

  // Checked on mount so the visitor learns BEFORE selecting a file, not after
  // a failed run (Safari has no <video>.captureStream() and cannot record WebM).
  useEffect(() => { setSupport(videoReRecordSupport({ fromMediaElement: true })); }, []);

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

  const convert = async () => {
    if (!file || !support.ok) return;
    setError('');
    setStatus('Converting to WebM...');
    try {
      const stream = captureMediaElementStream(videoRef.current);
      if (!stream) throw new Error('This browser cannot capture the video.');
      const recorder = new MediaRecorder(stream, { mimeType: support.mime });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        try {
          const { blob, ext } = finishRecording(chunks, recorder, support.mime);
          setResult({ url: URL.createObjectURL(blob), ext });
        } catch (e) { setError(e.message); }
        setStatus('');
      };
      recorder.onerror = () => { setError('Recording failed in this browser.'); setStatus(''); };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setError('Error: ' + e.message); setStatus(''); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert video files to WebM format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFile} />
          </div>
          {!support.ok && <p role="alert" className="text-red-500 text-center text-sm">{support.reason}</p>}
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!file || !!status || !support.ok} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert to WebM</button>
          {result && <div className="space-y-2"><video controls src={result.url} className="w-full rounded-xl" /><a href={result.url} download={`converted.${result.ext}`} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download {result.ext.toUpperCase()}</a></div>}
        </div>
      </div>
      <SeoContent
        title="Video Converter"
        description="Video Converter re-encodes your video to WebM using the browser's native MediaRecorder API, entirely client-side. Note: WebM is the only output format — there's no selector for MP4, AVI, MOV, or other targets — and since it works by playing and re-recording the video in real time, conversion takes as long as the video's actual duration."
        howTo={[
          "Click the upload area and select a video file.",
          "Click \"Convert to WebM\" — the video plays through once while it's re-recorded.",
          "Wait for the process to finish (roughly the length of the video).",
          "Preview and download the resulting WebM file."
        ]}
        faqs={[
          { q: "What formats can I convert to?", a: "WebM only — despite the tool's name, there's no format selector for MP4, AVI, MOV, or other targets." },
          { q: "Is there quality loss?", a: "Yes, some — this re-encodes your video through the browser's WebM encoder, so it isn't a lossless conversion." },
          { q: "How long does conversion take?", a: "Roughly as long as the source video's duration, since it plays and re-records the video in real time." },
          { q: "Is my file uploaded anywhere?", a: "No, conversion runs entirely in your browser using the MediaRecorder API." }
        ]}
        tips={[
          "Keep the browser tab open and active while converting, since the video needs to play through for the recording to work.",
          "If you need a format other than WebM, use this to get a WebM file first, then convert that with a dedicated format-specific converter.",
          "Test the converted WebM file in your target player before deleting the original, since some older devices have limited WebM support.",
          "For long source videos, expect the conversion itself to take about as long as the video runs."
        ]}
      />
    </div>
  );
}