'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { reportToolError } from '../../../lib/reportError';
import { ffmpegAudioDuration } from '../../../lib/audioDuration';
import { runMediaJob, mediaServiceConfigured } from '../../../lib/mediaJob';
import IosOriginalNote from '../../../components/IosOriginalNote';
import PlayablePreview from '../../../components/PlayablePreview';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';

// Precise cut, 28/09: re-encoding in ffmpeg.wasm measured ~3.7 s per second of 1080p in Chrome but ~29 s in
// Firefox (292 s for 10 s). The reference way to cut fast AND exact (LosslessCut's "smart cut") re-encodes only
// what must be; in a browser it is unreliable (the re-encoded head and the copied rest must share one H.264
// header, otherwise some players break -- silently). So when the local re-encode would be long, the browser
// cuts WITHOUT re-encoding from the keyframe before the start (fractions of a second), sends only that piece,
// and our ffmpeg service re-encodes it to the exact frame (native ffmpeg on 8 vCPU: ~3 s of CPU per second of
// 1080p, a few seconds of waiting). Short clips in Chrome/Edge stay entirely in the browser.
const SECONDS_PER_1080P_SECOND = { blink: 3.7, other: 29 };
const isBlink = () => typeof navigator !== 'undefined' && !!navigator.userAgentData?.brands?.some((b) => /Chromium/.test(b.brand));
function preciseOnService(len, w, h) {
  if (!mediaServiceConfigured() || !w || !h || w % 2 || h % 2) return false; // H.264 needs even sizes: odd ones stay local
  const local = len * ((w * h) / 2073600) * SECONDS_PER_1080P_SECOND[isBlink() ? 'blink' : 'other'];
  return local > 45;
}
const firstNumber = (bytes) => { const n = parseFloat(new TextDecoder().decode(bytes).trim().split(/\s+/)[0]); return Number.isFinite(n) ? n : null; };

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

const fmtMB = formatBytes;
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
  const [noPreview, setNoPreview] = useState(false);
  // Fast (default): stream copy, lossless, starts on the keyframe at or before the start. Precise: re-encoded to
  // H.264/AAC MP4, starts on the exact frame -- the two modes in-browser trimmers offer (read 28/09/2026: "keep"/fast
  // vs "precise" re-encode); before, only the fast mode existed and a phone video could start 2-3 s early.
  const [precise, setPrecise] = useState(false);
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
    setNoPreview(false);
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
      const applyLength = (seconds) => {
        const d = Math.floor(seconds * 10) / 10; // tenths, never beyond the real end
        if (!Number.isFinite(d) || d < 0.1) return false;
        setDuration(d);
        setStart(0);
        setEnd(d);
        return true;
      };
      let probed = false, alive = true; // alive: this file is still the one on the page
      // No preview in this browser (MKV, AVI, WMV, FLV…; more in Safari): ffmpeg.wasm reads the length, and the
      // cut itself never needed the browser's decoder.
      const probe = async () => {
        if (probed) return;
        probed = true;
        setNoPreview(true);
        try {
          const seconds = await ffmpegAudioDuration(file, { video: true });
          if (alive && !applyLength(seconds)) throw new Error('unknown length');
        } catch (e) {
          if (alive) setError(`This file could not be read as a video (${e.message || e}). Please try another file.`);
        }
      };
      v.onloadedmetadata = () => { if (!applyLength(v.duration)) probe(); };
      v.onerror = probe;
      const timer = setTimeout(() => { if (!(v.duration > 0)) probe(); }, 4000);
      return () => { alive = false; clearTimeout(timer); };
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

      setStatus(precise ? 'Cutting to the frame (re-encoding)… 0%' : 'Cutting…');
      // Fast mode keeps the source's container: stream copy cannot change codec, and naming it after anything else
      // would be a wrong extension. Precise mode writes an MP4 (H.264 + AAC), which every browser and phone plays.
      const sourceExt = (file.name.includes('.') ? file.name.split('.').pop() : 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      const outExt = precise ? 'mp4' : sourceExt;
      const inputName = 'input.' + sourceExt;
      const outputName = 'output.' + outExt;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const len = Math.round((end - start) * 10) / 10;
      // `progress` is measured against the whole input (not the -t length): use the output time instead (microseconds).
      if (precise) ffmpeg.on('progress', ({ time }) => { if (!cancelledRef.current && time >= 0) setStatus(`Cutting to the frame (re-encoding)… ${Math.min(99, Math.round((time / (len * 1e6)) * 100))}%`); });
      // -ss before -i: fast seek; with stream copy it lands on the keyframe at or before `start`, with re-encoding
      // ffmpeg decodes from that keyframe and drops the frames before `start` (exact). -t is the clip length.
      // -avoid_negative_ts make_zero keeps the copied clip starting at 0.
      const v = videoRef.current;
      let vw = v?.videoWidth || 0, vh = v?.videoHeight || 0;
      if (precise && (!vw || !vh)) {
        // No preview in this browser (MKV, AVI…; every video in some engines): ffprobe reads the size.
        try {
          await ffmpeg.ffprobe(['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', inputName, '-o', '/wh.txt']);
          const [pw, ph] = new TextDecoder().decode(await ffmpeg.readFile('/wh.txt')).trim().split('x').map(Number);
          if (pw > 0 && ph > 0) { vw = pw; vh = ph; }
        } catch {}
      }
      if (precise && preciseOnService(len, vw, vh)) {
        // 1. the keyframe at or before the start, 2. the piece from it, copied (no quality change), 3. its first
        // video timestamp -> where the start falls inside the piece, 4. the exact cut on our service.
        setStatus('Preparing the clip…');
        let piece = null, clipStart = start;
        try {
          await ffmpeg.ffprobe(['-v', 'error', '-select_streams', 'v:0', '-read_intervals', `${start}%+#1`, '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', inputName, '-o', '/k.txt']);
          const k = firstNumber(await ffmpeg.readFile('/k.txt'));
          if (k !== null && k <= start + 0.001) {
            const pc = await ffmpeg.exec(['-ss', String(k), '-i', inputName, '-t', String(Math.round((end - k + 1) * 1000) / 1000), '-map', '0:v:0', '-map', '0:a?', '-sn', '-dn', '-c', 'copy', '-avoid_negative_ts', 'make_zero', 'piece.mkv']);
            await ffmpeg.ffprobe(['-v', 'error', '-select_streams', 'v:0', '-read_intervals', '%+#1', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', 'piece.mkv', '-o', '/p.txt']);
            const p0 = firstNumber(await ffmpeg.readFile('/p.txt'));
            const bytes = pc === 0 ? await ffmpeg.readFile('piece.mkv') : null;
            if (bytes && bytes.byteLength && p0 !== null) { piece = new File([bytes], 'piece.mkv', { type: 'video/x-matroska' }); clipStart = p0 + (start - k); }
          }
        } catch { piece = null; }
        if (cancelledRef.current) return;
        // No keyframe found (rare containers): the whole file goes, cut at the same start.
        const src = piece || file;
        const ac = new AbortController();
        ffmpegRef.current = { terminate: () => ac.abort() }; // Cancel stops the service job too
        const out = await runMediaJob({
          file: src, op: 'convert', signal: ac.signal,
          params: { target: 'mp4', quality: 'high', clipStart: Math.round(Math.max(0, clipStart) * 1000) / 1000, clipDuration: len },
          onStage: (st) => {
            if (st.stage === 'upload') setStatus(`Sending the clip (${fmtMB(src.size)}) to our video service… ${Math.round(st.pct || 0)}%`);
            else if (st.stage === 'queued' && st.position) setStatus(`Waiting for the video service — you are number ${st.position} in line…`);
            else if (st.stage === 'busy') setStatus('The video service is busy, retrying…');
            else if (st.stage === 'processing') setStatus(`Cutting to the frame on our video service… ${Math.round(st.pct || 0)}%`);
            else if (st.stage === 'download') setStatus(`Downloading… ${Math.round(st.pct || 0)}%`);
          },
        });
        if (cancelledRef.current) return;
        if (!out.blob || out.blob.size === 0) throw new Error('The video service returned nothing. Please try again.');
        const blob = new Blob([out.blob], { type: 'video/mp4' });
        setResult({ url: URL.createObjectURL(blob), name: 'trimmed_' + file.name.replace(/\.[^.]+$/, '') + '.mp4', size: blob.size, asked: len, actual: null, precise: true, onService: true });
        return;
      }
      // Precise, 30/09 (real Safari: 118 frames for 120): "-ss" before "-i" is shifted by the container's start time,
      // so when the sound starts before the video (B-frames, phone MOVs) the cut landed 1-2 frames late and "-t" cut
      // the end. Cut on the file's own clock instead (-copyts): coarse seek 5 s before (speed only), then trim/atrim
      // at the exact start and length -- video and sound both last exactly `len` (same as our ffmpeg service).
      const lo = Math.max(0, start - 0.0025).toFixed(4), hi = (start + len - 0.0025).toFixed(4);
      const code = await ffmpeg.exec(precise
        ? ['-copyts', '-ss', Math.max(0, start - 5).toFixed(3), '-i', inputName, '-map', '0:v:0', '-map', '0:a?', '-sn', '-dn', '-vf', `trim=start=${lo}:end=${hi},setpts=PTS-STARTPTS,scale=trunc(iw/2)*2:trunc(ih/2)*2`, '-af', `atrim=start=${start.toFixed(4)}:end=${(start + len).toFixed(4)},asetpts=PTS-STARTPTS`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName]
        // P24 review (03/10): every audio track is kept (a film with two languages lost the second one without a word),
        // and subtitles where the container takes them as they are (MKV, WebM)
        : ['-ss', String(start), '-i', inputName, '-t', String(len), '-map', '0:v?', '-map', '0:a?', ...(/\.(mkv|webm)$/i.test(inputName) ? ['-map', '0:s?'] : []), '-dn', '-c', 'copy', '-avoid_negative_ts', 'make_zero', outputName]);
      if (cancelledRef.current) return;

      // A resolved exec() is not proof of success: only a non-empty output file is.
      let data;
      try { data = await ffmpeg.readFile(outputName); } catch { data = null; }
      if (code !== 0 || !data || data.byteLength === 0) {
        throw new Error(precise ? 'This video could not be re-encoded here, so nothing was produced. Try the fast cut, or another file.' : "This video's format can't be cut without re-encoding, so nothing was produced. Try \"Precise cut\", or an MP4 (H.264), MOV, or WebM file.");
      }

      const type = precise ? 'video/mp4' : MIME_BY_EXT[sourceExt] || file.type || 'video/mp4';
      const blob = new Blob([data.buffer], { type });
      const url = URL.createObjectURL(blob);
      setResult({ url, name: 'trimmed_' + file.name.replace(/\.[^.]+$/, '') + '.' + outExt, size: blob.size, asked: len, actual: null, precise });
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
        <p className="text-neutral-500 text-center mb-2">Trim and cut video files — instantly and losslessly by default, or to the exact frame</p>
        <p className="text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Files up to {maxMB} MB{isMobile ? ' on this device' : ''} · MP4, MOV, WebM, MKV and more · the fast cut never uploads your video</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls playsInline className={noPreview ? 'hidden' : 'w-full rounded-xl bg-neutral-800'} />}
          {file && noPreview && !error && <p role="status" className="text-sm text-neutral-600 text-center">{duration > 0 ? 'This browser cannot play this format, so there is no preview; cutting works the same.' : 'Reading the file…'}</p>}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-500 mb-1">Start: {start}s</label><input aria-label="Start: s" type="range" min="0" step="0.1" max={Math.max(0, duration - 0.1)} value={start} onChange={e => { const v = Math.round(parseFloat(e.target.value) * 10) / 10; setStart(v); if (v >= end) setEnd(Math.min(duration, v + 1)); }} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">End: {end}s</label><input aria-label="End: s" type="range" min="0.1" step="0.1" max={duration} value={end} onChange={e => { const v = Math.round(parseFloat(e.target.value) * 10) / 10; setEnd(v); if (v <= start) setStart(Math.max(0, v - 1)); }} className="w-full" /></div>
            </div>
          )}
          {duration > 0 && (
            <label className="flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={precise} disabled={!!status} onChange={(e) => { setPrecise(e.target.checked); setResult((r) => { if (r) URL.revokeObjectURL(r.url); return null; }); }} className="mt-1" />
              <span><b>Precise cut</b> — starts on the exact frame; the clip is re-encoded to MP4 (H.264). Short clips are re-encoded in your browser (about 4× the clip's length for 1080p in Chrome); when that would be long — in Firefox and Safari, or for longer clips — only the part you cut is sent to our own video service, which re-encodes it in seconds and then deletes it. Unchecked: an instant lossless copy that starts on the nearest keyframe before your start (often 1–3 s earlier on phone videos).</span>
            </label>
          )}
          {status && <p className="text-yellow-500 text-center text-sm">{status}</p>}
          {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
          {status ? (
            <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
          ) : (
            <button onClick={trim} disabled={!file || duration === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Trim Video ({(Math.round((end - start) * 10) / 10).toFixed(1)}s)</button>
          )}
          {result && (
            <div className="space-y-2">
              <PlayablePreview src={result.url} name={result.name} kind="video" className="w-full rounded-xl" onLoadedMetadata={(e) => { const d = e.currentTarget.duration; setResult(r => r && ({ ...r, actual: d })); }} />
              <p className="text-xs text-neutral-500 text-center">
                {fmtMB(result.size)}{result.actual ? ` · ${fmtSecs(result.actual)} long (you asked for ${fmtSecs(result.asked)}${result.precise ? '; cut to the frame' : '; a fast cut starts on the keyframe at or before your start'})` : ''}
              </p>
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Trimmer"
        description="Video Trimmer cuts a section out of your video with ffmpeg.wasm's stream copy, entirely in your browser — for that fast cut nothing is uploaded. Because the video is not re-encoded, the cut takes seconds instead of the length of the clip, and the result keeps your original codec, container and quality. By default, cut points snap to the nearest keyframe, so the clip can start slightly before the point you picked; tick “Precise cut” to start on the exact frame (the clip is then re-encoded to MP4, which takes longer). The page shows the real length of the result."
        howTo={[
          "Click the upload area and select a video file.",
          "Use the Start and End sliders to set the section you want to keep.",
          "Click \"Trim Video\" — the first use downloads the video engine (about 10 MB, cached afterwards).",
          "Preview the result, check its real length, and download it (in your original format by default; MP4 with Precise cut)."
        ]}
        faqs={[
          { q: "Is the video re-encoded?", a: "Not by default: the selected section is copied as it is (stream copy), so there is no quality loss and the cut takes seconds. Tick \"Precise cut\" to start on the exact frame: the clip is then re-encoded to MP4 (H.264, high quality), which takes longer." },
          { q: "What output format do I get?", a: "With the default fast cut, the same format as your source: an MP4 gives an MP4, a MOV a MOV, a WebM a WebM. With \"Precise cut\", an MP4 (H.264 + AAC). The file extension always matches the real content." },
          { q: "Is the cut frame-accurate?", a: "With \"Precise cut\", yes. With the default fast cut, no: without re-encoding a cut can only start on a keyframe, so the clip may begin a little before the start you chose (often 1–3 s on phone videos). The page shows the real length of the result." },
          { q: "Does it work on iPhone videos?", a: "Yes, iPhone .mov and .mp4 files are accepted. On phones the file size limit is lower (" + MAX_MB_MOBILE + " MB) because a browser tab has much less memory." },
          { q: "What is the file size limit?", a: MAX_MB_DESKTOP + " MB on a computer and " + MAX_MB_MOBILE + " MB on a phone, shown before you pick a file, because the video is held in your browser's memory while it is cut." },
          { q: "Is my file uploaded anywhere?", a: "Not for the default fast cut, which happens entirely in your browser. For a Precise cut that would take long in your browser (Firefox, Safari, longer clips), only the part you cut — not the whole video — is sent to our own video service, re-encoded, and deleted after you download it." }
        ]}
        tips={[
          "The first trim downloads the video engine (about 10 MB, 32 MB once unpacked); later trims reuse it from the browser cache.",
          "With the default fast cut there is no re-encoding, so the clip can start a second or two earlier than your start point; tick Precise cut when the exact frame matters.",
          "If a file can't be cut without re-encoding, the tool says so instead of returning a broken file; try an MP4 (H.264), MOV or WebM.",
          "You can cancel at any time while it is working."
        ]}
      />
    </div>
  );
}
