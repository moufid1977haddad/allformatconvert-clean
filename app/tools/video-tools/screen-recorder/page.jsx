'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { finishRecording } from '../../../lib/mediaSupport';
import { runMediaJob } from '../../../lib/mediaJob';
import ProgressBar from '../../../components/ProgressBar';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';

// 30/09 (owner): recordings came out as WebM in Chrome, Edge and Firefox, which the iPhone and the Photos app cannot
// open. Now MP4 (H.264 + AAC) is recorded directly wherever the browser can (Safari, Chrome and Edge 126+ --
// MediaRecorder.isTypeSupported, the same probe the reference recorders use); where it cannot (Firefox), the WebM is
// kept, and one click turns it into an MP4 on our video service.
const MP4_TYPES = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'];
function recorderType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return MP4_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || ['video/webm;codecs=vp9,opus', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
}
export default function ScreenRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useToolError('');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const preview = useRef(null);
  const streamRef = useRef(null);
  // The preview <video> only mounts once `recording` is true, after the stream was obtained: the stream was
  // assigned while the element did not exist yet, so the live preview stayed black (29/09). Attached here.
  useEffect(() => { if (recording && preview.current && streamRef.current) preview.current.srcObject = streamRef.current; }, [recording]);
  // Extension of what the browser REALLY recorded (Chrome/Firefox: webm, Safari: mp4).
  const [ext, setExt] = useState('webm');
  const [blobRef, setBlobRef] = useState(null);
  const [converting, setConverting] = useState(null);
  const [supported, setSupported] = useState(true);
  // P24 (03/10): the microphone, mixed with the screen's sound (123apps, ScreenPal have it), and a sentence when the
  // recording has no sound at all (the browser's "Share audio" box left unticked made a silent video without a word)
  const [withMic, setWithMic] = useState(false);
  // P24 (03/10): pause / resume (123apps' recorder, ScreenPal): the same recording continues, the timer stops meanwhile
  const [paused, setPaused] = useState(false);
  const pauseRec = () => { if (mediaRecorder.current?.state === 'recording') { mediaRecorder.current.pause(); clearInterval(timer.current); setPaused(true); } };
  const resumeRec = () => { if (mediaRecorder.current?.state === 'paused') { mediaRecorder.current.resume(); timer.current = setInterval(() => setDuration((d) => d + 1), 1000); setPaused(false); } };
  const [audioNote, setAudioNote] = useState('');
  const extraRef = useRef([]);
  useEffect(() => { setSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) && typeof MediaRecorder !== 'undefined'); }, []);

  const start = async () => {
    setError('');
    let stream;
    try {
      setAudioNote('');
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      stream = display;
      let mic = null;
      if (withMic) {
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
        catch { setAudioNote('The microphone was not allowed: recording without it.'); }
      }
      extraRef.current = mic ? [mic] : [];
      const sources = [display, mic].filter((s) => s && s.getAudioTracks().length);
      if (sources.length > 1) { // two sound sources: mixed into one track (MediaRecorder records one audio track)
        const ctx = new AudioContext(); const dest = ctx.createMediaStreamDestination();
        for (const s of sources) ctx.createMediaStreamSource(s).connect(dest);
        extraRef.current.push({ getTracks: () => [], close: () => ctx.close() });
        stream = new MediaStream([...display.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      } else if (sources.length === 1 && sources[0] === mic) {
        stream = new MediaStream([...display.getVideoTracks(), ...mic.getAudioTracks()]);
      }
      if (!stream.getAudioTracks().length) setAudioNote('This recording has no sound: the screen was shared without audio (tick "Share audio" in the browser\'s sharing dialog — only a tab or the whole screen on Chrome and Edge can share sound), and the microphone is off.');
      streamRef.current = stream;
      if (preview.current) preview.current.srcObject = stream;
      const type = recorderType();
      mediaRecorder.current = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => { if (e.data && e.data.size) chunks.current.push(e.data); };
      mediaRecorder.current.onstop = () => {
        try {
          const { blob, ext: realExt } = finishRecording(chunks.current, mediaRecorder.current, 'video/webm');
          setExt(realExt);
          setBlobRef(blob);
          setVideoUrl(URL.createObjectURL(blob));
        } catch (err) {
          setError(err.message);
        }
        if (preview.current) preview.current.srcObject = null;
        display.getTracks().forEach(t => t.stop());
        for (const x of extraRef.current) { x.getTracks().forEach((t) => t.stop()); x.close?.(); }
      };
      stream.getVideoTracks()[0].onended = () => stop();
      mediaRecorder.current.start(1000);
      setRecording(true);
      setDuration(0);
      timer.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      // Stop any tracks we managed to acquire before the failure (e.g. MediaRecorder
      // construction/start throwing after the user granted screen access) so the
      // browser's sharing indicator doesn't stay on with no way to turn it off.
      if (stream) stream.getTracks().forEach(t => t.stop());
      for (const x of extraRef.current) { x.getTracks().forEach((t) => t.stop()); x.close?.(); }
      if (preview.current) preview.current.srcObject = null;
      setRecording(false);
      clearInterval(timer.current);
      setError(err?.name === 'NotAllowedError' ? 'Screen share was cancelled.' : 'Recording failed: ' + (err?.message || 'unknown error'));
    }
  };

  const stop = () => {
    setPaused(false);
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') mediaRecorder.current.stop();
    setRecording(false);
    clearInterval(timer.current);
  };

  const toMp4 = async () => {
    if (!blobRef || converting) return;
    setError('');
    try {
      const out = await runMediaJob({
        file: new File([blobRef], `recording.${ext}`, { type: blobRef.type }), op: 'convert', params: { target: 'mp4', quality: 'high' },
        onStage: (s) => setConverting({ label: s.stage === 'upload' ? 'Uploading to our video service' : s.stage === 'processing' ? 'Making the MP4' : s.stage === 'download' ? 'Downloading the MP4' : 'Preparing…', pct: typeof s.pct === 'number' ? Math.round(s.pct) : 0 }),
      });
      if (!out.blob || !out.bytes) throw new Error('The video service returned an empty file. Please try again.');
      const mp4 = new Blob([out.blob], { type: 'video/mp4' });
      setBlobRef(mp4); setExt('mp4'); setVideoUrl(URL.createObjectURL(mp4));
    } catch (e) { if (e?.code !== 'cancelled') setError(e?.message || 'The MP4 could not be made.'); }
    setConverting(null);
  };

  const fmt = (s) => Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Screen Recorder</h1>
        <p className="text-neutral-500 text-center mb-8">Record your screen directly in the browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          {!supported && <p role="alert" className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-center">This browser cannot record the screen from a web page. On iPhone and iPad, Apple does not allow it: use Screen Recording in Control Center instead. On a computer, use Chrome, Edge, Firefox or Safari.</p>}
          {recording && <video ref={preview} autoPlay muted playsInline className="w-full rounded-xl bg-neutral-800" />}
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono">{fmt(duration)}</div>
            <div className="flex gap-4 justify-center">
              {!recording ? (
                <button onClick={start} disabled={!supported} className="bg-red-600 hover:bg-red-500 rounded-xl px-8 py-3 font-semibold transition text-white">Start Recording</button>
              ) : (
                <>
                  {paused
                    ? <button onClick={resumeRec} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-3 font-semibold transition">Resume</button>
                    : <button onClick={pauseRec} className="bg-neutral-100 hover:bg-neutral-200 rounded-xl px-6 py-3 font-semibold transition">Pause</button>}
                  <button onClick={stop} className="bg-neutral-200 hover:bg-neutral-200 rounded-xl px-8 py-3 font-semibold transition">Stop Recording</button>
                </>
              )}
            </div>
          </div>
          {!recording && (
            <label className="flex items-center justify-center gap-2 text-sm text-neutral-700">
              <input id="sr-mic" type="checkbox" checked={withMic} onChange={(e) => setWithMic(e.target.checked)} /> Add my microphone (mixed with the screen's sound)
            </label>
          )}
          {audioNote && <p role="status" className="text-amber-700 text-center text-sm" data-audio-note>{audioNote}</p>}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {videoUrl && (
            <div className="space-y-3">
              <video controls playsInline src={videoUrl} className="w-full rounded-xl" />
              <FileDownload href={videoUrl} name={`screen-recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.${ext}`} />
              {ext !== 'mp4' && !converting && <button type="button" onClick={toMp4} className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl py-2 font-semibold transition">Make an MP4 (plays on iPhone and everywhere)</button>}
              {converting && <ProgressBar pct={converting.pct} label={converting.label} />}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Screen Recorder"
        description="Screen Recorder captures your screen, window, or browser tab using the browser's built-in screen-sharing and MediaRecorder APIs, in your browser, with no software installation (only Firefox's optional MP4 copy is made on our video service). Recordings are saved as MP4 (H.264 + AAC) in Chrome, Edge and Safari; Firefox can only record WebM, which one click turns into an MP4 on our video service."
        howTo={[
          "Click \"Start Recording\" and choose which screen, window, or tab to share when your browser prompts you.",
          "Perform the actions you want to record while the live preview plays.",
          "Click \"Stop Recording\" when you're finished.",
          "Preview the result, then click \"Download\" to save it (MP4; in Firefox, WebM, with a button to make an MP4)."
        ]}
        faqs={[
          { q: "What video format do recordings download as?", a: "MP4 (H.264 video, AAC sound) in Chrome, Edge and Safari, the format every phone and computer plays. Firefox can only record WebM: the page then offers to make an MP4 from it on our video service. The file extension always matches the real content." },
          { q: "Is Screen Recorder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it record audio?", a: "Yes: the sound of the screen or tab you share (tick 'Share audio' in the browser's dialog; Chrome and Edge can share a tab's or the whole screen's sound), and your microphone if you tick 'Add my microphone' — both are mixed into one track. If the recording has no sound at all, the page says so." },
          { q: "Is my recording uploaded anywhere?", a: "No: recording happens entirely in your browser, and only if you click \"Make an MP4\" (Firefox) is the recording sent to our video service, which deletes it once the MP4 is made and downloaded." },
          { q: "Can I record my screen on an iPhone or iPad?", a: "Not from a web page: Apple does not let browsers record the screen on iPhone and iPad. Use Screen Recording in Control Center instead." }
        ]}
        tips={[
          "Choose \"Chrome Tab\" instead of your whole screen when recording to also capture that tab's audio, if your browser supports it.",
          "Close unnecessary tabs and apps before recording for smoother performance.",
          "If you need a different format than your browser's native one, convert the downloaded file afterward with a dedicated video converter.",
          "Recording also stops if you stop sharing from the browser's own sharing indicator, not just the \"Stop Recording\" button."
        ]}
      />
    </div>
  );
}