'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import { checkedDataURL, drawDecodedVideoFrame } from '../../../lib/mediaSupport';
import IosOriginalNote from '../../../components/IosOriginalNote';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function VideoScreenshotPage() {
  const [file, setFile] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [error, setError] = useToolError('');
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
      // P24 (03/10): WebP too (CloudConvert / ezgif offer it); Safari has no WebP encoder of its own: libwebp in WebAssembly
      const type = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      let blob = await new Promise((ok) => canvas.toBlob(ok, type, format === 'png' ? undefined : quality / 100));
      if (format === 'webp' && (!blob || blob.type !== 'image/webp')) {
        const { encodeWebpWasm } = await import('../../../lib/bigImage');
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        blob = await encodeWebpWasm(data, canvas.width, canvas.height, quality);
      }
      if (!blob || !blob.size || blob.type !== type) throw new Error('This browser could not save the frame as ' + format.toUpperCase() + '.');
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
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a video file" />}</p>
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
                    <option value="webp">WebP</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Go to (seconds)</label>
                  <input id="shot-time" type="number" min="0" step="0.04" placeholder="e.g. 12.5" onChange={e => { const v = Number(e.target.value); const vid = videoRef.current; if (vid && Number.isFinite(v) && v >= 0) { vid.pause(); vid.currentTime = Math.min(v, Number.isFinite(vid.duration) ? vid.duration : v); } }} className="w-28 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                {format !== 'png' && (
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-neutral-500 block mb-1">Quality: {quality}%</label>
                    <input aria-label="Quality (%)" type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" />
                  </div>
                )}
              </div>
              <button onClick={capture} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Capture Screenshot</button>
              {error && <p role="alert" className="text-red-500 text-center text-sm">{error}</p>}
            </div>
          )}
          {screenshots.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{screenshots.length} screenshot(s) captured</p>
              <DownloadGroup zipName={`${(file?.name || 'video').replace(/\.[^.]+$/, '')}-screenshots.zip`}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {screenshots.map((s, i) => (
                    <div key={i} className="space-y-1">
                      <img src={s.url} className="w-full rounded" alt={`Screenshot at ${s.time}s`} />
                      <FileDownload href={s.url} name={`${(file?.name || 'video').replace(/\.[^.]+$/, '')}-${s.time}s.${s.format || 'png'}`} note={`at ${s.time}s`} />
                    </div>
                  ))}
                </div>
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Screenshot"
        description="Video Screenshot saves the frame shown in the player as an image file. Pause or seek to the moment you want, or type the second you want, then capture as many stills as you like. Each image has the video's own width and height, whatever the size of the player on screen. PNG keeps every pixel; JPG and WebP make smaller files and have a quality setting. Everything happens in your browser with a canvas, so it works only with videos your browser can play; convert other files to MP4 first."
        howToTitle="How to take a screenshot from a video"
        howTo={[
          "Choose or drop a video file; it opens in a player.",
          "Pause on the moment you want, or type a time in \"Go to (seconds)\" to jump there.",
          "Pick PNG, JPG or WebP in \"Format\", and for JPG or WebP set \"Quality\".",
          "Click \"Capture Screenshot\"; repeat at other moments for more images.",
          "Click \"Download\" under an image, or \"Download all\" to get every capture in one ZIP file."
        ]}
        specs={[
          { label: 'Input', value: "Any video file your browser can play; the file picker lists MP4, MOV, WebM, MKV, AVI and other video types" },
          { label: 'Output', value: "PNG, JPG or WebP, at the video's own width and height" },
          { label: 'Quality', value: "From 10 % to the top of the slider for JPG and WebP, 90 % at first; PNG has no quality setting" },
          { label: 'Captures', value: "As many as you want, each named after the video and the moment it shows" }
        ]}
        privacy="The video plays in your browser's own player and each frame is drawn on a canvas in this tab: neither the video nor the images are uploaded. When Safari cannot write WebP itself, the page encodes it with a WebAssembly copy of libwebp, still on your device. If an error message appears, its cleaned text, the error type, the tool name and your browser's name and version are reported to us; never the video or the images."
        faqs={[
          { q: "What resolution is the screenshot?", a: "The video's own resolution: the image has the same width and height as the video file, whatever the size of the player on your screen. A 4K video gives a 4K image, a vertical phone video a vertical image." },
          { q: "PNG, JPG or WebP: which should I choose?", a: "PNG for an exact copy of the frame, as a larger file; JPG or WebP for a smaller file to share. Both use the \"Quality\" slider, which starts at 90 %; lower values give smaller, softer images." },
          { q: "Why can the page not capture my video?", a: "Your browser cannot play its format, and the capture uses the browser's own player. This happens with AVI and some MKV files in particular. Convert the video to MP4 with Video Converter, then capture again." },
          { q: "Can I save all screenshots at once?", a: "Yes. As soon as there are two or more captures, \"Download all\" saves them in one ZIP file named after the video, next to a \"Download\" button for each image." }
        ]}
        tips={[
          "Type the second you want in \"Go to (seconds)\", then step 0.04 seconds at a time from there with the field's spin buttons."
        ]}
      />
    </div>
  );
}