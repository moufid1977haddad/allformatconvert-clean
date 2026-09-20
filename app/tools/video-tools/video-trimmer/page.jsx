'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { reportToolError } from '../../../lib/reportError';

// Engine: ffmpeg.wasm stream copy ("-c copy"), the same engine audio-trimmer
// already runs under real Safari. No re-encoding: the cut is near-instant and
// the output keeps the source's exact codec, container and quality.
//
// The whole file is copied into the wasm heap, so the size is capped BEFORE
// the file is accepted (project rule: ceilings are declared, not discovered).
// Mobile tabs die at a much lower memory ceiling. The mobile figure is a
// conservative choice, NOT yet measured on a real iPhone.
const MAX_MB_DESKTOP = 300;
const MAX_MB_MOBILE = 100;

const MIME_BY_EXT = {
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', qt: 'video/quicktime',
  webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo', ogv: 'video/ogg',
  '3gp': 'video/3gpp', mpg: 'video/mpeg', mpeg: 'video/mpeg', ts: 'video/mp2t',
};

const fmtMB = (b) => (b / (1024 * 1024)).toFixed(b < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
const fmtSecs = (s) => (s < 10 ? s.toFixed(1) : Math.round(s)) + 's';

export default function VideoTrimmerPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef();
  const inputRef = useRef();
  const ffmpegRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => { setIsMobile(isMobileDevice()); }, []);
  useEffect(() => () => { try { ffmpegRef.current?.terminate(); } catch {} }, []);

  const maxMB = isMobile ? MAX_MB_MOBILE : MAX_MB_DESKTOP;

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setResult(null);
    setError('');
    setDuration(0);
    if (f.size > maxMB * 1024 * 1024) {
      setFile(null);
      setError(`This file is ${fmtMB(f.size)}, over the ${maxMB} MB limit${isMobile ? ' on this device' : ''}. Trimming runs in your browser's memory, so the limit is declared up front.`);
      return;
    }
    setFile(f);
  };

  useEffect(() => {
    // videoRef.current only exists after this render commits (the <video>
    // mounts once `file` is set), so the src is assigned here, not in handleFile.
    if (file && videoRef.current) {
      const v = videoRef.current;
      v.src = URL.createObjectURL(file);
      v.onloadedmetadata = () => {
        const d = Math.floor(v.duration);
        if (!Number.isFinite(d) || d < 1) return;
        setDuration(d);
        setStart(0);
        setEnd(d);
      };
      v.onerror = () => setError("This browser can't preview this video, so the start and end sliders are unavailable. The file itself may still be fine in another browser.");
    }
  }, [file]);

  const cancel = () => {
    cancelledRef.current = true;
    try { ffmpegRef.current?.terminate(); } catch {}
    ffmpegRef.current = null;
    setStatus('');
  };

  const trim = async () => {
    if (!file || status) return;
    if (end <= start) { setError('Start must be before end.'); return; }
    setError('');
    setResult(null);
    cancelledRef.current = false;
    try {
      setStatus('Loading the video engine (about 10 MB the first time, cached afterwards)…');
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      await ffmpeg.load();

      setStatus('Cutting…');
      // Output keeps the source's container: stream copy cannot change codec,
      // and naming it after anything else would be a wrong extension.
      const sourceExt = (file.name.includes('.') ? file.name.split('.').pop() : 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      const inputName = 'input.' + sourceExt;
      const outputName = 'output.' + sourceExt;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      // -ss before -i seeks by keyframe; -t is the clip length (unambiguous,
      // unlike -to which changes meaning with input seeking).
      // -avoid_negative_ts make_zero keeps the copied clip starting at 0.
      const code = await ffmpeg.exec([
        '-ss', String(start), '-i', inputName, '-t', String(end - start),
        '-c', 'copy', '-avoid_negative_ts', 'make_zero', outputName,
      ]);
      if (cancelledRef.current) return;

      // A resolved exec() is not proof of success: only a non-empty output file is.
      let data;
      try { data = await ffmpeg.readFile(outputName); } catch { data = null; }
      if (code !== 0 || !data || data.byteLength === 0) {
        throw new Error("This video's format can't be cut without re-encoding, so nothing was produced. Try an MP4 (H.264), MOV, or WebM file.");
      }

      const type = MIME_BY_EXT[sourceExt] || file.type || 'video/mp4';
      const blob = new Blob([data.buffer], { type });
      const url = URL.createObjectURL(blob);
      setResult({ url, name: 'trimmed_' + file.name.replace(/\.[^.]+$/, '') + '.' + sourceExt, size: blob.size, asked: end - start, actual: null });
    } catch (e) {
      if (cancelledRef.current) return;
      console.error('Video trim failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error';
      reportToolError({ tool: 'video-trimmer', file, error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Trim failed: ' + reason);
    } finally {
      try { ffmpegRef.current?.terminate(); } catch {}
      ffmpegRef.current = null;
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Trimmer</h1>
        <p className="text-neutral-500 text-center mb-2">Trim and cut video files — no re-encoding, original quality</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Files up to {maxMB} MB{isMobile ? ' on this device' : ''} · MP4, MOV, WebM, MKV and more · nothing is uploaded</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls playsInline className="w-full rounded-xl bg-neutral-800" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-500 mb-1">Start: {start}s</label><input type="range" min="0" max={Math.max(0, duration - 1)} value={start} onChange={e => { const v = parseInt(e.target.value); setStart(v); if (v >= end) setEnd(Math.min(duration, v + 1)); }} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">End: {end}s</label><input type="range" min="1" max={duration} value={end} onChange={e => { const v = parseInt(e.target.value); setEnd(v); if (v <= start) setStart(Math.max(0, v - 1)); }} className="w-full" /></div>
            </div>
          )}
          {status && <p className="text-yellow-500 text-center text-sm">{status}</p>}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          {status ? (
            <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
          ) : (
            <button onClick={trim} disabled={!file || duration === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Trim Video ({end - start}s)</button>
          )}
          {result && (
            <div className="space-y-2">
              <video controls playsInline src={result.url} className="w-full rounded-xl" onLoadedMetadata={(e) => { const d = e.currentTarget.duration; setResult(r => r && ({ ...r, actual: d })); }} />
              <p className="text-xs text-neutral-500 text-center">
                {fmtMB(result.size)}{result.actual ? ` · ${fmtSecs(result.actual)} long (you asked for ${fmtSecs(result.asked)}; cuts snap to the nearest keyframe)` : ''}
              </p>
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download {result.name.split('.').pop().toUpperCase()}</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Trimmer"
        description="Video Trimmer cuts a section out of your video with ffmpeg.wasm's stream copy, entirely in your browser — nothing is uploaded. Because the video is not re-encoded, the cut takes seconds instead of the length of the clip, and the result keeps your original codec, container and quality. Cut points snap to the nearest keyframe, so the clip can start slightly before the point you picked; the page shows the real length of the result."
        howTo={[
          "Click the upload area and select a video file.",
          "Use the Start and End sliders to set the section you want to keep.",
          "Click \"Trim Video\" — the first use downloads the video engine (about 10 MB, cached afterwards).",
          "Preview the result, check its real length, and download it in your original format."
        ]}
        faqs={[
          { q: "Is the video re-encoded?", a: "No. The selected section is copied as it is (stream copy), so there is no quality loss and the cut is far faster than playing the clip through." },
          { q: "What output format do I get?", a: "The same format as your source: trim an MP4 and you get an MP4, a MOV gives a MOV, a WebM gives a WebM. The file extension always matches the real content." },
          { q: "Is the cut frame-accurate?", a: "Not exactly. Without re-encoding, a cut can only start on a keyframe, so the clip may begin a little before the start you chose. The page shows the real length of the result so you can check it." },
          { q: "Does it work on iPhone videos?", a: "Yes, iPhone .mov and .mp4 files are accepted. On phones the file size limit is lower (" + MAX_MB_MOBILE + " MB) because a browser tab has much less memory." },
          { q: "What is the file size limit?", a: MAX_MB_DESKTOP + " MB on a computer and " + MAX_MB_MOBILE + " MB on a phone, shown before you pick a file, because the video is held in your browser's memory while it is cut." },
          { q: "Is my file uploaded anywhere?", a: "No, trimming happens entirely in your browser." }
        ]}
        tips={[
          "The first trim downloads the video engine (about 10 MB, 32 MB once unpacked); later trims reuse it from the browser cache.",
          "Because there is no re-encoding, the clip can start a second or two earlier than your start point — check the length shown under the preview.",
          "If a file can't be cut without re-encoding, the tool says so instead of returning a broken file; try an MP4 (H.264), MOV or WebM.",
          "You can cancel at any time while it is working."
        ]}
      />
    </div>
  );
}
