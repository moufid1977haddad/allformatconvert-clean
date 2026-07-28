'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
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
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Screenshot</h1>
        <p className="text-neutral-500 text-center mb-8">Capture screenshots from video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
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
                      <span className="text-xs text-neutral-500">At {s.time}s</span>
                      <a href={s.url} download={"screenshot-" + s.time + ".png"} className="text-xs text-indigo-400 hover:text-indigo-300">Download</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Screenshot"
        description="Video Screenshot captures the current frame of a video as a PNG image, entirely in your browser — pause or seek to the moment you want, then capture as many stills as you need."
        howTo={[
          "Click the upload area and select a video file.",
          "Use the player controls to pause on the exact frame you want.",
          "Click \"Capture Screenshot\" to save that frame — repeat for as many frames as you like.",
          "Click \"Download\" under any captured image to save it as a PNG."
        ]}
        faqs={[
          { q: "What image format do screenshots download as?", a: "PNG only." },
          { q: "Can I capture multiple frames?", a: "Yes, click \"Capture Screenshot\" as many times as you like at different points in the video." },
          { q: "Is Video Screenshot free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "No, capturing happens entirely in your browser using canvas — your video is never uploaded to a server." }
        ]}
        tips={[
          "Pause the video before capturing to avoid motion blur from a frame mid-transition.",
          "Use the timeline scrubber for precise frame selection rather than relying on play/pause timing.",
          "Capture several nearby frames if you need to pick the sharpest one afterward.",
          "PNG is lossless, so captured screenshots retain full quality for further editing."
        ]}
      />
    </div>
  );
}