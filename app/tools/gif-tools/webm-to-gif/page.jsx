'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function WebmToGifPage() {
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const convert = async () => {
    if (!videoRef.current || !file) return;
    setLoading(true);
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 480);
      canvas.height = Math.min(video.videoHeight, 270);
      const ctx = canvas.getContext('2d');
      const capturedFrames = [];
      const totalFrames = 10;
      const dur = Math.min(video.duration, 5);
      const delay = Math.round((dur * 1000) / totalFrames);
      const gif = GIFEncoder();
      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = (i / totalFrames) * dur;
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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">WEBM to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert WEBM video to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a WEBM file here'}</p>
            <input ref={inputRef} type="file" accept="video/webm" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-100" />}
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-600 text-center font-semibold">{frames.length} frames extracted</p>
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
        title="WEBM to GIF"
        description="WEBM to GIF extracts up to 10 evenly spaced frames from the first 5 seconds of your WebM video and encodes them into a real, downloadable animated GIF using the gifenc library, entirely in your browser — each frame is downscaled to a max of 480×270 and quantized to its own 256-color palette. WebM plays reliably in Chrome and Firefox, but Safari's WebM support is more limited."
        howTo={[
          "Click the upload area and select a WebM file from your device.",
          "If your browser can decode the file, a preview appears in the video player.",
          "Click \"Convert to GIF\" to capture 10 evenly spaced frames from the first 5 seconds and encode them into a GIF.",
          "Review the extracted frame grid, then download the assembled animated GIF."
        ]}
        faqs={[
          { q: "Does this produce a downloadable GIF file?", a: "Yes — after conversion, a \"Download GIF\" button appears with the finished, real animated GIF assembled from the extracted frames." },
          { q: "Will my WebM file work in every browser?", a: "WebM plays reliably in Chrome and Firefox. Safari's WebM support is more limited, so playback may fail there depending on the file's codec." },
          { q: "Will the GIF preserve full video quality?", a: "No — only 10 frames from the first 5 seconds are captured (not the full frame rate or duration), each downscaled to 480×270 max, and the encoder doesn't dither, so photographic content may show some color banding." },
          { q: "Is WEBM to GIF free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your video is never uploaded to a server." }
        ]}
        tips={[
          "If your WebM won't load, try converting it to MP4 first with a dedicated video converter for the widest browser support.",
          "Frames are limited to the first 5 seconds of the video — trim longer clips beforehand if you need frames from later on.",
          "The 10 frames are spread evenly across the captured duration, so the GIF's playback speed roughly matches the source video's pace within that window.",
          "For smoother motion or a longer captured clip, this tool isn't a substitute for a dedicated video-to-GIF converter with full frame-rate control."
        ]}
      />
    </div>
  );
}