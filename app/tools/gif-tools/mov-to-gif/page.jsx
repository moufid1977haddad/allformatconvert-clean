'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function MovToGifPage() {
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFrames([]);
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(f);
  };

  const convert = async () => {
    if (!videoRef.current || !file) return;
    setLoading(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 480);
    canvas.height = Math.min(video.videoHeight, 270);
    const ctx = canvas.getContext('2d');
    const capturedFrames = [];
    const totalFrames = 10;
    const dur = Math.min(video.duration, 5);
    for (let i = 0; i < totalFrames; i++) {
      video.currentTime = (i / totalFrames) * dur;
      await new Promise(r => { video.onseeked = r; });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      capturedFrames.push(canvas.toDataURL('image/png'));
    }
    setFrames(capturedFrames);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">MOV to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert MOV video to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a MOV file here'}</p>
            <input ref={inputRef} type="file" accept="video/quicktime,video/mov" className="hidden" onChange={handleFile} />
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
        </div>
      </div>
      <SeoContent
        title="MOV to GIF"
        description="MOV to GIF extracts a series of still frames from your QuickTime MOV video, entirely in your browser — up to 10 frames from the first 5 seconds, each downscaled to a max of 480×270. Note: it doesn't currently assemble the frames into a single animated GIF file, and playback depends on your browser supporting the file's specific codec — H.264-encoded MOV usually works, while ProRes and some other codecs often don't play in browsers."
        howTo={[
          "Click the upload area and select a MOV file from your device.",
          "If your browser can decode the file's codec, a preview appears in the video player.",
          "Click \"Convert to GIF\" to capture 10 evenly spaced still frames from the first 5 seconds.",
          "Review the extracted frames in the grid below the player."
        ]}
        faqs={[
          { q: "Does this produce a downloadable GIF file?", a: "Not currently — it extracts up to 10 still frames as a preview grid; there's no built-in download button or GIF assembly on this page." },
          { q: "Why won't my MOV file play or convert?", a: "MOV is a container that can hold different video codecs. H.264-encoded MOV files usually play fine in browsers, but codecs like ProRes typically don't." },
          { q: "Is MOV to GIF free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your video is never uploaded to a server." }
        ]}
        tips={[
          "If your MOV won't load, try converting it to MP4 (H.264) first with a dedicated video converter for more reliable browser support.",
          "Frames are limited to the first 5 seconds of the video — trim longer clips beforehand if you need frames from later on.",
          "Right-click any frame in the grid to save it as an individual image.",
          "For a real animated GIF output, use a dedicated GIF-encoding tool with the extracted frames."
        ]}
      />
    </div>
  );
}