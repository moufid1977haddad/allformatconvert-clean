'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function Mp4ToGifPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">MP4 to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert MP4 video to GIF frames</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an MP4 file here'}</p>
            <input ref={inputRef} type="file" accept="video/mp4" className="hidden" onChange={handleFile} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-100" />}
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
          {frames.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-600 text-center font-semibold">{frames.length} frames extracted</p>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((f, i) => <img key={i} src={f} className="w-full rounded border border-neutral-200" />)}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {frames.map((f, i) => <a key={i} href={f} download={"frame-" + i + ".png"} className="block text-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg py-1 text-sm transition text-neutral-600">Frame {i+1}</a>)}
              </div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="MP4 to GIF"
        description="MP4 to GIF extracts a series of still frames from your MP4 video, entirely in your browser — up to 10 frames from the first 5 seconds, each downscaled to a max of 480×270 and downloadable individually as a PNG. Note: it doesn't currently assemble the frames into a single animated GIF file. MP4 (H.264) is the most broadly browser-compatible video format, so playback and frame capture are generally reliable."
        howTo={[
          "Click the upload area and select an MP4 file from your device.",
          "Preview the video in the player that appears.",
          "Click \"Convert to GIF\" to capture 10 evenly spaced still frames from the first 5 seconds.",
          "Download each frame individually as a PNG using the buttons below the grid."
        ]}
        faqs={[
          { q: "Does this produce a single downloadable GIF file?", a: "Not currently — it extracts up to 10 still frames, each downloadable separately as a PNG; assembling them into an animated GIF requires a separate tool." },
          { q: "What's the frame limit?", a: "Up to 10 frames are captured from the first 5 seconds of the video, each capped at 480×270 resolution." },
          { q: "Is MP4 to GIF free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your video is never uploaded to a server." }
        ]}
        tips={[
          "Combine the downloaded frames using a dedicated GIF-assembly tool if you need a true animated GIF file.",
          "Trim your MP4 to the segment you care about beforehand, since only the first 5 seconds are captured.",
          "MP4 is widely supported, so this tool works reliably across most modern browsers.",
          "You can also right-click any frame in the preview grid to save it individually."
        ]}
      />
    </div>
  );
}