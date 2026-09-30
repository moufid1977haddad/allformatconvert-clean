'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { checkedDataURL, drawDecodedVideoFrame } from '../../../lib/mediaSupport';
import IosOriginalNote from '../../../components/IosOriginalNote';
export default function VideoScreenshotPage() {
  const [file, setFile] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [error, setError] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setScreenshots([]);
  };

  useEffect(() => {
    // videoRef.current is only guaranteed to exist after this render commits
    // (the <video> element only mounts once `file` is set), so the src must
    // be assigned here rather than inline in handleFile — otherwise the very
    // first file selection silently fails to load since the ref is still null.
    if (file && videoRef.current) videoRef.current.src = URL.createObjectURL(file);
  }, [file]);

  const capture = async () => {
    if (!videoRef.current) return;
    setError('');
    // The frame is drawn only once it is really decoded (a video not played yet
    // gave an all-white JPG under Chromium, 28/09) -- drawDecodedVideoFrame
    // waits, forces the decode, and refuses an empty picture.
    let url;
    try {
      const frame = await drawDecodedVideoFrame(videoRef.current);
      let canvas = frame;
      if (format === 'jpg') {
        // JPG has no alpha channel: white under transparent letterboxing (rare,
        // some codecs), painted UNDER the frame that was already checked.
        canvas = document.createElement('canvas');
        canvas.width = frame.width;
        canvas.height = frame.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, 0, 0);
      }
      // 30/09: a Blob, not a data: URL (iOS saves nothing from a data: link); checked like the data URL was.
      const blob = await new Promise((ok) => canvas.toBlob(ok, format === 'jpg' ? 'image/jpeg' : 'image/png', format === 'jpg' ? quality / 100 : undefined));
      if (!blob || !blob.size || blob.type !== (format === 'jpg' ? 'image/jpeg' : 'image/png')) throw new Error('This browser could not save the frame as ' + format.toUpperCase() + '.');
      url = URL.createObjectURL(blob);
    } catch (e) { setError(e.message); return; }
    const time = videoRef.current.currentTime.toFixed(2);
    setScreenshots(prev => [...prev, { url, time, format }]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Screenshot</h1>
        <p className="text-neutral-500 text-center mb-8">Capture screenshots from video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFile} />
          </div>
          {file && (
            <div className="space-y-3">
              <video ref={videoRef} controls playsInline preload="auto" onError={() => setError("This browser cannot play this video's format, so no frame can be captured here. Convert it to MP4 first with the Video Converter, then capture.")} className="w-full rounded-xl bg-neutral-800" />
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Format</label>
                  <select aria-label="Format" value={format} onChange={e => setFormat(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                  </select>
                </div>
                {format === 'jpg' && (
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-neutral-500 block mb-1">Quality: {quality}%</label>
                    <input aria-label="Quality (%)" type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" />
                  </div>
                )}
              </div>
              <button onClick={capture} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Capture Screenshot</button>
              {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
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
                      <a href={s.url} download={`${(file?.name || 'video').replace(/\.[^.]+$/, '')}-${s.time}s.${s.format || 'png'}`} className="text-xs text-indigo-400 hover:text-indigo-300">Download</a>
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
        description="Video Screenshot captures the current frame of a video as a PNG or JPG image, entirely in your browser — pause or seek to the moment you want, choose your format and (for JPG) quality, then capture as many stills as you need."
        howTo={[
          "Click the upload area and select a video file.",
          "Use the player controls to pause on the exact frame you want.",
          "Choose PNG (lossless) or JPG (with an adjustable quality level).",
          "Click \"Capture Screenshot\" to save that frame — repeat for as many frames as you like.",
          "Click \"Download\" under any captured image to save it."
        ]}
        faqs={[
          { q: "What image formats do screenshots download as?", a: "PNG (lossless) or JPG (with an adjustable quality slider) — pick whichever you need before capturing." },
          { q: "Can I capture multiple frames?", a: "Yes, click \"Capture Screenshot\" as many times as you like at different points in the video, even mixing PNG and JPG captures." },
          { q: "Is Video Screenshot free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "No, capturing happens entirely in your browser using canvas — your video is never uploaded to a server." }
        ]}
        tips={[
          "Pause the video before capturing to avoid motion blur from a frame mid-transition.",
          "Use the timeline scrubber for precise frame selection rather than relying on play/pause timing.",
          "Capture several nearby frames if you need to pick the sharpest one afterward.",
          "Use PNG for lossless quality (best for further editing) or JPG for a smaller file size when sharing stills."
        ]}
      />
    </div>
  );
}