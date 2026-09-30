'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import IosOriginalNote from '../../../components/IosOriginalNote';
import PlayablePreview from '../../../components/PlayablePreview';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { runMediaJob } from '../../../lib/mediaJob';
import { reportToolError } from '../../../lib/reportError';
import { formatBytes } from '../../../lib/formatBytes';
import { isMobileDevice } from '../../../lib/isMobileDevice';

// 30/09 (owner's iPhone): the merger played every clip in a <canvas> and recorded it with MediaRecorder -- in real
// time, the videos opening full screen on iPhone, and a WebM (merged.webm) that Photos cannot open. Now, as ffmpeg
// joins videos (the concat demuxer, the way server-side mergers such as Clideo's work):
//  * clips that are already alike (same codec, size, frame rate, sound, encoder settings -- typically several videos
//    from the same phone) are joined WITHOUT re-encoding, in this browser, by ffmpeg.wasm: seconds, no quality loss,
//    nothing uploaded;
//  * otherwise each clip is first made alike on our ffmpeg service (the first clip's size with black bars, its frame
//    rate, 48 kHz stereo sound -- silence where a clip has none, x264 "stitchable" headers), then joined the same way.
// The result is always one MP4 (H.264 or HEVC + AAC) that plays on iPhone, Android, Mac and Windows.
const COPYABLE_VIDEO = ['h264', 'hevc'];
const COPYABLE_AUDIO = ['aac'];

function signature(json) {
  const v = json.streams.find((s) => s.codec_type === 'video' && !(s.disposition && s.disposition.attached_pic));
  const a = json.streams.find((s) => s.codec_type === 'audio');
  if (!v) return null;
  const rot = (v.side_data_list || []).find((d) => 'rotation' in d)?.rotation || 0;
  return {
    key: JSON.stringify([v.codec_name, v.profile, v.width, v.height, v.pix_fmt, v.r_frame_rate, rot, v.extradata_hash || v.extradata_size,
      a ? [a.codec_name, a.sample_rate, a.channels, a.extradata_hash || a.extradata_size] : null]),
    copyable: COPYABLE_VIDEO.includes(v.codec_name) && (!a || COPYABLE_AUDIO.includes(a.codec_name)) && !!(v.extradata_hash || v.extradata_size),
    hevc: v.codec_name === 'hevc',
    width: Math.abs(rot) % 180 === 90 ? v.height : v.width,
    height: Math.abs(rot) % 180 === 90 ? v.width : v.height,
    fps: (() => { const [n, d] = String(v.avg_frame_rate || v.r_frame_rate || '30/1').split('/').map(Number); const f = d ? n / d : n; return Number.isFinite(f) && f > 0 ? f : 30; })(),
    duration: Number(json.format?.duration) || 0,
  };
}
const even = (n) => Math.max(16, 2 * Math.round(n / 2));

export default function VideoMergerPage() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState(false);
  const inputRef = useRef();
  const abortRef = useRef(null);
  const ffRef = useRef(null);
  useEffect(() => { setMobile(isMobileDevice()); return () => { abortRef.current?.abort(); try { ffRef.current?.terminate(); } catch {} }; }, []);
  // The whole result is written in this tab's memory before it is saved: kept well inside what a phone allows.
  const maxTotal = mobile ? 700e6 : 2e9;
  const total = files.reduce((n, f) => n + f.size, 0);

  const handleFiles = (e) => { const add = Array.from(e.target.files || []); e.target.value = ''; setFiles((p) => [...p, ...add]); setResult(null); setError(''); };
  const move = (i, d) => setFiles((p) => { const q = [...p]; const j = i + d; if (j < 0 || j >= q.length) return p; [q[i], q[j]] = [q[j], q[i]]; return q; });
  const removeFile = (i) => setFiles((p) => p.filter((_, k) => k !== i));

  const merge = async () => {
    if (files.length < 2 || stage) return;
    setError(''); setResult(null);
    const ac = new AbortController(); abortRef.current = ac;
    let ffmpeg = null;
    try {
      if (total > maxTotal) throw new Error(`These videos add up to ${formatBytes(total)}; up to ${formatBytes(maxTotal)} can be joined${mobile ? ' on a phone' : ''}. Trim or compress them first.`);
      setStage({ label: 'Loading the video engine (about 10 MB the first time)…' });
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      ffmpeg = new FFmpeg(); ffRef.current = ffmpeg;
      await ffmpeg.load();
      // Each clip under its own name (the same file may be added twice); File objects, not copies (WORKERFS).
      const named = files.map((f, i) => new File([f], `c${i}.${(f.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'mp4').toLowerCase()}`, { type: f.type }));
      await ffmpeg.createDir('/in');
      await ffmpeg.mount('WORKERFS', { files: named }, '/in');
      setStage({ label: 'Reading the videos…' });
      const sigs = [];
      for (const f of named) {
        await ffmpeg.ffprobe(['-v', 'error', '-show_format', '-show_streams', '-show_data_hash', 'MD5', '-of', 'json', `/in/${f.name}`, '-o', '/p.json']);
        let json = null;
        try { json = JSON.parse(new TextDecoder().decode(await ffmpeg.readFile('/p.json'))); } catch { json = null; }
        const s = json && signature(json);
        if (!s) throw new Error(`"${files[sigs.length].name}" has no video that can be read.`);
        sigs.push(s);
      }
      let parts = named.map((f) => `/in/${f.name}`);
      let hevc = sigs[0].hevc;
      const alike = sigs.every((s) => s.copyable && s.key === sigs[0].key);
      if (!alike) {
        // Made alike on our service, one clip after another, then joined here without re-encoding.
        const w = even(sigs[0].width), h = even(sigs[0].height), fps = Math.min(60, Math.round(sigs[0].fps * 1000) / 1000);
        const normal = [];
        for (let i = 0; i < files.length; i++) {
          const n = files.length, lbl = `clip ${i + 1} of ${n}`;
          const out = await runMediaJob({
            file: files[i], op: 'convert', signal: ac.signal,
            params: { target: 'mp4', quality: 'high', fit: { w, h, mode: 'fit' }, fps, forConcat: true },
            onStage: (s) => setStage({
              label: s.stage === 'upload' ? `Uploading ${lbl} to our video service` : s.stage === 'processing' ? `Matching ${lbl} to the first one` : s.stage === 'download' ? `Downloading ${lbl}` : s.stage === 'busy' ? 'The video service is busy — waiting for a free slot…' : `Preparing ${lbl}…`,
              pct: typeof s.pct === 'number' ? Math.round(s.pct) : null,
            }),
          });
          if (!out.blob || !out.bytes) throw new Error('The video service returned an empty file. Please try again.');
          normal.push(new File([out.blob], `n${i}.mp4`, { type: 'video/mp4' }));
        }
        await ffmpeg.createDir('/n');
        await ffmpeg.mount('WORKERFS', { files: normal }, '/n');
        parts = normal.map((f) => `/n/${f.name}`);
        hevc = false;
      }
      setStage({ label: alike ? 'Joining the videos (no re-encoding)…' : 'Joining the matched clips (no re-encoding)…' });
      await ffmpeg.writeFile('/list.txt', parts.map((p) => `file '${p}'`).join('\n') + '\n');
      const code = await ffmpeg.exec(['-v', 'error', '-f', 'concat', '-safe', '0', '-i', '/list.txt', '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy', ...(hevc ? ['-tag:v', 'hvc1'] : []), '-movflags', '+faststart', '/out.mp4']);
      let data = null;
      try { data = await ffmpeg.readFile('/out.mp4'); } catch { data = null; }
      if (code !== 0 || !data || !data.byteLength) throw new Error('The videos could not be joined. Please try again.');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const expected = sigs.reduce((n, s) => n + s.duration, 0);
      setResult({ url: URL.createObjectURL(blob), name: `${files[0].name.replace(/\.[^.]+$/, '')}-merged.mp4`, bytes: blob.size, copied: alike, expected });
    } catch (e) {
      if (e?.code !== 'cancelled') { reportToolError({ tool: 'video-merger', error: e instanceof Error ? e : new Error(String(e)) }); setError(e?.message || 'The videos could not be merged.'); }
    } finally {
      abortRef.current = null; setStage(null);
      try { ffmpeg?.terminate(); } catch {}
      ffRef.current = null;
    }
  };
  const cancel = () => { abortRef.current?.abort(); try { ffRef.current?.terminate(); } catch {} ffRef.current = null; setStage(null); };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Join several videos into one MP4 — in seconds when they come from the same camera</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !stage && inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop videos here (add them in the order you want, or reorder below)</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <ol className="space-y-2" aria-label="Videos, in merge order">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm">
                  <span className="w-6 text-neutral-400">{i + 1}.</span>
                  <span className="flex-1 truncate">{f.name} <span className="text-neutral-400">— {formatBytes(f.size)}</span></span>
                  <button type="button" disabled={!!stage || i === 0} onClick={() => move(i, -1)} aria-label={`Move ${f.name} up`} className="px-2 disabled:opacity-30">↑</button>
                  <button type="button" disabled={!!stage || i === files.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${f.name} down`} className="px-2 disabled:opacity-30">↓</button>
                  <button type="button" disabled={!!stage} onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} className="px-2 text-neutral-400 hover:text-red-500">✕</button>
                </li>
              ))}
            </ol>
          )}
          {stage && <div className="space-y-2" aria-live="polite"><ProgressBar pct={stage.pct ?? 0} label={stage.label} />{stage.pct == null && <p className="text-xs text-neutral-400 text-center">{stage.label}</p>}</div>}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          {stage
            ? <button type="button" onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            : <button type="button" onClick={merge} disabled={files.length < 2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Merge Videos ({files.length})</button>}
          {result && (
            <div className="space-y-2">
              <p className="text-sm text-center text-green-700" data-result>{result.copied
                ? `Joined without re-encoding (the videos were alike): same quality, ${formatBytes(result.bytes)}. Nothing was uploaded.`
                : `Clips matched to the first one on our video service, then joined: MP4, ${formatBytes(result.bytes)}.`}</p>
              <PlayablePreview src={result.url} name={result.name} kind="video" className="w-full rounded-xl max-h-72" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download MP4</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Merger"
        description="Video Merger joins two or more videos into one MP4, in the order you choose. Videos that are alike — typically several clips from the same phone or camera — are joined in seconds without re-encoding, right in your browser, so nothing is uploaded and no quality is lost. Videos of different sizes, frame rates or formats are first matched to the first one on our video service (black bars instead of stretching, silence added to a silent clip), then joined the same way. The MP4 plays on iPhone, Android, Mac and Windows."
        howTo={[
          "Click the upload area and add two or more videos.",
          "Put them in order with the ↑ and ↓ buttons, and remove any you don't want.",
          "Click \"Merge Videos\": alike videos are joined in seconds; different ones are matched on our video service first.",
          "Play the merged video and download the MP4."
        ]}
        faqs={[
          { q: "Can I reorder videos before merging?", a: "Yes — use the ↑ and ↓ buttons next to each video." },
          { q: "Does the merged video have audio?", a: "Yes: each clip keeps its sound. A clip without sound gets silence, so the sound stays in step with the pictures." },
          { q: "What if my videos have different resolutions?", a: "The result has the first video's size and frame rate; a clip of another shape keeps its proportions, with black bars, never stretched." },
          { q: "Does merging reduce quality?", a: "Not when the videos are alike (same camera settings): they are joined without re-encoding. Different videos are re-encoded once, in high quality, to match the first." },
          { q: "Is my file uploaded anywhere?", a: "Not when the videos are alike: they are joined in your browser. Otherwise each video is sent to our video service to be matched, and deleted as soon as that is done (the matched copy right after it is downloaded back)." },
          { q: "What do I get?", a: "One MP4 (H.264 or HEVC video, AAC sound), the format the iPhone Photos app, Android, Mac and Windows all play." }
        ]}
        tips={[
          "Clips filmed with the same phone and settings merge in seconds and keep their exact quality.",
          "Put the video whose size you want to keep first: the others are matched to it.",
          "On iPhone, pick the videos with \"Choose Files\" from the Files app to keep their original quality (see the note above).",
          "Trim each clip first if you only need part of it: the merge is faster and the file smaller."
        ]}
      />
    </div>
  );
}
