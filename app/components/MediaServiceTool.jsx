'use client';
import { whyLarger } from '../lib/sizeChange';
import { emptyFileProblem } from '../lib/fileChecks';
import { useState, useRef, useEffect } from 'react';
import SeoContent from './SeoContent';
import ProgressBar from './ProgressBar';
import { runMediaJob, MediaJobError } from '../lib/mediaJob';
import { VIDEO_ACCEPT } from '../lib/mediaSupport';
import { reportToolError } from '../lib/reportError';
import IosOriginalNote from './IosOriginalNote';
import PlayablePreview from './PlayablePreview';
import { formatBytes } from '../lib/formatBytes';
import { FileDownload } from './FileDownload';
import { useToolError } from '../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// Shared UI of the tools that run on the media-processing service
// (video-compressor, video-converter). The engine is the service; the browser
// only uploads (chunked, direct), shows REAL progress and downloads the result.

export const MAX_UPLOAD_MB = 1024; // must equal MEDIA_TICKET_MAX_BYTES / MEDIA_MAX_FILE_BYTES in production

const fmt = formatBytes;

const STAGE_LABEL = {
  ticket: 'Preparing…',
  upload: 'Uploading',
  busy: 'All conversion slots are busy — waiting for a free one…',
  processing: 'Converting',
  download: 'Downloading the result',
};

export default function MediaServiceTool({ op, title, subtitle, buttonLabel, controls, initialParams, buildParams, outName, seo, tool, previewStyle, extra, postProcess }) {
  const [file, setFile] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [stage, setStage] = useState(null); // {stage, pct, position}
  const [result, setResult] = useState(null);
  const [notSmaller, setNotSmaller] = useState(null); // compress: {inputBytes, outputBytes} when nothing smaller exists
  const [error, setError] = useToolError('');
  const [previewUrl, setPreviewUrl] = useState(null);
  // P24 review (03/10): the media's duration, read locally, so a tool can check its times against it (a GIF asked from
  // 10 s for 5 s of a 12-s video came back 2 s long without a word). NaN when this browser cannot read it.
  const [duration, setDuration] = useState(NaN);
  const [jobNote, setJobNote] = useState('');
  const inputRef = useRef();
  const abortRef = useRef(null);
  const busy = stage !== null;

  useEffect(() => () => { abortRef.current?.abort(); }, []);
  useEffect(() => {
    if (!file) { setPreviewUrl(null); setDuration(NaN); return; }
    const u = URL.createObjectURL(file);
    setPreviewUrl(u);
    setDuration(NaN);
    const v = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
    v.preload = 'auto'; // Firefox reads no metadata of an off-page element with "metadata"
    v.muted = true;
    v.onloadedmetadata = () => { if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration); };
    v.src = u;
    return () => { v.removeAttribute('src'); v.load(); URL.revokeObjectURL(u); };
  }, [file]);

  const pick = (e) => {
    const f = e.target.files[0];
    // The input is NOT cleared here: some engines invalidate the File once the
    // input's value is reset, and this File is read for the whole job. It is
    // cleared when the picker is opened again (onClick below), which still
    // lets the same file be chosen twice.
    if (!f) return;
    setResult(null);
    setNotSmaller(null);
    setError('');
    setJobNote('');
    // P21 (robustness): an empty file is said at once, never uploaded to the service.
    if (emptyFileProblem(f)) { setFile(null); setError(emptyFileProblem(f, 'convert')); return; }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setFile(null);
      setError(`This file is ${fmt(f.size)}, over the ${MAX_UPLOAD_MB >= 1024 ? MAX_UPLOAD_MB / 1024 + ' GB' : MAX_UPLOAD_MB + ' MB'} limit.`);
      return;
    }
    setFile(f);
  };

  const run = async () => {
    if (!file || busy) return;
    setError('');
    setResult(null);
    setNotSmaller(null);
    const ac = new AbortController();
    abortRef.current = ac;
    setStage({ stage: 'ticket' });
    try {
      const built = buildParams(params, { duration });
      const { _note, ...jobParams } = built || {};
      setJobNote(_note || '');
      const out = await runMediaJob({ file, op, params: jobParams, onStage: setStage, signal: ac.signal });
      if (out.notSmaller) {
        // Not an error and not a success: the honest answer for a video that is already well compressed.
        setNotSmaller({ inputBytes: out.inputBytes, outputBytes: out.outputBytes });
        return;
      }
      // A success is only announced for a real, non-empty file with a known extension.
      if (!out.bytes || !out.ext) throw new MediaJobError('The service returned an empty file.', 'empty');
      // P24 (03/10): an optional local step after the service (Video to GIF: loop count and compression by gifsicle)
      if (postProcess) { const p = await postProcess(out.blob, params); if (p && p.size) { out.blob = p; out.bytes = p.size; } }
      setResult({ url: URL.createObjectURL(out.blob), ext: out.ext, bytes: out.bytes, name: outName(file.name, out.ext, params), isVideo: out.blob.type.startsWith('video/'), isAudio: out.blob.type.startsWith('audio/'), isImage: out.blob.type.startsWith('image/') });
    } catch (e) {
      if (e.code !== 'cancelled') {
        reportToolError({ tool: tool || (op === 'compress' ? 'video-compressor' : 'video-converter'), file, error: e instanceof Error ? e : new Error(String(e)) });
        setError(e.message || 'The conversion failed.');
      }
    } finally {
      abortRef.current = null;
      setStage(null);
    }
  };

  const cancel = () => abortRef.current?.abort();

  let label = '';
  let pct = null;
  if (stage) {
    if (stage.stage === 'queued') label = stage.position > 0 ? `Waiting for a free slot — you are number ${stage.position} in line` : 'Waiting for a free slot…';
    else if (stage.stage === 'processing' && stage.attempt > 1) label = op === 'compress' ? 'Trying a stronger setting to make it smaller' : 'Adjusting the quality so the file is not larger than the original';
    else label = STAGE_LABEL[stage.stage] || 'Working…';
    if (typeof stage.pct === 'number') pct = Math.round(stage.pct);
  }
  const change = result ? Math.round((1 - result.bytes / file.size) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">{title}</h1>
        <p className="text-neutral-500 text-center mb-2">{subtitle}</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Files up to {MAX_UPLOAD_MB >= 1024 ? MAX_UPLOAD_MB / 1024 + ' GB' : MAX_UPLOAD_MB + ' MB'} · MP4, MOV, MKV, WebM, AVI, WMV, FLV and more · works in every browser, including Safari and iPhone · files are deleted from our server as soon as you have downloaded the result</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !busy && inputRef.current.click()}>
            <p className="text-neutral-500">{file ? `${file.name} — ${fmt(file.size)}` : <UploadPrompt what="a video file" />}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onClick={(e) => { e.target.value = ''; }} onChange={pick} />
          </div>
          {file && previewUrl && <video src={previewUrl} controls playsInline style={previewStyle ? previewStyle(params) : undefined} className="w-full rounded-xl bg-neutral-800 max-h-72" />}
          {file && controls({ params, setParams, disabled: busy, file })}
          {stage && (
            <div className="space-y-2" aria-live="polite">
              <ProgressBar pct={pct ?? 0} label={pct === null ? label : `${label}`} />
              {pct === null && <p className="text-xs text-neutral-400 text-center">{label}</p>}
            </div>
          )}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          {busy ? (
            <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
          ) : (
            <button onClick={run} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{buttonLabel}</button>
          )}
          {notSmaller && (
            <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-neutral-800 space-y-1">
              <p className="font-semibold">This video is already well compressed.</p>
              <p>Your file is {fmt(notSmaller.inputBytes)}. Compressing it again, even with a stronger setting, would only make it larger ({fmt(notSmaller.outputBytes)}), so we did not give you a bigger file. Your original is the best version. To go smaller, lower the resolution instead.</p>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              {jobNote && <p className="text-sm text-amber-700" data-job-note>{jobNote}</p>}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{fmt(file.size)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After ({result.ext.toUpperCase()})</div><div className="font-bold text-indigo-500">{fmt(result.bytes)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">{change >= 0 ? 'Saved' : 'Larger by'}</div><div className={`font-bold ${change >= 0 ? 'text-green-500' : 'text-neutral-700 dark:text-neutral-300'}`}>{Math.abs(change)}%</div></div>
              </div>
              {/* A larger result is not a failure (P21): one line says why it grew and what to do instead. */}
              {(() => {
                const why = whyLarger({ from: file.name, to: result.name, inBytes: file.size, outBytes: result.bytes, kind: /^audio\//.test(file.type) || result.isAudio ? 'audio' : /^image\//.test(file.type) ? 'image' : 'video' }); // the wording follows what the visitor sent (a video turned into a GIF is explained as video → GIF)
                return why ? <p data-size-why className="text-xs text-neutral-600 dark:text-neutral-400 text-center">{why}</p> : null;
              })()}
              {result.isVideo && <PlayablePreview src={result.url} name={result.name} kind="video" className="w-full rounded-xl max-h-72" />}
              {result.isAudio && <PlayablePreview src={result.url} name={result.name} kind="audio" />}
              {result.isImage && <img src={result.url} alt="Result" className="mx-auto max-h-96 rounded-xl" />}
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
          {/* A second use of the same video, offered under the main one (Video to GIF: extract frames as images). */}
          {extra && extra({ file, busy })}
        </div>
      </div>
      <SeoContent {...seo} />
    </div>
  );
}
