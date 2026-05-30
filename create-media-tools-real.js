const fs = require('fs');
const path = require('path');

const basePath = 'app/tools/media-tools';

const tools = {
  'voice-recorder': `'use client';
import { useState, useRef } from 'react';
export default function VoiceRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.current.start();
    setRecording(true);
    setDuration(0);
    timer.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stop = () => {
    mediaRecorder.current.stop();
    setRecording(false);
    clearInterval(timer.current);
  };

  const fmt = (s) => Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Voice Recorder</h1>
        <p className="text-neutral-400 text-center mb-8">Record voice from your microphone</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-6 text-center">
          <div className="text-6xl font-mono">{fmt(duration)}</div>
          {recording && <div className="flex justify-center gap-2">{[...Array(5)].map((_,i) => <div key={i} className="w-2 bg-red-500 rounded animate-bounce" style={{height: Math.random()*40+10+'px', animationDelay: i*0.1+'s'}}></div>)}</div>}
          <div className="flex gap-4 justify-center">
            {!recording ? (
              <button onClick={start} className="bg-red-600 hover:bg-red-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl transition">🎙️</button>
            ) : (
              <button onClick={stop} className="bg-neutral-700 hover:bg-neutral-600 rounded-full w-16 h-16 flex items-center justify-center text-2xl transition">⏹️</button>
            )}
          </div>
          {audioUrl && (
            <div className="space-y-3">
              <audio controls src={audioUrl} className="w-full" />
              <a href={audioUrl} download="recording.webm" className="block w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download Recording</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'screen-recorder': `'use client';
import { useState, useRef } from 'react';
export default function ScreenRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const preview = useRef(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (preview.current) preview.current.srcObject = stream;
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      setVideoUrl(URL.createObjectURL(blob));
      if (preview.current) preview.current.srcObject = null;
      stream.getTracks().forEach(t => t.stop());
    };
    stream.getVideoTracks()[0].onended = () => stop();
    mediaRecorder.current.start();
    setRecording(true);
    setDuration(0);
    timer.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stop = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') mediaRecorder.current.stop();
    setRecording(false);
    clearInterval(timer.current);
  };

  const fmt = (s) => Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Screen Recorder</h1>
        <p className="text-neutral-400 text-center mb-8">Record your screen directly in the browser</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          {recording && <video ref={preview} autoPlay muted className="w-full rounded-xl bg-neutral-800" />}
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono">{fmt(duration)}</div>
            <div className="flex gap-4 justify-center">
              {!recording ? (
                <button onClick={start} className="bg-red-600 hover:bg-red-500 rounded-xl px-8 py-3 font-semibold transition">Start Recording</button>
              ) : (
                <button onClick={stop} className="bg-neutral-700 hover:bg-neutral-600 rounded-xl px-8 py-3 font-semibold transition">Stop Recording</button>
              )}
            </div>
          </div>
          {videoUrl && (
            <div className="space-y-3">
              <video controls src={videoUrl} className="w-full rounded-xl" />
              <a href={videoUrl} download="recording.webm" className="block w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-center">Download Recording</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'media-player': `'use client';
import { useState, useRef } from 'react';
export default function MediaPlayerPage() {
  const [file, setFile] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [url, setUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setIsVideo(f.type.startsWith('video'));
    setUrl(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Media Player</h1>
        <p className="text-neutral-400 text-center mb-8">Play audio and video files in your browser</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a media file here'}</p>
            <p className="text-neutral-500 text-sm mt-1">Supports MP4, MP3, WAV, OGG, WebM</p>
            <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFile} />
          </div>
          {url && (
            <div className="space-y-3">
              {isVideo ? (
                <video controls src={url} className="w-full rounded-xl bg-neutral-800" />
              ) : (
                <div className="bg-neutral-800 rounded-xl p-8 text-center space-y-4">
                  <div className="text-6xl">🎵</div>
                  <p className="text-neutral-300 font-semibold">{file.name}</p>
                  <audio controls src={url} className="w-full" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'audio-waveform': `'use client';
import { useState, useRef, useEffect } from 'react';
export default function AudioWaveformPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveform, setWaveform] = useState([]);
  const inputRef = useRef();
  const canvasRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const audioCtx = new AudioContext();
    const arrayBuffer = await f.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const samples = 200;
    const blockSize = Math.floor(data.length / samples);
    const waveData = [];
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) sum += Math.abs(data[i * blockSize + j]);
      waveData.push(sum / blockSize);
    }
    const max = Math.max(...waveData);
    setWaveform(waveData.map(v => v / max));
  };

  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, w, h);
    const barWidth = w / waveform.length;
    waveform.forEach((v, i) => {
      const barH = v * h * 0.8;
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(i * barWidth, (h - barH) / 2, barWidth - 1, barH);
    });
  }, [waveform]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Waveform</h1>
        <p className="text-neutral-400 text-center mb-8">Visualize audio waveform</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {waveform.length > 0 && (
            <div className="space-y-3">
              <canvas ref={canvasRef} width={800} height={200} className="w-full rounded-xl" />
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'gif-maker': `'use client';
import { useState, useRef } from 'react';
export default function GifMakerPage() {
  const [images, setImages] = useState([]);
  const [delay, setDelay] = useState(200);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(f => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: f.name, src: reader.result });
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => setImages(prev => [...prev, ...imgs]));
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const createGif = async () => {
    if (images.length < 2) return;
    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = images[0].src; });
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      const frames = [];
      for (const image of images) {
        const im = new Image();
        await new Promise(r => { im.onload = r; im.src = image.src; });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/png'));
      }
      setResult({ frames, delay });
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Maker</h1>
        <p className="text-neutral-400 text-center mb-8">Create animated GIF from images</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click to add images for GIF frames</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.src} className="w-full h-20 object-cover rounded" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
                  <p className="text-xs text-neutral-400 text-center">{i+1}</p>
                </div>
              ))}
            </div>
          )}
          <div><label className="block text-sm text-neutral-400 mb-1">Frame Delay: {delay}ms</label><input type="range" min="50" max="1000" value={delay} onChange={e => setDelay(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={createGif} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Preview GIF'}</button>
          {result && (
            <div className="text-center space-y-3">
              <p className="text-green-400">Preview frames ({result.frames.length} frames at {result.delay}ms)</p>
              <div className="grid grid-cols-4 gap-2">
                {result.frames.map((f, i) => <img key={i} src={f} className="w-full rounded" />)}
              </div>
              <p className="text-neutral-400 text-sm">Note: Download individual frames and use an online GIF assembler for the final GIF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'video-screenshot': `'use client';
import { useState, useRef } from 'react';
export default function VideoScreenshotPage() {
  const [file, setFile] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setScreenshots([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const url = canvas.toDataURL('image/png');
    const time = videoRef.current.currentTime.toFixed(2);
    setScreenshots(prev => [...prev, { url, time }]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Screenshot</h1>
        <p className="text-neutral-400 text-center mb-8">Capture screenshots from video files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && (
            <div className="space-y-3">
              <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />
              <button onClick={capture} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Capture Screenshot</button>
            </div>
          )}
          {screenshots.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{screenshots.length} screenshot(s) captured</p>
              <div className="grid grid-cols-2 gap-3">
                {screenshots.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <img src={s.url} className="w-full rounded" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-400">At {s.time}s</span>
                      <a href={s.url} download={"screenshot-" + s.time + ".png"} className="text-xs text-indigo-400 hover:text-indigo-300">Download</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'video-metadata': `'use client';
import { useState, useRef } from 'react';
export default function VideoMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [file, setFile] = useState(null);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setMetadata({
        name: f.name,
        size: (f.size / (1024*1024)).toFixed(2) + ' MB',
        type: f.type,
        duration: Math.floor(video.duration / 60) + ':' + Math.floor(video.duration % 60).toString().padStart(2,'0'),
        width: video.videoWidth + 'px',
        height: video.videoHeight + 'px',
        lastModified: new Date(f.lastModified).toLocaleString(),
      });
    };
    video.src = url;
    if (videoRef.current) videoRef.current.src = url;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Metadata</h1>
        <p className="text-neutral-400 text-center mb-8">View video metadata and information</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-neutral-800 rounded-lg p-3">
                  <span className="text-neutral-400 capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                  <span className="text-indigo-400 font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'audio-metadata': `'use client';
import { useState, useRef } from 'react';
export default function AudioMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const audio = document.createElement('audio');
    audio.onloadedmetadata = () => {
      setMetadata({
        name: f.name,
        size: (f.size / (1024*1024)).toFixed(2) + ' MB',
        type: f.type,
        duration: Math.floor(audio.duration / 60) + ':' + Math.floor(audio.duration % 60).toString().padStart(2,'0'),
        lastModified: new Date(f.lastModified).toLocaleString(),
      });
    };
    audio.src = url;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Metadata</h1>
        <p className="text-neutral-400 text-center mb-8">View audio metadata and information</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-neutral-800 rounded-lg p-3">
                  <span className="text-neutral-400 capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                  <span className="text-indigo-400 font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'gif-compressor': `'use client';
import { useState, useRef } from 'react';
export default function GifCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const compress = async () => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        setResult({ url: URL.createObjectURL(blob), originalSize: file.size, newSize: blob.size });
      }, 'image/png', quality / 100);
    };
    img.src = url;
  };

  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Compressor</h1>
        <p className="text-neutral-400 text-center mb-8">Compress GIF files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Compress</button>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">After</div><div className="font-bold text-indigo-400">{formatSize(result.newSize)}</div></div>
                <div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">Saved</div><div className="font-bold text-green-400">{Math.round((1-result.newSize/result.originalSize)*100)}%</div></div>
              </div>
              <a href={result.url} download="compressed.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'video-to-gif': `'use client';
import { useState, useRef } from 'react';
export default function VideoToGifPage() {
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fps, setFps] = useState(5);
  const [duration, setDuration] = useState(3);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFrames([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const capture = async () => {
    if (!videoRef.current || !file) return;
    setLoading(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    const capturedFrames = [];
    const totalFrames = fps * duration;
    const interval = duration / totalFrames;
    video.currentTime = 0;
    for (let i = 0; i < totalFrames; i++) {
      await new Promise(r => setTimeout(r, 100));
      video.currentTime = i * interval;
      await new Promise(r => { video.onseeked = r; });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      capturedFrames.push(canvas.toDataURL('image/png'));
    }
    setFrames(capturedFrames);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video to GIF</h1>
        <p className="text-neutral-400 text-center mb-8">Extract frames from video as GIF preview</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">FPS: {fps}</label><input type="range" min="1" max="15" value={fps} onChange={e => setFps(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Duration: {duration}s</label><input type="range" min="1" max="10" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <button onClick={capture} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Capturing...' : 'Capture Frames'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-400 text-center">{frames.length} frames captured</p>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((f, i) => <img key={i} src={f} className="w-full rounded" />)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {frames.map((f, i) => <a key={i} href={f} download={"frame-" + i + ".png"} className="block text-center bg-neutral-800 hover:bg-neutral-700 rounded-lg py-1 text-sm transition">Frame {i+1}</a>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'audio-merger': `'use client';
import { useState, useRef } from 'react';
export default function AudioMergerPage() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFiles = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const buffers = await Promise.all(files.map(async f => {
        const ab = await f.arrayBuffer();
        return audioCtx.decodeAudioData(ab);
      }));
      const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
      const merged = audioCtx.createBuffer(1, totalLength, audioCtx.sampleRate);
      let offset = 0;
      buffers.forEach(b => {
        merged.getChannelData(0).set(b.getChannelData(0), offset);
        offset += b.length;
      });
      const offlineCtx = new OfflineAudioContext(1, totalLength, audioCtx.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = merged;
      source.connect(offlineCtx.destination);
      source.start();
      const renderedBuffer = await offlineCtx.startRendering();
      const wav = audioBufferToWav(renderedBuffer);
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    const writeString = (offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    return arrayBuffer;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Merger</h1>
        <p className="text-neutral-400 text-center mb-8">Merge multiple audio files into one</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click to add audio files</p>
            <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-800 rounded-lg p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={merge} disabled={files.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Merging...' : 'Merge Audio'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="merged.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'audio-booster': `'use client';
import { useState, useRef } from 'react';
export default function AudioBoosterPage() {
  const [file, setFile] = useState(null);
  const [gain, setGain] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const boost = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = gain;
      source.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const wav = bufferToWav(rendered);
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const bufferToWav = (buffer) => {
    const data = buffer.getChannelData(0);
    const ab = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(ab);
    const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
    write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
    view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
    view.setUint32(24,buffer.sampleRate,true); view.setUint32(28,buffer.sampleRate*2,true);
    view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
    let o = 44;
    for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
    return ab;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Booster</h1>
        <p className="text-neutral-400 text-center mb-8">Boost audio volume</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Gain: {gain}x</label><input type="range" min="0.5" max="5" step="0.5" value={gain} onChange={e => setGain(parseFloat(e.target.value))} className="w-full" /></div>
          <button onClick={boost} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : 'Boost Audio'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="boosted.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'audio-splitter': `'use client';
import { useState, useRef } from 'react';
export default function AudioSplitterPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [splitAt, setSplitAt] = useState(30);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setParts([]);
    const audioCtx = new AudioContext();
    const ab = await f.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(ab);
    setDuration(Math.floor(buffer.duration));
    setSplitAt(Math.floor(buffer.duration / 2));
  };

  const split = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const sampleRate = buffer.sampleRate;
      const splitSample = splitAt * sampleRate;
      const splitPoints = [0, splitSample, buffer.length];
      const results = [];
      for (let i = 0; i < splitPoints.length - 1; i++) {
        const start = splitPoints[i];
        const end = splitPoints[i+1];
        const length = end - start;
        const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
        const partBuffer = offlineCtx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0).slice(start, end);
        partBuffer.getChannelData(0).set(data);
        const source = offlineCtx.createBufferSource();
        source.buffer = partBuffer;
        source.connect(offlineCtx.destination);
        source.start();
        const rendered = await offlineCtx.startRendering();
        const wav = bufferToWav(rendered);
        results.push(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
      }
      setParts(results);
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const bufferToWav = (buffer) => {
    const data = buffer.getChannelData(0);
    const ab = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(ab);
    const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
    write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
    view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
    view.setUint32(24,buffer.sampleRate,true); view.setUint32(28,buffer.sampleRate*2,true);
    view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
    let o = 44;
    for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
    return ab;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Splitter</h1>
        <p className="text-neutral-400 text-center mb-8">Split audio into parts</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {duration > 0 && (
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Split at: {splitAt}s (Total: {duration}s)</label>
              <input type="range" min="1" max={duration-1} value={splitAt} onChange={e => setSplitAt(parseInt(e.target.value))} className="w-full" />
            </div>
          )}
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Splitting...' : 'Split Audio'}</button>
          {parts.length > 0 && (
            <div className="space-y-3">
              {parts.map((url, i) => (
                <div key={i} className="bg-neutral-800 rounded-xl p-3 space-y-2">
                  <p className="text-sm text-neutral-400">Part {i+1}</p>
                  <audio controls src={url} className="w-full" />
                  <a href={url} download={"part-" + (i+1) + ".wav"} className="block text-center bg-green-600 hover:bg-green-500 rounded-lg py-1 text-sm transition">Download Part {i+1}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'audio-equalizer': `'use client';
import { useState, useRef } from 'react';
export default function AudioEqualizerPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [bands, setBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setResult(null);
  };

  const apply = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      const bass = offlineCtx.createBiquadFilter();
      bass.type = 'lowshelf'; bass.frequency.value = 200; bass.gain.value = bands.bass;
      const mid = offlineCtx.createBiquadFilter();
      mid.type = 'peaking'; mid.frequency.value = 1000; mid.gain.value = bands.mid;
      const treble = offlineCtx.createBiquadFilter();
      treble.type = 'highshelf'; treble.frequency.value = 3000; treble.gain.value = bands.treble;
      source.connect(bass); bass.connect(mid); mid.connect(treble); treble.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const data = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + data.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
      let o = 44;
      for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Equalizer</h1>
        <p className="text-neutral-400 text-center mb-8">Adjust audio frequencies</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          {['bass','mid','treble'].map(band => (
            <div key={band}>
              <label className="block text-sm text-neutral-400 mb-1 capitalize">{band}: {bands[band]}dB</label>
              <input type="range" min="-12" max="12" value={bands[band]} onChange={e => setBands(p => ({...p, [band]: parseInt(e.target.value)}))} className="w-full" />
            </div>
          ))}
          <button onClick={apply} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : 'Apply EQ'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="equalized.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'video-watermark': `'use client';
import { useState, useRef } from 'react';
export default function VideoWatermarkPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('Watermark');
  const [position, setPosition] = useState('bottom-right');
  const [screenshots, setScreenshots] = useState([]);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setScreenshots([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const capture = () => {
    if (!videoRef.current || !text) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const tw = ctx.measureText(text).width;
    let x = 20, y = 40;
    if (position === 'bottom-right') { x = canvas.width - tw - 20; y = canvas.height - 20; }
    else if (position === 'bottom-left') { x = 20; y = canvas.height - 20; }
    else if (position === 'top-right') { x = canvas.width - tw - 20; y = 40; }
    else if (position === 'center') { x = (canvas.width - tw) / 2; y = canvas.height / 2; }
    ctx.fillText(text, x, y);
    const url = canvas.toDataURL('image/png');
    const time = videoRef.current.currentTime.toFixed(2);
    setScreenshots(prev => [...prev, { url, time }]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Watermark</h1>
        <p className="text-neutral-400 text-center mb-8">Add watermark to video frames</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div><label className="block text-sm text-neutral-400 mb-1">Watermark Text</label><input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
          <div><label className="block text-sm text-neutral-400 mb-2">Position</label><div className="grid grid-cols-3 gap-2">{['top-left','top-right','center','bottom-left','bottom-right'].map(p => <button key={p} onClick={() => setPosition(p)} className={"py-2 rounded-lg text-sm font-semibold transition " + (position===p?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-700')}>{p}</button>)}</div></div>
          <button onClick={capture} disabled={!file || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Capture Frame with Watermark</button>
          {screenshots.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {screenshots.map((s, i) => (
                <div key={i} className="space-y-1">
                  <img src={s.url} className="w-full rounded" />
                  <a href={s.url} download={"watermarked-" + s.time + ".png"} className="block text-center text-sm text-indigo-400 hover:text-indigo-300">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'subtitle-generator': `'use client';
import { useState, useRef } from 'react';
export default function SubtitleGeneratorPage() {
  const [file, setFile] = useState(null);
  const [subtitles, setSubtitles] = useState([{ start: '00:00:00', end: '00:00:05', text: '' }]);
  const [srtContent, setSrtContent] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); };

  const addSubtitle = () => setSubtitles(prev => [...prev, { start: '00:00:00', end: '00:00:05', text: '' }]);
  const removeSubtitle = (i) => setSubtitles(prev => prev.filter((_,idx) => idx !== i));
  const updateSubtitle = (i, field, value) => setSubtitles(prev => prev.map((s,idx) => idx === i ? {...s, [field]: value} : s));

  const generate = () => {
    const srt = subtitles.map((s, i) => i+1 + '\\n' + s.start + ',000 --> ' + s.end + ',000\\n' + s.text + '\\n').join('\\n');
    setSrtContent(srt);
  };

  const download = () => {
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'subtitles.srt';
    a.click();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Subtitle Generator</h1>
        <p className="text-neutral-400 text-center mb-8">Create SRT subtitle files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="space-y-3">
            {subtitles.map((s, i) => (
              <div key={i} className="bg-neutral-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Subtitle {i+1}</span>
                  <button onClick={() => removeSubtitle(i)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-neutral-500 mb-1">Start (HH:MM:SS)</label><input type="text" value={s.start} onChange={e => updateSubtitle(i,'start',e.target.value)} className="w-full bg-neutral-700 rounded-lg p-2 font-mono text-sm" /></div>
                  <div><label className="block text-xs text-neutral-500 mb-1">End (HH:MM:SS)</label><input type="text" value={s.end} onChange={e => updateSubtitle(i,'end',e.target.value)} className="w-full bg-neutral-700 rounded-lg p-2 font-mono text-sm" /></div>
                </div>
                <input type="text" value={s.text} onChange={e => updateSubtitle(i,'text',e.target.value)} className="w-full bg-neutral-700 rounded-lg p-2 text-sm" placeholder="Subtitle text..." />
              </div>
            ))}
          </div>
          <button onClick={addSubtitle} className="w-full bg-neutral-700 hover:bg-neutral-600 rounded-xl py-2 font-semibold transition">Add Subtitle</button>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate SRT</button>
          {srtContent && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={srtContent} readOnly />
              <button onClick={download} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download SRT</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'audio-to-text': `'use client';
import { useState, useRef } from 'react';
export default function AudioToTextPage() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef();
  const recognition = useRef(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SR();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
    };
    recognition.current.onerror = (e) => setStatus('Error: ' + e.error);
    recognition.current.start();
    setIsRecording(true);
    setStatus('Listening...');
  };

  const stopRecording = () => {
    if (recognition.current) recognition.current.stop();
    setIsRecording(false);
    setStatus('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio to Text</h1>
        <p className="text-neutral-400 text-center mb-8">Transcribe speech to text in real time</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">{isRecording ? '🔴' : '🎙️'}</div>
            {!isRecording ? (
              <button onClick={startRecording} className="bg-red-600 hover:bg-red-500 rounded-xl px-8 py-3 font-semibold transition">Start Transcription</button>
            ) : (
              <button onClick={stopRecording} className="bg-neutral-700 hover:bg-neutral-600 rounded-xl px-8 py-3 font-semibold transition">Stop</button>
            )}
            {status && <p className="text-yellow-400 text-sm">{status}</p>}
          </div>
          {transcript && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none" value={transcript} readOnly />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => navigator.clipboard.writeText(transcript)} className="bg-neutral-700 hover:bg-neutral-600 rounded-xl py-2 font-semibold transition">Copy</button>
                <button onClick={() => { const b = new Blob([transcript],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='transcript.txt'; a.click(); }} className="bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</button>
              </div>
            </div>
          )}
          <p className="text-neutral-500 text-xs text-center">Note: Works best in Google Chrome with microphone permission</p>
        </div>
      </div>
    </div>
  );
}`,

  'video-converter': `'use client';
import { useState, useRef } from 'react';
export default function VideoConverterPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const videoRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const convert = async () => {
    if (!file) return;
    setStatus('Converting to WebM...');
    try {
      const stream = videoRef.current.captureStream();
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult(URL.createObjectURL(blob));
        setStatus('');
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Converter</h1>
        <p className="text-neutral-400 text-center mb-8">Convert video files to WebM format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={convert} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert to WebM</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="converted.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download WebM</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'video-trimmer': `'use client';
import { useState, useRef } from 'react';
export default function VideoTrimmerPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.onloadedmetadata = () => {
        setDuration(Math.floor(videoRef.current.duration));
        setEnd(Math.floor(videoRef.current.duration));
      };
    }
  };

  const trim = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Trimming...');
    try {
      const stream = videoRef.current.captureStream();
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult(URL.createObjectURL(blob));
        setStatus('');
      };
      videoRef.current.currentTime = start;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, (end - start) * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Trimmer</h1>
        <p className="text-neutral-400 text-center mb-8">Trim and cut video files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-400 mb-1">Start: {start}s</label><input type="range" min="0" max={duration-1} value={start} onChange={e => setStart(parseInt(e.target.value))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-400 mb-1">End: {end}s</label><input type="range" min="1" max={duration} value={end} onChange={e => setEnd(parseInt(e.target.value))} className="w-full" /></div>
            </div>
          )}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={trim} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Trim Video ({end-start}s)</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="trimmed.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'video-compressor': `'use client';
import { useState, useRef } from 'react';
export default function VideoCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.5);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const compress = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Compressing...');
    try {
      const stream = videoRef.current.captureStream();
      const options = { mimeType: 'video/webm', videoBitsPerSecond: quality * 2500000 };
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResult({ url: URL.createObjectURL(blob), size: blob.size, original: file.size });
        setStatus('');
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  const fmt = (b) => b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Compressor</h1>
        <p className="text-neutral-400 text-center mb-8">Compress video files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div><label className="block text-sm text-neutral-400 mb-1">Quality: {Math.round(quality*100)}%</label><input type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} className="w-full" /></div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={compress} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Compress Video</button>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">Before</div><div className="font-bold">{fmt(result.original)}</div></div>
                <div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">After</div><div className="font-bold text-indigo-400">{fmt(result.size)}</div></div>
                <div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">Saved</div><div className="font-bold text-green-400">{Math.round((1-result.size/result.original)*100)}%</div></div>
              </div>
              <video controls src={result.url} className="w-full rounded-xl" />
              <a href={result.url} download="compressed.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'video-to-audio': `'use client';
import { useState, useRef } from 'react';
export default function VideoToAudioPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Extracting audio...');
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const data = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + data.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
      let o = 44;
      for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video to Audio</h1>
        <p className="text-neutral-400 text-center mb-8">Extract audio from video files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {status && <p className="text-yellow-400 text-center text-sm">{status}</p>}
          <button onClick={extract} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Extracting...' : 'Extract Audio'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="audio.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download WAV</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'audio-converter': `'use client';
import { useState, useRef } from 'react';
export default function AudioConverterPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting to WAV...');
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const data = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + data.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
      let o = 44;
      for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Converter</h1>
        <p className="text-neutral-400 text-center mb-8">Convert audio files to WAV format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <p className="text-neutral-500 text-sm mt-1">Supports MP3, OGG, M4A, FLAC, WebM</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {status && <p className="text-yellow-400 text-center text-sm">{status}</p>}
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to WAV'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="converted.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download WAV</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'audio-trimmer': `'use client';
import { useState, useRef } from 'react';
export default function AudioTrimmerPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const audio = document.createElement('audio');
    audio.onloadedmetadata = () => { setDuration(Math.floor(audio.duration)); setEnd(Math.floor(audio.duration)); };
    audio.src = url;
  };

  const trim = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const sampleRate = buffer.sampleRate;
      const startSample = start * sampleRate;
      const endSample = end * sampleRate;
      const length = endSample - startSample;
      const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
      const trimBuffer = offlineCtx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0).slice(startSample, endSample);
      trimBuffer.getChannelData(0).set(data);
      const source = offlineCtx.createBufferSource();
      source.buffer = trimBuffer;
      source.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const rdata = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + rdata.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+rdata.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,rdata.length*2,true);
      let o = 44;
      for (let i = 0; i < rdata.length; i++) { const s = Math.max(-1,Math.min(1,rdata[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Trimmer</h1>
        <p className="text-neutral-400 text-center mb-8">Trim and cut audio files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-400 mb-1">Start: {start}s</label><input type="range" min="0" max={duration-1} value={start} onChange={e => setStart(parseInt(e.target.value))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-400 mb-1">End: {end}s</label><input type="range" min="1" max={duration} value={end} onChange={e => setEnd(parseInt(e.target.value))} className="w-full" /></div>
            </div>
          )}
          <button onClick={trim} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Trimming...' : 'Trim Audio (' + (end-start) + 's)'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="trimmed.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'audio-compressor': `'use client';
import { useState, useRef } from 'react';
export default function AudioCompressorPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(-24);
  const [ratio, setRatio] = useState(4);
  const [audioUrl, setAudioUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setResult(null);
  };

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value = threshold;
      compressor.ratio.value = ratio;
      compressor.knee.value = 10;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      source.connect(compressor);
      compressor.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const data = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + data.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
      let o = 44;
      for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Compressor</h1>
        <p className="text-neutral-400 text-center mb-8">Apply dynamic range compression to audio</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop an audio file here'}</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          <div><label className="block text-sm text-neutral-400 mb-1">Threshold: {threshold}dB</label><input type="range" min="-60" max="0" value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-400 mb-1">Ratio: {ratio}:1</label><input type="range" min="1" max="20" value={ratio} onChange={e => setRatio(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : 'Apply Compression'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="compressed.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'video-resizer': `'use client';
import { useState, useRef } from 'react';
export default function VideoResizerPage() {
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.onloadedmetadata = () => { setWidth(videoRef.current.videoWidth); setHeight(videoRef.current.videoHeight); };
    }
  };

  const resize = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Resizing...');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      const drawFrame = () => { ctx.drawImage(videoRef.current, 0, 0, width, height); if (!videoRef.current.paused && !videoRef.current.ended) requestAnimationFrame(drawFrame); };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      drawFrame();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Resizer</h1>
        <p className="text-neutral-400 text-center mb-8">Resize video dimensions</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Width</label><input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Height</label><input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">{[['720p',1280,720],['1080p',1920,1080],['480p',854,480]].map(([label,w,h]) => <button key={label} onClick={() => { setWidth(w); setHeight(h); }} className="bg-neutral-800 hover:bg-neutral-700 rounded-lg py-2 text-sm font-semibold transition">{label}</button>)}</div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={resize} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Resize Video</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="resized.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'video-rotator': `'use client';
import { useState, useRef } from 'react';
export default function VideoRotatorPage() {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState(90);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const rotate = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Rotating...');
    try {
      const canvas = document.createElement('canvas');
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      if (angle === 90 || angle === 270) { canvas.width = vh; canvas.height = vw; }
      else { canvas.width = vw; canvas.height = vh; }
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(angle * Math.PI / 180);
        ctx.drawImage(videoRef.current, -vw/2, -vh/2, vw, vh);
        ctx.restore();
        if (!videoRef.current.paused && !videoRef.current.ended) requestAnimationFrame(drawFrame);
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      drawFrame();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Rotator</h1>
        <p className="text-neutral-400 text-center mb-8">Rotate video files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={"px-4 py-2 rounded-lg font-semibold transition " + (angle===a?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-700')}>{a}°</button>)}</div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={rotate} disabled={!file || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Rotate Video</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="rotated.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'video-merger': `'use client';
import { useState, useRef } from 'react';
export default function VideoMergerPage() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFiles = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) return;
    setStatus('Merging videos...');
    try {
      const canvas = document.createElement('canvas');
      const videos = await Promise.all(files.map(f => new Promise(resolve => {
        const v = document.createElement('video');
        v.src = URL.createObjectURL(f);
        v.onloadedmetadata = () => resolve(v);
      })));
      canvas.width = videos[0].videoWidth;
      canvas.height = videos[0].videoHeight;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      recorder.start();
      for (const video of videos) {
        await video.play();
        await new Promise(resolve => {
          const draw = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (!video.ended) requestAnimationFrame(draw);
            else resolve();
          };
          draw();
        });
        video.pause();
      }
      recorder.stop();
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Merger</h1>
        <p className="text-neutral-400 text-center mb-8">Merge multiple videos into one</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click to add video files</p>
            <input ref={inputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-800 rounded-lg p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={merge} disabled={files.length < 2 || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Merge Videos</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="merged.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'video-filter': `'use client';
import { useState, useRef } from 'react';
export default function VideoFilterPage() {
  const [file, setFile] = useState(null);
  const [filter, setFilter] = useState('none');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const filters = [
    { name: 'None', value: 'none', css: '' },
    { name: 'Grayscale', value: 'grayscale', css: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia', css: 'sepia(100%)' },
    { name: 'Invert', value: 'invert', css: 'invert(100%)' },
    { name: 'Blur', value: 'blur', css: 'blur(3px)' },
    { name: 'Brightness', value: 'brightness', css: 'brightness(150%)' },
    { name: 'Contrast', value: 'contrast', css: 'contrast(200%)' },
    { name: 'Saturate', value: 'saturate', css: 'saturate(300%)' },
  ];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const applyFilter = async () => {
    if (!file || !videoRef.current) return;
    setStatus('Applying filter...');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      const selectedFilter = filters.find(f => f.value === filter);
      ctx.filter = selectedFilter.css || 'none';
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { setResult(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setStatus(''); };
      const drawFrame = () => {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        if (!videoRef.current.paused && !videoRef.current.ended) requestAnimationFrame(drawFrame);
      };
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      recorder.start();
      drawFrame();
      setTimeout(() => { recorder.stop(); videoRef.current.pause(); }, videoRef.current.duration * 1000);
    } catch(e) { setStatus('Error: ' + e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Filter</h1>
        <p className="text-neutral-400 text-center mb-8">Apply filters to video files</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" style={{filter: filters.find(f => f.value === filter)?.css || ''}} />}
          <div className="grid grid-cols-4 gap-2">
            {filters.map(f => <button key={f.value} onClick={() => setFilter(f.value)} className={"py-2 rounded-lg text-sm font-semibold transition " + (filter===f.value?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-700')}>{f.name}</button>)}
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          <button onClick={applyFilter} disabled={!file || filter === 'none' || !!status} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Apply Filter</button>
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="filtered.webm" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,
};

Object.entries(tools).forEach(([name, content]) => {
  const dir = path.join(basePath, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.jsx'), content, 'utf8');
  console.log('Created: ' + path.join(dir, 'page.jsx'));
});

console.log('All media tools created!');