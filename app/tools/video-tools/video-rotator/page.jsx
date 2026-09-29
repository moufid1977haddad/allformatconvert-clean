'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import IosOriginalNote from '../../../components/IosOriginalNote';
import PlayablePreview from '../../../components/PlayablePreview';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { rotateIsoBmff } from '../../../lib/mp4Rotate';
import { runMediaJob } from '../../../lib/mediaJob';
import { reportToolError } from '../../../lib/reportError';
import { formatBytes } from '../../../lib/formatBytes';

// 30/09 (owner's iPhone): the rotator replayed the video in a <canvas> and recorded it with MediaRecorder -- in real
// time, with the source playing full screen on iPhone, a WebM that Photos cannot open, heavier than the original.
// Now, as a phone itself and `ffmpeg -c copy` do: an MP4 / MOV / M4V / 3GP is turned by rewriting its rotation
// matrix (lib/mp4Rotate.js) -- instant, lossless, same size, nothing uploaded, same container. Other formats (WebM,
// MKV, AVI…) have no rotation field: they are turned on our ffmpeg service and come back as an MP4.
const MAX_SERVICE_BYTES = 1024 * 1024 * 1024;

export default function VideoRotatorPage() {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState(90);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState('');
  const [canCancel, setCanCancel] = useState(false);
  const inputRef = useRef();
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return undefined; }
    const u = URL.createObjectURL(file); setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pick = (e) => { const f = e.target.files[0]; if (!f) return; setFile(f); setResult(null); setError(''); };
  const base = (name) => name.replace(/\.[^.]+$/, '');

  const rotate = async () => {
    if (!file || stage) return;
    setError(''); setResult(null);
    try {
      setStage({ label: 'Rotating…' });
      const fast = await rotateIsoBmff(file, angle).catch(() => null);
      if (fast) {
        const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'mp4').toLowerCase();
        setResult({ url: URL.createObjectURL(fast.blob), name: `${base(file.name)}-rotated.${ext}`, bytes: fast.blob.size, lossless: true, ext });
        return;
      }
      if (file.size > MAX_SERVICE_BYTES) throw new Error(`This file is ${formatBytes(file.size)}; this format has to be re-encoded on our service, which accepts up to 1 GB.`);
      const ac = new AbortController(); abortRef.current = ac; setCanCancel(true);
      const out = await runMediaJob({
        file, op: 'convert', signal: ac.signal, params: { target: 'mp4', quality: 'high', rotate: angle },
        onStage: (s) => setStage({
          label: s.stage === 'upload' ? 'Uploading to our video service' : s.stage === 'processing' ? 'Rotating on our video service' : s.stage === 'download' ? 'Downloading the result' : s.stage === 'busy' ? 'The video service is busy — waiting for a free slot…' : 'Preparing…',
          pct: typeof s.pct === 'number' ? Math.round(s.pct) : null,
        }),
      });
      if (!out.blob || !out.bytes) throw new Error('The video service returned an empty file. Please try again.');
      const blob = new Blob([out.blob], { type: 'video/mp4' });
      setResult({ url: URL.createObjectURL(blob), name: `${base(file.name)}-rotated.mp4`, bytes: out.bytes, lossless: false, ext: 'mp4' });
    } catch (e) {
      if (e?.code !== 'cancelled') { reportToolError({ tool: 'video-rotator', file, error: e instanceof Error ? e : new Error(String(e)) }); setError(e?.message || 'The rotation failed.'); }
    } finally { abortRef.current = null; setCanCancel(false); setStage(null); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Rotator</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate a video 90°, 180° or 270° — instant and lossless for MP4 and MOV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !stage && inputRef.current.click()}>
            <p className="text-neutral-500">{file ? `${file.name} — ${formatBytes(file.size)}` : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onClick={(e) => { e.target.value = ''; }} onChange={pick} />
          </div>
          {previewUrl && (
            <div className="flex justify-center overflow-hidden rounded-xl bg-neutral-800 py-6">
              <video src={previewUrl} controls playsInline muted className="max-h-64 transition-transform" style={{ transform: `rotate(${angle}deg)` }} aria-label="Preview of the rotation" />
            </div>
          )}
          <div className="flex gap-2 justify-center">{[90, 180, 270].map((a) => <button key={a} type="button" disabled={!!stage} onClick={() => setAngle(a)} aria-pressed={angle === a} className={'px-4 py-2 rounded-lg font-semibold transition ' + (angle === a ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800')}>{a}°{a === 90 ? ' ↻' : a === 270 ? ' ↺' : ''}</button>)}</div>
          {stage && <div className="space-y-2" aria-live="polite"><ProgressBar pct={stage.pct ?? 0} label={stage.label} />{stage.pct == null && <p className="text-xs text-neutral-400 text-center">{stage.label}</p>}</div>}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          {stage && canCancel
            ? <button type="button" onClick={() => abortRef.current?.abort()} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            : <button type="button" onClick={rotate} disabled={!file || !!stage} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Rotate Video</button>}
          {result && (
            <div className="space-y-2">
              <p className="text-sm text-center text-green-700" data-result>{result.lossless
                ? `Rotated instantly, without re-encoding: same quality and same size (${formatBytes(result.bytes)}), still ${result.ext.toUpperCase()}. Nothing was uploaded.`
                : `Rotated on our video service: MP4, ${formatBytes(result.bytes)}.`}</p>
              <PlayablePreview src={result.url} name={result.name} kind="video" className="w-full rounded-xl max-h-72" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download {result.ext.toUpperCase()}</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Rotator"
        description="Video Rotator turns a video by 90°, 180° or 270°. MP4, MOV (iPhone), M4V and 3GP videos are rotated instantly and without any quality loss: like a phone, the tool rewrites the video's rotation setting instead of re-encoding the picture, right in your browser, so nothing is uploaded and the file keeps its size and format. Other formats (WebM, MKV, AVI…) have no rotation setting; they are rotated on our video service and come back as an MP4 that plays everywhere."
        howTo={[
          "Click the upload area and select a video file.",
          "Click 90° (clockwise), 180° or 270° (counter-clockwise): the preview turns with it.",
          "Click \"Rotate Video\" — an MP4 or MOV is done instantly; another format is sent to our video service.",
          "Play the result and download it."
        ]}
        faqs={[
          { q: "Does rotating reduce quality?", a: "Not for MP4, MOV, M4V and 3GP: the picture is not re-encoded at all, only the rotation setting that every player reads (the way phones store portrait videos). Same quality, same file size. WebM, MKV and AVI videos have to be re-encoded (in high quality) because their format has no rotation setting." },
          { q: "Will the rotated video play on my iPhone and in Photos?", a: "Yes. The rotation setting is the one the iPhone itself writes; Photos, Safari, Chrome, Firefox, VLC, Windows and Android all apply it." },
          { q: "Does the rotated video have audio?", a: "Yes — for MP4 and MOV the sound is not touched at all; re-encoded videos keep their sound too." },
          { q: "Can I rotate by a custom angle?", a: "Not currently — only 90°, 180° and 270°, the angles a video player can apply without cropping." },
          { q: "Is my file uploaded anywhere?", a: "Not for MP4, MOV, M4V and 3GP: they are rotated in your browser. Other formats are sent to our video service, which deletes the original as soon as the rotation ends and the result right after your download (or after 15 minutes)." }
        ]}
        tips={[
          "Use 90° to fix a video recorded holding your phone sideways.",
          "Rotating an MP4 or MOV twice is harmless: nothing is re-encoded, so no quality is lost.",
          "A WebM, MKV or AVI video comes back as an MP4, which also makes it playable on an iPhone.",
          "The preview shows the result before you download anything."
        ]}
      />
    </div>
  );
}
