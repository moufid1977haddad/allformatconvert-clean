'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { finishRecording } from '../../../lib/mediaSupport';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';

export default function VoiceRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useToolError('');
  const [converting, setConverting] = useState(false);
  const [wavUrl, setWavUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const blobRef = useRef(null);
  // Extension of what the browser REALLY recorded (Chrome/Firefox: webm, Safari: mp4),
  // never assumed -- a Safari recording renamed .webm would not open.
  const [recExt, setRecExt] = useState('webm');
  // P24 (03/10): pause / resume while recording, and an MP3 export (123apps' recorder gives MP3; MP3 plays everywhere)
  const [paused, setPaused] = useState(false);
  const [mp3Url, setMp3Url] = useState(null);
  const [mp3Busy, setMp3Busy] = useState(false);
  const pause = () => { if (mediaRecorder.current?.state === 'recording') { mediaRecorder.current.pause(); setPaused(true); } };
  const resume = () => { if (mediaRecorder.current?.state === 'paused') { mediaRecorder.current.resume(); setPaused(false); } };
  const exportMp3 = async () => {
    if (!blobRef.current || mp3Busy) return;
    setMp3Busy(true); setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      await ffmpeg.writeFile('in.' + recExt, new Uint8Array(await blobRef.current.arrayBuffer()));
      // 192 kbit/s like the site's audio tools; the exit code is checked (ffmpeg.exec does not throw)
      if (await ffmpeg.exec(['-i', 'in.' + recExt, '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', 'out.mp3']) !== 0) throw new Error('the MP3 encoder failed on this recording');
      const data = await ffmpeg.readFile('out.mp3');
      if (!data?.byteLength) throw new Error('the MP3 came out empty');
      setMp3Url(URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mpeg' })));
      ffmpeg.terminate();
    } catch (e) { setError('MP3 export failed: ' + (e?.message || e)); }
    setMp3Busy(false);
  };

  const start = async () => {
    // Say what is really wrong (28/09/2026: a browser without recording support was told "Microphone access denied:
    // undefined is not an object…").
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(window.isSecureContext ? 'This browser cannot record audio. Please use a current Safari, Chrome, Edge or Firefox.' : 'Recording needs a secure (https) page.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 30/09: AAC in MP4 (.m4a) wherever the browser can record it (Safari, Chrome and Edge 126+): the format an
      // iPhone plays and shares; Firefox can only record WebM (Opus).
      const type = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported?.(t));
      mediaRecorder.current = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => { if (e.data && e.data.size) chunks.current.push(e.data); };
      mediaRecorder.current.onstop = () => {
        try {
          const { blob, ext } = finishRecording(chunks.current, mediaRecorder.current, 'audio/webm');
          blobRef.current = blob;
          setRecExt(ext);
          setAudioUrl(URL.createObjectURL(blob));
        } catch (err) {
          setError(err.message);
        }
      };
      mediaRecorder.current.start();
      setRecording(true);
      setPaused(false);
      setAudioUrl(null);
      setWavUrl(null);
      setMp3Url(null);
      setError('');
    } catch(e) {
      setError(e && e.name === 'NotAllowedError' ? 'Microphone access was refused. Allow the microphone for this site in your browser settings, then try again.'
        : e && e.name === 'NotFoundError' ? 'No microphone was found on this device.'
        : 'The microphone could not be started: ' + ((e && e.message) || e));
    }
  };

  const stop = () => {
    mediaRecorder.current.stop();
    mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
    setPaused(false);
  };


  const encodeWav = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;
    const blockAlign = numChannels * 2;
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return buffer;
  };

  const exportWav = async () => {
    if (!blobRef.current) return;
    setConverting(true);
    setError('');
    try {
      const arrayBuffer = await blobRef.current.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      ctx.close();
      const wavBuffer = encodeWav(audioBuffer);
      setWavUrl(URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' })));
    } catch (e) {
      setError('WAV conversion failed: ' + e.message);
    }
    setConverting(false);
  };


  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Voice Recorder</h1>
        <p className="text-neutral-500 text-center mb-8">Record voice from your microphone</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition ${recording ? 'bg-red-100 animate-pulse' : 'bg-indigo-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-10 h-10 ${recording ? 'text-red-500' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          {recording && <p className={paused ? 'text-neutral-600 font-medium' : 'text-red-500 font-medium animate-pulse'}>{paused ? 'Paused — Resume to continue the same recording' : 'Recording...'}</p>}
          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 justify-center">
            {!recording ? (
              <button onClick={start} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-3 font-semibold transition">Start Recording</button>
            ) : (
              <>
                {paused
                  ? <button onClick={resume} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-3 font-semibold transition">Resume</button>
                  : <button onClick={pause} className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl px-6 py-3 font-semibold transition">Pause</button>}
                <button onClick={stop} className="bg-red-500 hover:bg-red-400 text-white rounded-xl px-6 py-3 font-semibold transition">Stop Recording</button>
              </>
            )}
          </div>
          {audioUrl && (
            <div className="space-y-3">
              <audio controls src={audioUrl} className="w-full" />
              <DownloadGroup zipName="recording.zip" alternatives>
                <FileDownload href={audioUrl} name={`recording.${recExt}`} />
                {wavUrl && <FileDownload href={wavUrl} name="recording.wav" />}
                {mp3Url && <FileDownload href={mp3Url} name="recording.mp3" />}
              </DownloadGroup>
              {!mp3Url && (
                <button onClick={exportMp3} disabled={mp3Busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-2 font-semibold transition">
                  {mp3Busy ? 'Making the MP3…' : 'Export as MP3'}
                </button>
              )}
              {!wavUrl && (
                <button onClick={exportWav} disabled={converting} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-2 font-semibold transition">
                  {converting ? 'Converting...' : 'Export as WAV'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Voice Recorder"
        description={`Voice Recorder records your microphone with the MediaRecorder built into the browser. "Pause" and "Resume" continue the same recording; "Stop Recording" ends it. The file comes in the format your browser records: M4A (AAC) where it can record MP4 audio, as Safari and Chrome or Edge 126 and later do, and WebM (Opus) elsewhere, such as Firefox. "Export as MP3" makes a 192 kbps MP3 with ffmpeg.wasm, and "Export as WAV" a 16-bit WAV. Nothing is recorded until you allow the microphone.`}
        howToTitle="How to record your voice"
        howTo={[
          `Click "Start Recording" and allow the microphone.`,
          `Use "Pause" and "Resume" as needed, then click "Stop Recording".`,
          `Listen to the recording in the player.`,
          `Click "Download" for the file as recorded, or first "Export as MP3" or "Export as WAV"; "Download all" puts every version in one ZIP.`,
        ]}
        specs={[
          { label: `Input`, value: `Your microphone, after the browser asks for permission` },
          { label: `Output formats`, value: `M4A (AAC) or WebM (Opus) as recorded; MP3 at 192 kbps; WAV, 16-bit` },
          { label: `Length`, value: `No maximum in the page; the recording is kept in memory until you leave` },
        ]}
        privacy={`The microphone sound is recorded by your browser and stays on this page. The MP3 export uses ffmpeg.wasm, downloaded from unpkg.com, and the WAV export the Web Audio API, both on your device. No recording is sent to a server. If the microphone cannot start or an export fails, that message, cleaned, reaches our error log with your browser's name and version.`}
        privacyTitle="Where your recording is processed"
        faqs={[
          { q: `Is the recording an MP3?`, a: `No, not directly: it is saved in the format your browser records, M4A (AAC) or WebM (Opus), and the extension always matches the content. Click "Export as MP3" for a 192 kbps MP3, or "Export as WAV" for an uncompressed WAV.` },
          { q: `Can I pause and continue the same recording?`, a: `Yes. "Pause" holds the recording and "Resume" carries on in the same file; only "Stop Recording" finishes it. Starting a new recording replaces the previous one, so download it first.` },
          { q: `Can I record if I blocked the microphone?`, a: `No. The page shows "Microphone access was refused" until you allow the microphone for this site in your browser settings. A device without a microphone gets "No microphone was found on this device."` },
          { q: `Is there a time limit?`, a: `No. The page sets no maximum length; the recording grows in the memory of your browser until you click "Stop Recording", so very long sessions depend on your device.` },
        ]}
        tips={[
          `For a transcript of what you said, upload the M4A or WebM to Audio to Text.`,
          `Cut silence at the start or end with Audio Trimmer before sharing.`,
        ]}
      />
    </div>
  );
}
