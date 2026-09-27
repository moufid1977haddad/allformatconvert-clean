'use client';
import { useEffect, useState } from 'react';
import { probeMedia, describeProbe } from '../lib/mediaProbe';

// Technical report of one audio/video file (ffprobe in the browser): general, tags, each stream, chapters, cover.
// Copy and download as JSON. Shared by Audio Metadata and Video Metadata.
export default function MediaInfo({ file }) {
  const [state, setState] = useState({ phase: 'idle' });
  useEffect(() => {
    if (!file) return undefined;
    let alive = true;
    let coverUrl = null;
    setState({ phase: 'reading' });
    probeMedia(file)
      .then(({ json, cover }) => {
        if (!alive) return;
        coverUrl = cover ? URL.createObjectURL(cover) : null;
        setState({ phase: 'done', json, info: describeProbe(json, file), coverUrl });
      })
      .catch((e) => { if (alive) setState({ phase: 'error', message: (e && e.message) || String(e) }); });
    return () => { alive = false; if (coverUrl) URL.revokeObjectURL(coverUrl); };
  }, [file]);

  if (state.phase === 'idle') return null;
  if (state.phase === 'reading') return <p role="status" className="text-sm text-neutral-600 text-center">Reading the file (in your browser; the first time loads the ~10 MB engine)…</p>;
  if (state.phase === 'error') return <p role="alert" className="text-sm text-red-600 text-center">This file could not be read: {state.message}.</p>;

  const { info, json, coverUrl } = state;
  const report = JSON.stringify(json, null, 2);
  const download = () => { const u = URL.createObjectURL(new Blob([report], { type: 'application/json' })); const a = document.createElement('a'); a.href = u; a.download = file.name.replace(/\.[^.]+$/, '') + '-metadata.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  const Rows = ({ rows }) => (
    <div className="space-y-1">
      {rows.map(([k, v], i) => (
        <div key={k + i} className="flex justify-between gap-4 bg-neutral-50 rounded-lg px-4 py-2 border border-neutral-200">
          <span className="text-sm font-medium text-neutral-600">{k}</span>
          <span className="text-sm text-neutral-800 text-right break-all" data-field={k}>{v}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-5" data-media-info>
      {coverUrl && <img src={coverUrl} alt="Cover picture embedded in the file" className="max-h-48 mx-auto rounded-lg border border-neutral-200" />}
      <section><h2 className="text-sm font-semibold text-neutral-700 mb-2">General</h2><Rows rows={info.general} /></section>
      {info.tags.length > 0 && <section><h2 className="text-sm font-semibold text-neutral-700 mb-2">Tags</h2><Rows rows={info.tags} /></section>}
      {info.streams.map((s) => <section key={s.title}><h2 className="text-sm font-semibold text-neutral-700 mb-2">{s.title}</h2><Rows rows={s.rows} /></section>)}
      {info.chapters.length > 0 && <section><h2 className="text-sm font-semibold text-neutral-700 mb-2">Chapters</h2><Rows rows={info.chapters} /></section>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => navigator.clipboard.writeText(report)} className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl py-2 text-sm font-semibold">Copy full report (JSON)</button>
        <button type="button" onClick={download} className="bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 text-sm font-semibold">Download report (JSON)</button>
      </div>
    </div>
  );
}
