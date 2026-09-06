'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';

const MAX_DURATION = 120;

const POSITIONS = {
  'top-left': '20:20',
  'top-right': 'W-w-20:20',
  'bottom-left': '20:H-h-20',
  'bottom-right': 'W-w-20:H-h-20',
  'center': '(W-w)/2:(H-h)/2',
};

const loadImageElement = (imgFile) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Could not load the watermark image.'));
  img.src = URL.createObjectURL(imgFile);
});

export default function VideoWatermarkPage() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [durationKnown, setDurationKnown] = useState(false);
  const [durationError, setDurationError] = useState('');
  const [watermarkType, setWatermarkType] = useState('text');
  const [text, setText] = useState('Watermark');
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [opacity, setOpacity] = useState(0.7);
  const [position, setPosition] = useState('bottom-right');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef();
  const inputRef = useRef();
  const watermarkInputRef = useRef();
  const ffmpegRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setDuration(0);
    setDurationKnown(false);
    setDurationError('');
    setResult(null);
    setError('');
  };

  const handleWatermarkImage = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setWatermarkImage(f);
  };

  useEffect(() => {
    // videoRef.current is only guaranteed to exist after this render commits
    // (the <video> element only mounts once `file` is set), so the src must
    // be assigned here rather than inline in handleFile.
    if (!file || !videoRef.current) return;

    const video = videoRef.current;
    video.src = URL.createObjectURL(file);

    const finalize = (d) => {
      setDuration(d);
      setDurationKnown(true);
      if (d > MAX_DURATION) {
        setDurationError(`This video is ${Math.round(d)}s -- over the 2-minute limit. Watermarking runs in your browser and takes roughly one second per second of video, so longer files would take too long or risk freezing the tab. Trim it first, or use a shorter clip.`);
      } else {
        setDurationError('');
      }
    };

    // Some MediaRecorder-produced WebM files have no duration in their cues,
    // so `.duration` resolves to Infinity/NaN even after loadedmetadata --
    // seeking far forward forces the browser to compute the real value
    // (a well-known workaround for this exact browser behavior). Convert
    // never runs without a confirmed finite duration: the button stays
    // disabled (see convertDisabled) until finalize() is reached, and a file
    // whose duration can never be determined times out to a hard refusal
    // rather than silently allowing an unbounded-length upload through.
    const giveUpTimer = setTimeout(() => {
      if (!Number.isFinite(video.duration)) {
        setDurationKnown(false);
        setDurationError("Couldn't determine this video's length, so it can't be safely watermarked here. Try re-exporting it or use a different file.");
      }
    }, 8000);

    video.onloadedmetadata = () => {
      const d = video.duration;
      if (Number.isFinite(d)) {
        clearTimeout(giveUpTimer);
        finalize(d);
      } else {
        video.currentTime = Number.MAX_SAFE_INTEGER;
        video.ondurationchange = () => {
          const d2 = video.duration;
          if (Number.isFinite(d2)) {
            clearTimeout(giveUpTimer);
            video.currentTime = 0;
            video.ondurationchange = null;
            finalize(d2);
          }
        };
      }
    };

    return () => clearTimeout(giveUpTimer);
  }, [file]);

  const cancel = () => {
    if (ffmpegRef.current) {
      ffmpegRef.current.terminate();
      ffmpegRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setEta(null);
  };

  const convert = async () => {
    // Duration cap is enforced before any ffmpeg load or file write -- a file
    // over the limit never reaches ffmpeg at all. Requiring durationKnown
    // (not just checking `duration > MAX_DURATION`) closes two real gaps:
    // duration starts at 0 and is set asynchronously, so a click in that
    // window would otherwise pass `0 > 120 === false`; and some WebM files
    // never resolve a finite `.duration` at all, which would otherwise leave
    // the cap permanently unable to engage (`NaN > 120 === false` too).
    if (!file || !durationKnown || duration > MAX_DURATION) return;
    if (watermarkType === 'text' && !text.trim()) return;
    if (watermarkType === 'image' && !watermarkImage) return;

    setLoading(true);
    setProgress(0);
    setEta(null);
    setError('');
    setResult(null);
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      ffmpeg.on('progress', ({ progress: p }) => {
        const clamped = Math.min(1, Math.max(0, p));
        setProgress(Math.round(clamped * 100));
        setEta(Math.max(0, Math.round((1 - clamped) * duration)));
      });
      await ffmpeg.load();

      // Both watermark types render to an offscreen canvas -> PNG first, so
      // ffmpeg only ever has to overlay a single image file -- this avoids
      // ffmpeg's drawtext filter, which needs a bundled font file in the
      // wasm FS and is an unnecessary extra failure surface.
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (watermarkType === 'text') {
        const fontSize = 48;
        ctx.font = `bold ${fontSize}px sans-serif`;
        const padX = 16;
        const textWidth = Math.ceil(ctx.measureText(text).width);
        canvas.width = textWidth + padX * 2;
        canvas.height = Math.ceil(fontSize * 1.4);
        // Resizing the canvas resets its 2D context state, so font must be
        // reapplied after setting width/height.
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillText(text, padX, canvas.height / 2);
      } else {
        const img = await loadImageElement(watermarkImage);
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, 0, 0);
      }
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

      const inputName = 'input.' + (file.name.split('.').pop() || 'mp4');
      const outputName = 'output.mp4';
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.writeFile('watermark.png', pngBytes);

      await ffmpeg.exec([
        '-i', inputName,
        '-i', 'watermark.png',
        '-filter_complex', `[0:v][1:v]overlay=${POSITIONS[position]}[v]`,
        '-map', '[v]', '-map', '0:a',
        '-c:v', 'libx264', '-preset', 'veryfast',
        '-c:a', 'aac',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setResult({ url, name: file.name.replace(/\.[^.]+$/, '') + '-watermarked.mp4' });
      setProgress(100);
    } catch (e) {
      if (ffmpegRef.current) setError('Watermarking failed: ' + e.message);
    } finally {
      // Terminate on every path, not just cancel() -- otherwise each
      // successful conversion leaks a Worker + wasm instance, and
      // watermarking several clips in one session accumulates memory
      // pressure instead of releasing it (ffmpegRef.current is already null
      // here if cancel() ran first, so this never double-terminates).
      if (ffmpegRef.current) ffmpegRef.current.terminate();
      ffmpegRef.current = null;
      setLoading(false);
    }
  };

  const overLimit = duration > MAX_DURATION;
  const convertDisabled = !file || !durationKnown || overLimit || loading
    || (watermarkType === 'text' ? !text.trim() : !watermarkImage);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Watermark</h1>
        <p className="text-neutral-500 text-center mb-2">Burn a text or image watermark into your video and export a real watermarked video file</p>
        <p className="text-neutral-500 text-sm text-center mb-8">Works on videos up to <strong>2 minutes</strong> long. Watermarking runs entirely in your browser and takes roughly as long as the video itself (about 1 second of processing per second of video).</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className={"border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center transition " + (loading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-indigo-500')} onClick={() => !loading && inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={loading} />
          </div>
          {file && <video ref={videoRef} controls className="w-full rounded-xl bg-neutral-800" />}
          {file && !durationKnown && !durationError && <p className="text-neutral-400 text-center text-sm">Checking video length...</p>}
          {durationError && <p className="text-red-500 text-center text-sm">{durationError}</p>}

          <div>
            <label className="block text-sm text-neutral-500 mb-2">Watermark Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['text', 'image'].map((t) => (
                <button
                  key={t}
                  onClick={() => setWatermarkType(t)}
                  className={"py-2 rounded-lg text-sm font-semibold capitalize transition " + (watermarkType === t ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {watermarkType === 'text' ? (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Watermark Text</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Watermark Image</label>
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => watermarkInputRef.current.click()}>
                <p className="text-neutral-500 text-sm">{watermarkImage ? watermarkImage.name : 'Click to upload a logo or image'}</p>
                <input ref={watermarkInputRef} type="file" accept="image/*" className="hidden" onChange={handleWatermarkImage} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-500 mb-1">Opacity: {Math.round(opacity * 100)}%</label>
            <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm text-neutral-500 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((p) => (
                <button key={p} onClick={() => setPosition(p)} className={"py-2 rounded-lg text-sm font-semibold transition " + (position === p ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}>{p}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={eta !== null ? `Encoding... (about ${eta}s remaining)` : 'Encoding...'} />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={convertDisabled} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              Add Watermark
            </button>
          )}

          {error && <p className="text-red-400 text-center text-sm">{error}</p>}

          {result && (
            <div className="space-y-2">
              <video controls src={result.url} className="w-full rounded-xl" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download {result.name}</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Video Watermark"
        description="Video Watermark burns a text or image watermark into your video and exports a real watermarked .mp4 file, entirely in your browser using ffmpeg.wasm -- your file is never uploaded to a server. Choose a text watermark (typed, with adjustable opacity) or an image/logo watermark, pick one of five corner/center positions, and export. Videos are limited to 2 minutes: browser-side encoding runs at roughly real-time speed, so a 90-second clip takes about 90 seconds, and longer files would risk an unresponsive tab."
        howTo={[
          "Click the upload area and select a video file (2 minutes or shorter).",
          "Choose Text or Image as your watermark type, and enter your text or upload a logo/image.",
          "Adjust the opacity slider and pick a position from the 5 corner/center presets.",
          "Click \"Add Watermark\" and watch the progress bar and time estimate while it encodes.",
          "Preview and download the resulting watermarked .mp4 file."
        ]}
        faqs={[
          { q: "Does this produce a full watermarked video now?", a: "Yes -- it exports a real .mp4 file with the watermark burned into every frame and the original audio preserved, not a single still image." },
          { q: "Can I use an image or logo as the watermark?", a: "Yes. Switch the Watermark Type toggle to Image and upload a PNG or JPG; it's composited at its natural size with the opacity you choose." },
          { q: "Why is there a 2-minute limit?", a: "Watermarking runs entirely in your browser via ffmpeg.wasm, which encodes at roughly real-time speed (about 1 second of processing per second of video). Longer clips would take too long or risk freezing the tab." },
          { q: "Is audio preserved?", a: "Yes, the original audio track is kept and re-encoded to AAC alongside the watermarked video." },
          { q: "Is my file uploaded anywhere?", a: "No, everything happens locally in your browser via ffmpeg.wasm -- there's no server involved." }
        ]}
        tips={[
          "If your clip is longer than 2 minutes, trim it first with a video trimmer, then watermark the shorter result.",
          "Choose a position over a less busy part of the frame so your watermark stays readable without overwhelming the video.",
          "Lower opacity (30-50%) reads as a subtler watermark; higher opacity is more visible but more intrusive.",
          "The first run after loading the page also downloads the ffmpeg.wasm engine (roughly 25-30MB), so it takes a little longer than later runs."
        ]}
      />
    </div>
  );
}
