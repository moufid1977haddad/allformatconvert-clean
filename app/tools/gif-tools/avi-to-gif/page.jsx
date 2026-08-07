'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function AviToGifPage() {
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setFrames([]);
    setResult(null);
    setVideoError(false);
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
    const video = videoRef.current;
    if (video.error || video.readyState === 0) {
      setVideoError(true);
      return;
    }
    setLoading(true);
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">AVI to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert AVI video to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-sm">
            ⚠️ Most web browsers, including Chrome, can't play AVI files at all — AVI is a legacy container with inconsistent codec support. This tool only works if <em>your specific browser</em> can decode your specific AVI file's codec, which many AVI files won't satisfy. If conversion fails, use a dedicated video converter to convert your file to MP4 first, then use <a href="/tools/gif-tools/mp4-to-gif" className="underline font-medium">MP4 to GIF</a> instead.
          </div>
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an AVI file here'}</p>
            <input ref={inputRef} type="file" accept="video/avi,video/x-msvideo" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls onError={() => setVideoError(true)} className="w-full rounded-xl bg-neutral-100" />}
          {videoError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              This AVI file couldn't be loaded — your browser doesn't support its video codec. Convert it to MP4 with a dedicated video converter first, then use <a href="/tools/gif-tools/mp4-to-gif" className="underline font-medium">MP4 to GIF</a> instead.
            </div>
          )}
          <button onClick={convert} disabled={!file || loading || videoError} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
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
        title="AVI to GIF"
        description="AVI to GIF extracts up to 10 evenly spaced frames from the first 5 seconds of your AVI video and encodes them into a real, downloadable animated GIF using the gifenc library, entirely in your browser — each frame is downscaled to a max of 480×270 and quantized to its own 256-color palette. Playback may fail for AVI files using codecs your browser can't decode natively — AVI has particularly inconsistent browser codec support."
        howTo={[
          "Click the upload area and select an AVI file from your device.",
          "If your browser can decode the file's codec, a preview appears in the video player.",
          "Click \"Convert to GIF\" to capture 10 evenly spaced frames from the first 5 seconds and encode them into a GIF.",
          "Review the extracted frame grid, then download the assembled animated GIF."
        ]}
        faqs={[
          { q: "Does this produce a downloadable GIF file?", a: "Yes — after conversion, a \"Download GIF\" button appears with the finished, real animated GIF assembled from the extracted frames." },
          { q: "Why won't my AVI file play or convert?", a: "AVI is a container format that can hold many different video codecs, and browsers only support a subset of them natively. If the video doesn't appear in the preview player, your browser can't decode that particular file." },
          { q: "Will the GIF preserve full video quality?", a: "No — only 10 frames from the first 5 seconds are captured (not the full frame rate or duration), each downscaled to 480×270 max, and the encoder doesn't dither, so photographic content may show some color banding." },
          { q: "Is AVI to GIF free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your video is never uploaded to a server." }
        ]}
        tips={[
          "If your AVI won't load, try converting it to MP4 first with a dedicated video converter — MP4 (H.264) has far more reliable browser support.",
          "Frames are limited to the first 5 seconds of the video — trim longer clips beforehand if you need frames from later on.",
          "The 10 frames are spread evenly across the captured duration, so the GIF's playback speed roughly matches the source video's pace within that window.",
          "For smoother motion or a longer captured clip, this tool isn't a substitute for a dedicated video-to-GIF converter with full frame-rate control."
        ]}
      />
    </div>
  );
}