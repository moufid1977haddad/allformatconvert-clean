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
      if (!stream.getAudioTracks().length) setAudioNote('This recording has no sound: the screen was shared without audio (tick the box that shares the tab or system audio in the browser\'s sharing dialog — only a tab or the whole screen on Chrome and Edge can share sound), and the microphone is off.');
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
              {ext !== 'mp4' && !converting && <button type="button" onClick={toMp4} className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl py-2 font-semibold transition">Make an MP4 (plays on iPhone)</button>}
              {converting && <ProgressBar pct={converting.pct} label={converting.label} />}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Screen Recorder"
        description={`Screen Recorder captures a screen, a window or a browser tab through the screen sharing of the browser. On Chrome and Edge, a shared tab or whole screen can bring its sound; tick "Add my microphone (mixed with the screen's sound)" to add your voice in the same track, and the page warns when a recording has no sound at all. "Pause" and "Resume" continue the same file. Where MediaRecorder can write MP4 (H.264 and AAC), as in Safari and in Chrome or Edge 126 and later, you get an MP4; Firefox records WebM, and "Make an MP4" converts it on our media service. iPhone and iPad do not allow screen recording from a web page.`}
        howToTitle="How to record your screen"
        howTo={[
          `Tick "Add my microphone (mixed with the screen's sound)" if you want your voice, then click "Start Recording".`,
          `Choose the screen, window or tab in the browser's dialog; on Chrome or Edge, tick the box that shares the tab or system audio.`,
          `Use "Pause" and "Resume", then click "Stop Recording" or stop sharing from the browser's bar.`,
          `Click "Download" to save the MP4, or the WebM with a "Make an MP4" button below it.`,
        ]}
        specs={[
          { label: `Sources`, value: `A screen, window or tab; its sound on Chrome and Edge (tab or whole screen only); optional microphone in any browser that records` },
          { label: `Output format`, value: `MP4 (H.264 + AAC) where the browser can record it; otherwise WebM, which can be converted to MP4` },
          { label: `Length`, value: `No maximum in the page; the recording is held in memory while the page is open` },
          { label: `iPhone and iPad`, value: `Not available: Apple does not let web pages record the screen` },
          { label: `Usage limits`, value: `"Make an MP4" only: conversions per connection are counted per hour and per day, and the media service refuses a video over its maximum size or length.` },
        ]}
        privacy={`Recording happens in your browser, and the video is not sent anywhere unless you click "Make an MP4". That button uploads the WebM in pieces to our media service, which converts it to MP4; the WebM is wiped there when the conversion ends and the MP4 once the page has downloaded it, or after a set time. A failed start or conversion sends its cleaned message, with your browser's name and version, to our error log.`}
        privacyTitle="Where your recording is processed"
        faqs={[
          { q: `Does it record sound?`, a: `Yes, on Chrome and Edge: the sound of a shared tab or whole screen, if you tick the audio box in the sharing dialog; a window, Firefox and Safari share no sound. "Add my microphone (mixed with the screen's sound)" adds your voice in one track. With no sound at all, the page tells you.` },
          { q: `Will my recording play on an iPhone?`, a: `Yes, when it is an MP4. Safari and Chrome or Edge 126 and later record MP4 directly. Firefox records WebM, which the iPhone Photos app cannot open, so click "Make an MP4" to convert it on our media service.` },
          { q: `Can I record my screen on an iPhone or iPad?`, a: `No. Apple does not let browsers capture the screen there, so the page shows a notice and the start button stays off. Use Screen Recording in Control Center instead.` },
          { q: `Is my recording uploaded?`, a: `No, unless you click "Make an MP4". That conversion runs on our media service, which counts conversions per connection per hour and per day, refuses videos over its maximum size or length, and deletes the file once the MP4 is downloaded.` },
        ]}
        tips={[
          `Cut the first and last seconds with Video Trimmer, where you usually reach for the stop button.`,
        ]}
      />
    </div>
  );
}