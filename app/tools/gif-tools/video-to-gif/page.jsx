'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function VideoToGifPage() {
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fps, setFps] = useState(5);
  const [duration, setDuration] = useState(3);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setFrames([]);
    setResult(null);
  };

  useEffect(() => {
    // videoRef.current is only guaranteed to exist after this render commits
    // (the <video> element only mounts once `file` is set), so the src must
    // be assigned here rather than inline in handleFile — otherwise the very
    // first file selection silently fails to load since the ref is still null.
    if (file && videoRef.current) videoRef.current.src = URL.createObjectURL(file);
  }, [file]);

  const capture = async () => {
    if (!videoRef.current || !file) return;
    setLoading(true);
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      const capturedFrames = [];
      const totalFrames = fps * duration;
      const interval = duration / totalFrames;
      const delay = Math.round(interval * 1000);
      const gif = GIFEncoder();
      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = i * interval;
        await new Promise(r => { video.onseeked = r; });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedFrames.push(canvas.toDataURL('image/png'));
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, canvas.width, canvas.height, { palette, delay });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setFrames(capturedFrames);
      setResult(URL.createObjectURL(blob));
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Video to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert video files to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-100" />}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">FPS: {fps}</label><input type="range" min="1" max="15" value={fps} onChange={e => setFps(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Duration: {duration}s</label><input type="range" min="1" max="10" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <button onClick={capture} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Capturing frames...' : 'Convert to GIF Frames'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-600 text-center font-semibold">{frames.length} frames captured</p>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((f, i) => <img key={i} src={f} className="w-full rounded border border-neutral-200" />)}
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-w-full mx-auto rounded-xl border border-neutral-200" />
              <a href={result} download="converted.gif" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download GIF</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video to GIF"
        description="Video to GIF captures a series of frames from any video file at your chosen frame rate (1–15 FPS) and duration (1–10 seconds), then encodes them into a real, downloadable animated GIF using the gifenc library, entirely in your browser — each frame is quantized to its own 256-color palette at the video's native resolution. Note: playback depends on your browser supporting the uploaded video's codec."
        howTo={[
          "Click the upload area and select a video file from your device.",
          "Preview the video, then set your desired FPS and capture duration using the sliders.",
          "Click \"Convert to GIF Frames\" to capture evenly spaced frames and encode them into a GIF.",
          "Review the extracted frame grid, then download the assembled animated GIF."
        ]}
        faqs={[
          { q: "Does this produce a single animated GIF file?", a: "Yes — after capture, a \"Download GIF\" button appears with the finished, real animated GIF assembled from the captured frames." },
          { q: "What video formats are supported?", a: "Any format your browser can decode and play natively. Common formats like MP4 (H.264) work most reliably; less common codecs may fail to load." },
          { q: "How many frames can I capture?", a: "Up to 15 FPS for up to 10 seconds, so as many as 150 frames in a single capture — more frames means a larger file and longer processing time." },
          { q: "Will the GIF preserve full video quality?", a: "Frames are captured at native resolution, but the encoder doesn't dither, so photographic content or smooth gradients may show some color banding after being reduced to a 256-color palette." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your video is never uploaded to a server." }
        ]}
        tips={[
          "Higher FPS and longer duration settings capture more frames but take longer to process and produce a larger GIF file.",
          "If your video doesn't preview or convert, try converting it to MP4 first for the most reliable browser support.",
          "A lower FPS (5–8) usually looks just as smooth for typical GIF use and keeps the file size down.",
          "Frames are captured at the video's native resolution — downscale your source video beforehand if you need a smaller GIF."
        ]}
      />
    </div>
  );
}