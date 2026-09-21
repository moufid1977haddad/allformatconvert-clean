'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from './SeoContent';
import ProgressBar from './ProgressBar';
import { runMediaJob, MediaJobError } from '../lib/mediaJob';
import { VIDEO_ACCEPT } from '../lib/mediaSupport';
import { reportToolError } from '../lib/reportError';

// Shared UI of the tools that run on the media-processing service
// (video-compressor, video-converter). The engine is the service; the browser
// only uploads (chunked, direct), shows REAL progress and downloads the result.

export const MAX_UPLOAD_MB = 1024; // must equal MEDIA_TICKET_MAX_BYTES / MEDIA_MAX_FILE_BYTES in production

const fmt = (b) => (b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(b < 100 * 1024 * 1024 ? 2 : 0) + ' MB');

const STAGE_LABEL = {
  ticket: 'Preparing…',
  upload: 'Uploading',
  busy: 'All conversion slots are busy — waiting for a free one…',
  processing: 'Converting',
  download: 'Downloading the result',
};

export default function MediaServiceTool({ op, title, subtitle, buttonLabel, controls, initialParams, buildParams, outName, seo }) {
  const [file, setFile] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [stage, setStage] = useState(null); // {stage, pct, position}
  const [result, setResult] = useState(null);
  const [notSmaller, setNotSmaller] = useState(null); // compress: {inputBytes, outputBytes} when nothing smaller exists
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef();
  const abortRef = useRef(null);
  const busy = stage !== null;

  useEffect(() => () => { abortRef.current?.abort(); }, []);
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const u = URL.createObjectURL(file);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
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
      const out = await runMediaJob({ file, op, params: buildParams(params), onStage: setStage, signal: ac.signal });
      if (out.notSmaller) {
        // Not an error and not a success: the honest answer for a video that is already well compressed.
        setNotSmaller({ inputBytes: out.inputBytes, outputBytes: out.outputBytes });
        return;
      }
      // A success is only announced for a real, non-empty file with a known extension.
      if (!out.bytes || !out.ext) throw new MediaJobError('The service returned an empty file.', 'empty');
      setResult({ url: URL.createObjectURL(out.blob), ext: out.ext, bytes: out.bytes, name: outName(file.name, out.ext, params), isVideo: out.blob.type.startsWith('video/'), isAudio: out.blob.type.startsWith('audio/') });
    } catch (e) {
      if (e.code !== 'cancelled') {
        reportToolError({ tool: op === 'compress' ? 'video-compressor' : 'video-converter', file, error: e instanceof Error ? e : new Error(String(e)) });
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
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !busy && inputRef.current.click()}>
            <p className="text-neutral-500">{file ? `${file.name} — ${fmt(file.size)}` : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onClick={(e) => { e.target.value = ''; }} onChange={pick} />
          </div>
          {file && previewUrl && <video src={previewUrl} controls playsInline className="w-full rounded-xl bg-neutral-800 max-h-72" />}
          {file && controls({ params, setParams, disabled: busy })}
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
            <button onClick={run} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{buttonLabel}</button>
          )}
          {notSmaller && (
            <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-neutral-800 space-y-1">
              <p className="font-semibold">This video is already well compressed.</p>
              <p>Your file is {fmt(notSmaller.inputBytes)}. Compressing it again, even with a stronger setting, would only make it larger ({fmt(notSmaller.outputBytes)}), so we did not give you a bigger file. Your original is the best version. To go smaller, lower the resolution instead.</p>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{fmt(file.size)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After ({result.ext.toUpperCase()})</div><div className="font-bold text-indigo-500">{fmt(result.bytes)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">{change >= 0 ? 'Saved' : 'Larger by'}</div><div className={`font-bold ${change >= 0 ? 'text-green-500' : 'text-orange-500'}`}>{Math.abs(change)}%</div></div>
              </div>
              {result.isVideo && <video controls playsInline src={result.url} className="w-full rounded-xl max-h-72" />}
              {result.isAudio && <audio controls src={result.url} className="w-full" />}
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download {result.ext.toUpperCase()}</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent {...seo} />
    </div>
  );
}
