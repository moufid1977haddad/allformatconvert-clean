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
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// 30/09 (owner's iPhone): the rotator replayed the video in a <canvas> and recorded it with MediaRecorder -- in real
// time, with the source playing full screen on iPhone, a WebM that Photos cannot open, heavier than the original.
// Now, as a phone itself and `ffmpeg -c copy` do: an MP4 / MOV / M4V / 3GP is turned by rewriting its rotation
// matrix (lib/mp4Rotate.js) -- instant, lossless, same size, nothing uploaded, same container. Other formats (WebM,
// MKV, AVI…) have no rotation field: they are turned on our ffmpeg service and come back as an MP4.
// P17 (docs/audit/RAPPORT-p17-30-09.md): the rotation setting is applied by Chrome, Firefox, Safari/Photos, VLC,
// Android and Windows 11's Media Player (read here: Chromium, Firefox, Windows' own thumbnails), but NOT by the old
// Windows Media Player (Microsoft Q&A: "plays my video sideways"), still installed on Windows 10 and 11. Kapwing, VEED
// and 123apps deliver a re-encoded MP4 (123apps at 720p unless paid); Clideo keeps the format. So the visitor chooses,
// before rotating: "Compatible everywhere" (default: the picture itself is turned, on our service, at full resolution)
// or "Instant, lossless" (the rotation setting only, in the browser).
const MAX_SERVICE_BYTES = 1024 * 1024 * 1024;
const ISO_BMFF = /\.(mp4|mov|m4v|3gp|3g2)$/i;

export default function VideoRotatorPage() {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState(90);
  const [mode, setMode] = useState('compatible');
  // P25 (03/10, E5): mirror, as 123apps' and Clideo's rotate tools offer (flip horizontally / vertically), on our
  // video service; it can be combined with a rotation or used alone ("No rotation").
  const [flip, setFlip] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
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
      // P24 review (03/10): "Instant, lossless" promises that nothing is uploaded — when it cannot be done (a WebM, or an
      // MP4 whose rotation field cannot be rewritten) the page now says so instead of sending the file to the service
      if (!angle && !flip) throw new Error('Choose a rotation or a mirror first.');
      if (flip && mode === 'lossless') throw new Error('"Instant, lossless" only changes the rotation setting; a mirror turns the picture itself. Choose "Compatible everywhere" to mirror the video. Nothing was uploaded.');
      if (mode === 'lossless' && !ISO_BMFF.test(file.name)) throw new Error('"Instant, lossless" works for MP4, MOV, M4V and 3GP only; this format has no rotation setting. Nothing was uploaded. Choose "Compatible everywhere" to turn it on our video service.');
      let fast = null;
      if (mode === 'lossless') {
        try { fast = await rotateIsoBmff(file, angle); } catch (e) { fast = null; var why = e?.message; }
        if (!fast) throw new Error(`"Instant, lossless" could not change the rotation setting of this file${why ? ` (${why})` : ''}. Nothing was uploaded. Choose "Compatible everywhere" to turn the picture itself on our video service.`);
      }
      if (fast) {
        const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'mp4').toLowerCase();
        setResult({ url: URL.createObjectURL(fast.blob), name: `${base(file.name)}-rotated.${ext}`, bytes: fast.blob.size, lossless: true, ext });
        return;
      }
      if (file.size > MAX_SERVICE_BYTES) {
        throw new Error(ISO_BMFF.test(file.name)
          ? `This file is ${formatBytes(file.size)}; turning the picture itself happens on our video service, which accepts up to 1 GB. Choose "Instant, lossless" instead: it has no size limit.`
          : `This file is ${formatBytes(file.size)}; this format has to be re-encoded on our service, which accepts up to 1 GB.`);
      }
      const ac = new AbortController(); abortRef.current = ac; setCanCancel(true);
      const out = await runMediaJob({
        file, op: 'convert', signal: ac.signal, params: { target: 'mp4', quality: 'high', ...(angle ? { rotate: angle } : {}), ...(flip ? { flip } : {}) },
        onStage: (s) => setStage({
          label: s.stage === 'upload' ? 'Uploading to our video service' : s.stage === 'processing' ? 'Rotating on our video service' : s.stage === 'download' ? 'Downloading the result' : s.stage === 'busy' ? 'The video service is busy — waiting for a free slot…' : 'Preparing…',
          pct: typeof s.pct === 'number' ? Math.round(s.pct) : null,
        }),
      });
      if (!out.blob || !out.bytes) throw new Error('The video service returned an empty file. Please try again.');
      const blob = new Blob([out.blob], { type: 'video/mp4' });
      setResult({ url: URL.createObjectURL(blob), name: `${base(file.name)}-${angle ? 'rotated' : 'mirrored'}.mp4`, bytes: out.bytes, lossless: false, ext: 'mp4' });
    } catch (e) {
      if (e?.code !== 'cancelled') { reportToolError({ tool: 'video-rotator', file, error: e instanceof Error ? e : new Error(String(e)) }); setError(e?.message || 'The rotation failed.'); }
    } finally { abortRef.current = null; setCanCancel(false); setStage(null); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Rotator</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate a video 90°, 180° or 270°, or mirror it — upright in every player, or without re-encoding for MP4 and MOV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !stage && inputRef.current.click()}>
            <p className="text-neutral-500">{file ? `${file.name} — ${formatBytes(file.size)}` : <UploadPrompt what="a video file" />}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onClick={(e) => { e.target.value = ''; }} onChange={pick} />
          </div>
          {previewUrl && (
            <div className="flex justify-center overflow-hidden rounded-xl bg-neutral-800 py-6">
              <video src={previewUrl} controls playsInline muted className="max-h-64 transition-transform" style={{ transform: `rotate(${angle}deg)${flip.includes('h') ? ' scaleX(-1)' : ''}${flip.includes('v') ? ' scaleY(-1)' : ''}` }} aria-label="Preview of the rotation" />
            </div>
          )}
          <div className="flex gap-2 justify-center flex-wrap">{[0, 90, 180, 270].map((a) => <button key={a} type="button" disabled={!!stage} onClick={() => setAngle(a)} aria-pressed={angle === a} className={'px-4 py-2 rounded-lg font-semibold transition ' + (angle === a ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800')}>{a ? `${a}°` : 'No rotation'}{a === 90 ? ' ↻' : a === 270 ? ' ↺' : ''}</button>)}</div>
          <div className="flex gap-2 justify-center flex-wrap text-sm" role="radiogroup" aria-label="Mirror">
            {[['', 'No mirror'], ['h', 'Mirror ⇆ (left-right)'], ['v', 'Flip ⇅ (top-bottom)']].map(([v, l]) => (
              <button key={v || 'none'} type="button" role="radio" aria-checked={flip === v} disabled={!!stage} onClick={() => { setFlip(v); if (v) setMode('compatible'); }} className={'px-3 py-1.5 rounded-lg font-semibold transition ' + (flip === v ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}>{l}</button>
            ))}
          </div>
          {file && ISO_BMFF.test(file.name) && (
            <fieldset className="space-y-2" data-rotate-mode>
              <legend className="text-sm font-semibold text-neutral-700 mb-1">How to rotate</legend>
              <label className={'flex gap-3 items-start rounded-lg border p-3 cursor-pointer ' + (mode === 'compatible' ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200')}>
                <input type="radio" name="mode" value="compatible" checked={mode === 'compatible'} disabled={!!stage} onChange={() => setMode('compatible')} className="mt-1" />
                <span className="text-sm"><strong>Compatible everywhere</strong> (recommended) — the picture itself is turned, at full resolution and in high quality, on our video service. Plays upright in every player, including the old Windows Media Player. Result: MP4{file.size > MAX_SERVICE_BYTES ? ` — not available for this file (${formatBytes(file.size)}, over 1 GB)` : ''}.</span>
              </label>
              <label className={'flex gap-3 items-start rounded-lg border p-3 cursor-pointer ' + (mode === 'lossless' ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200')}>
                <input type="radio" name="mode" value="lossless" checked={mode === 'lossless'} disabled={!!stage} onChange={() => setMode('lossless')} className="mt-1" />
                <span className="text-sm"><strong>Instant, lossless</strong> — only the video&apos;s rotation setting is changed, in your browser: same quality, same size, same format, nothing uploaded, any size. Plays upright in Photos, QuickTime, Safari, Chrome, Firefox, VLC, Android and the Windows 11 Media Player; the old Windows Media Player ignores this setting and shows the video unturned.</span>
              </label>
            </fieldset>
          )}
          {stage && <div className="space-y-2" aria-live="polite"><ProgressBar pct={stage.pct ?? 0} label={stage.label} />{stage.pct == null && <p className="text-xs text-neutral-400 text-center">{stage.label}</p>}</div>}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          {stage && canCancel
            ? <button type="button" onClick={() => abortRef.current?.abort()} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            : <button type="button" onClick={rotate} disabled={!file || !!stage || (!angle && !flip)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Rotate Video</button>}
          {result && (
            <div className="space-y-2">
              <p className="text-sm text-center text-green-700" data-result>{result.lossless
                ? `Rotated without re-encoding: same quality and same size (${formatBytes(result.bytes)}), still ${result.ext.toUpperCase()}. Nothing was uploaded. (The old Windows Media Player ignores the rotation setting: choose "Compatible everywhere" for it.)`
                : `Done on our video service: the picture itself is ${angle ? 'turned' : ''}${angle && flip ? ' and ' : ''}${flip ? 'mirrored' : ''}, MP4, ${formatBytes(result.bytes)} — the same in every player.`}</p>
              <PlayablePreview src={result.url} name={result.name} kind="video" className="w-full rounded-xl max-h-72" />
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Rotator"
        description={`Video Rotator turns a video a quarter, half or three-quarter turn, and can mirror it left-right or top-bottom, with or without a rotation. It works two ways. "Compatible everywhere", the default, turns the picture itself on our video service and returns an MP4 that plays upright in any player. For MP4, MOV, M4V, 3GP and 3G2 files, "Instant, lossless" only rewrites the rotation setting stored in the file, in your browser, so its size, quality and format stay the same. A mirror always goes through the video service.`}
        howToTitle="How to rotate or flip a video"
        howTo={[
          `Choose or drop a video file; a preview appears.`,
          `Click an angle button (90°, 180° or 270°) or "No rotation", and "Mirror ⇆ (left-right)" or "Flip ⇅ (top-bottom)" if needed: the preview turns with your choice.`,
          `For an MP4, MOV, M4V, 3GP or 3G2 file, choose "Compatible everywhere" or "Instant, lossless" under "How to rotate".`,
          `Click "Rotate Video"; with "Compatible everywhere" the page shows the upload and processing progress.`,
          `Play the result and click "Download": an MP4, or your file's own format with "Instant, lossless".`,
        ]}
        specs={[
          { label: 'Input formats', value: `MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS` },
          { label: 'Output', value: `Compatible everywhere: MP4 with H.264 picture and AAC sound at 160 kbps. Instant, lossless: the same file type as yours` },
          { label: 'Turns', value: `90° clockwise, 180°, 270° (90° counter-clockwise); mirror left-right or top-bottom, alone or with a turn` },
          { label: 'Maximum file size', value: `1 GB with Compatible everywhere; none set by the page with Instant, lossless` },
          { label: 'Usage limits', value: `Compatible everywhere counts toward the hourly and daily limit of your internet connection on our video service; Instant, lossless does not` },
        ]}
        privacy={`With "Instant, lossless", nothing is uploaded: the page rewrites a few bytes of the file's header in your browser and gives the file back. With "Compatible everywhere", any mirror, or a format other than MP4, MOV, M4V, 3GP or 3G2, the video is sent to our video service on Railway, which turns it with ffmpeg, deletes the original at the end and deletes the result once this page has downloaded it. If the rotation fails, its cleaned message, the error type, the tool name, the file type, a size range, your browser and its version are reported to us, never the video.`}
        faqs={[
          { q: "Which option should I choose?", a: `"Compatible everywhere" when the video will be sent to others or played in the old Windows Media Player, which ignores rotation settings. "Instant, lossless" for your own viewing in Photos, QuickTime, Safari, Chrome, Firefox, VLC, Android or the Windows 11 Media Player, which apply the setting; it keeps the exact quality and size.` },
          { q: "Does rotating reduce quality?", a: `No with "Instant, lossless": the picture is not re-encoded. Yes, slightly, with "Compatible everywhere" or a mirror: the turned picture is encoded again in H.264 at full resolution, at the service's high-quality setting or, if that would make it larger than the original, with stronger compression.` },
          { q: "Is the sound changed?", a: `No with "Instant, lossless": the sound is left as it is. With "Compatible everywhere", the first audio track is encoded again as AAC at 160 kbps and other audio tracks are dropped.` },
          { q: "Can I rotate a WebM, MKV or AVI video?", a: `Yes, with "Compatible everywhere" only: these formats store no rotation setting, so the picture is turned on our video service and comes back as an MP4.` },
          { q: "Can I rotate by 45° or another angle?", a: `No. Only quarter turns are offered: 90°, 180° and 270°, alone or with a mirror. A slightly tilted picture cannot be straightened with this tool.` },
        ]}
        tips={[
          `For a video filmed with the phone held sideways, try 90° and check the preview before you click "Rotate Video".`,
        ]}
      />
    </div>
  );
}
