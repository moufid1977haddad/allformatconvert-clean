'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { reportToolError } from '../../../lib/reportError';

const MAX_DURATION = 120;

// Watermark sizing is relative to the VIDEO, never the watermark's own
// source resolution -- a portrait logo dropped onto a landscape video (or
// vice versa) must come out the same proportional size either way. 15% of
// video width matches the upper end of the commonly-cited 8-15% range for a
// persistent brand watermark (Mux's own docs use 25% in their worked
// example; 15% is a sane middle ground short of that). Margins are a
// percentage of frame size too (3% of the shorter dimension), not a fixed
// pixel count, so they scale correctly from a 240p clip to 4K instead of
// looking cavernous or nonexistent at the extremes.
const WATERMARK_WIDTH_RATIO = 0.15;
const WATERMARK_MARGIN_RATIO = 0.03;

// Pixel offsets for the 5 position presets, computed directly in JS now
// that the exact watermark size is known ahead of time -- no more ffmpeg
// runtime expressions like `W-w-20`, which knew nothing about the real
// watermark dimensions and is exactly how the cut-off-at-the-edge bug
// happened.
const computeOverlayXY = (position, videoWidth, videoHeight, wmWidth, wmHeight, margin) => {
  switch (position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: videoWidth - wmWidth - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: videoHeight - wmHeight - margin };
    case 'bottom-right':
      return { x: videoWidth - wmWidth - margin, y: videoHeight - wmHeight - margin };
    case 'center':
    default:
      return { x: Math.round((videoWidth - wmWidth) / 2), y: Math.round((videoHeight - wmHeight) / 2) };
  }
};

// Every codec below was proven to actually decode with the loaded
// ffmpeg.wasm core (zero-arg load, the exact core every tool on this site
// uses) -- NOT just "listed present", which is exactly the trap AV1 turned
// out to be (av1 is also listed, with a decoder flag, and still fails on
// real content). Each one was fed a real, independently-downloaded public
// sample file through this exact overlay pipeline and produced non-empty
// output:
//   h264   -- Big Buck Bunny 360p/H.264, test-videos.co.uk
//   hevc   -- Big Buck Bunny 360p/H.265, test-videos.co.uk
//   vp8    -- Big Buck Bunny 360p/VP8 (webm), test-videos.co.uk
//   vp9    -- Big Buck Bunny 360p/VP9 (webm), test-videos.co.uk
//   theora -- chroma_siting_test.ogv, media.xiph.org (Theora's own project)
//   prores -- apple-prores-422.mov, openpreserve/format-corpus (Open
//             Preservation Foundation's public format-testing corpus)
// AV1 is deliberately excluded: present in the decoder table (with a
// decoder flag, just not the frame/slice-threading flags the six above
// have) but reproduced failing on real content ("Missing Sequence
// Header"). Codecs never tested at all (mjpeg, mpeg4, wmv, ...) are
// deliberately not guessed into this list -- untested is treated the same
// as AV1: rejected up front, not assumed safe.
const SUPPORTED_VIDEO_CODECS = ['h264', 'hevc', 'vp8', 'vp9', 'theora', 'prores'];

// Matches ffmpeg's input-probe stream-info line for a video stream, e.g.
// both "Stream #0:0(und): Video: h264 (avc1 / 0x31637661), yuv420p, ..."
// and "Stream #0:0: Video: av1, yuv420p, ...". This line is logged during
// input demuxing/probing, which happens before any frame is actually
// decoded -- which is exactly why the real AV1 failure log this session
// still correctly identified the stream as `av1` even though decoding it
// then failed. That ordering is what lets this run as a fast pre-flight
// check instead of waiting for a real decode attempt to blow up.
const CODEC_PROBE_RE = /Stream #\d+:\d+(?:\[[^\]]*\])?\(?[^:]*\)?:\s*Video:\s*(\w+)/i;

// Recognizable ffmpeg-log signatures for the specific real failure mode
// confirmed this session (an undecodable stream, e.g. AV1's "Missing
// Sequence Header"). The codec pre-flight check above should catch this
// before it ever gets this far -- this is just a fallback net in case the
// probe misses something the actual encode run still hits.
const describeFfmpegFailure = (logText) => {
  if (/Missing Sequence Header|Invalid data found when processing input|Cannot determine format/i.test(logText)) {
    return "ffmpeg couldn't decode this video's stream correctly (a codec-level failure, not related to duration or file size).";
  }
  return 'This video could not be processed. Try a different file, or re-encode it to standard MP4 (H.264) first.';
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
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
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
    setVideoWidth(0);
    setVideoHeight(0);
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
      // Captured at the same point duration is finalized -- videoWidth/
      // videoHeight are the video's real decoded pixel dimensions (not the
      // <video> element's CSS/layout size), which is what the watermark
      // must be scaled relative to.
      setVideoWidth(video.videoWidth);
      setVideoHeight(video.videoHeight);
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

    // Distinguishes "this browser can't decode this file at all" (a real
    // MediaError, e.g. most .avi files -- codes 3/4 mean the format/codec
    // itself is unsupported) from the timeout case above, which is for
    // files the browser DOES accept but never resolves a finite duration
    // for. Reporting both as "couldn't determine length" wrongly implies
    // the file itself might be broken when it's actually a browser
    // container/codec support gap.
    video.onerror = () => {
      clearTimeout(giveUpTimer);
      setDurationKnown(false);
      const code = video.error && video.error.code;
      if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || code === MediaError.MEDIA_ERR_DECODE) {
        setDurationError("Your browser can't play this video format/codec, so it can't be watermarked here -- this isn't necessarily a broken file. Chrome reliably plays MP4 (H.264) and WebM (VP8/VP9); .avi, many .mov and .mkv files, and less common codecs often aren't decodable in-browser at all. Try converting it to MP4 first.");
      } else {
        setDurationError("This video failed to load, so its length can't be confirmed. Try a different file.");
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
    // videoWidth/videoHeight are captured in the same finalize() call that
    // sets durationKnown, so this should never actually trip for a normal
    // video file -- it only guards a genuinely dimension-less input (e.g.
    // an audio-only file that still passed video/* file-picker filtering).
    if (!videoWidth || !videoHeight) {
      setError("Couldn't read this video's dimensions, so the watermark can't be sized correctly. Try a different file.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setEta(null);
    setError('');
    setResult(null);
    // Accumulated across this run so any failure can be translated into a
    // plain sentence instead of a raw ffmpeg log line -- reset on every
    // convert() call since this is a local variable in this closure.
    const logLines = [];
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      // ffmpeg.wasm's own stderr/stdout -- this is where the REAL reason for
      // a failure lives (e.g. "Unknown encoder 'libx264'"). Without this,
      // a failed exec() surfaces only as a generic rejection with no useful
      // message, and the actual cause is silently discarded.
      ffmpeg.on('log', ({ message }) => {
        logLines.push(message);
        console.log('[ffmpeg]', message);
      });
      ffmpeg.on('progress', ({ progress: p }) => {
        const clamped = Math.min(1, Math.max(0, p));
        setProgress(Math.round(clamped * 100));
        setEta(Math.max(0, Math.round((1 - clamped) * duration)));
      });
      await ffmpeg.load();

      const inputName = 'input.' + (file.name.split('.').pop() || 'mp4');
      const outputName = 'output.mp4';
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Pre-flight codec probe -- BEFORE any real encode work or progress
      // reporting. ffmpeg determines a stream's codec while demuxing/
      // probing the input, which happens before it ever attempts to decode
      // a frame -- calling exec(['-i', inputName]) with no output at all
      // makes ffmpeg log that stream-info line and then throw its own
      // "at least one output file must be specified" error, which is
      // expected and ignored here. This is what catches a codec like AV1
      // (confirmed this session to fail partway through a real ~55s encode
      // with "Missing Sequence Header") before the user waits through any
      // of that budget.
      let probedCodec = null;
      const probeListener = ({ message }) => {
        const match = message.match(CODEC_PROBE_RE);
        if (match && !probedCodec) probedCodec = match[1].toLowerCase();
      };
      ffmpeg.on('log', probeListener);
      try {
        await ffmpeg.exec(['-i', inputName]);
      } catch {
        // Expected -- ffmpeg always "fails" here because no output file was
        // given. Only the logged stream-info line (captured above) matters.
      }
      ffmpeg.off('log', probeListener);

      if (!probedCodec) {
        throw new Error("Couldn't detect this video's codec, so it can't be safely processed here. Try a different file, or re-encode it to standard MP4 (H.264) first.");
      }
      if (!SUPPORTED_VIDEO_CODECS.includes(probedCodec)) {
        if (probedCodec === 'av1') {
          throw new Error("This video is encoded in AV1, which this tool's video engine can't decode reliably (confirmed: it fails partway through, wasting your wait). Re-encode it to H.264 (MP4) first, then try again.");
        }
        throw new Error(`This video uses the "${probedCodec}" codec, which this tool's video engine can't reliably decode. Re-encode it to H.264 (MP4) first, then try again.`);
      }

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
      await ffmpeg.writeFile('watermark.png', pngBytes);

      // Watermark size/position computed in JS as real pixel numbers,
      // relative to the VIDEO's own dimensions -- never the watermark
      // canvas's own source size. This applies identically whether the
      // canvas came from the text path or the image path, since both
      // funnel into this same overlay pipeline.
      const wmWidth = Math.round(videoWidth * WATERMARK_WIDTH_RATIO);
      const wmHeight = Math.round(wmWidth * (canvas.height / canvas.width));
      const margin = Math.round(Math.min(videoWidth, videoHeight) * WATERMARK_MARGIN_RATIO);
      const { x, y } = computeOverlayXY(position, videoWidth, videoHeight, wmWidth, wmHeight, margin);

      await ffmpeg.exec([
        '-i', inputName,
        '-i', 'watermark.png',
        // Scale the watermark input to the exact pixel size computed above
        // BEFORE overlaying, then overlay at a literal pixel offset --
        // no more runtime expressions like `W-w-20`, which knew nothing
        // about the watermark's real size and is exactly how it rendered
        // at native resolution and got cut off at the frame edge.
        '-filter_complex', `[1:v]scale=${wmWidth}:${wmHeight}[wm];[0:v][wm]overlay=${x}:${y}[v]`,
        // '0:a?' (not '0:a') -- a source with no audio track is a real,
        // common case (screen recordings, muted exports), and an
        // unconditional '0:a' throws "Stream map '0:a' matches no streams"
        // inside ffmpeg itself. '-c:a aac' is left unconditional too:
        // verified directly (not assumed) that ffmpeg simply skips audio
        // encoding when '0:a?' matches nothing, producing a valid
        // video-only output rather than erroring.
        '-map', '[v]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'veryfast',
        '-c:a', 'aac',
        outputName,
      ]);

      // A resolved exec() promise is not proof of success -- ffmpeg.wasm can
      // internally abort a command (see the failed-'-map 0:a' case this
      // guards against) without ever rejecting that promise. The only real
      // signal is the output file actually existing with real bytes in it,
      // the same defense-in-depth principle as the %PDF-/PK magic-byte
      // checks already used on the ConvertAPI-backed routes.
      let data;
      try {
        data = await ffmpeg.readFile(outputName);
      } catch {
        throw new Error(describeFfmpegFailure(logLines.join('\n')));
      }
      if (!data || data.byteLength === 0) {
        throw new Error(describeFfmpegFailure(logLines.join('\n')));
      }

      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setResult({ url, name: file.name.replace(/\.[^.]+$/, '') + '-watermarked.mp4' });
      setProgress(100);
    } catch (e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened. The ffmpeg log
      // listener above already streamed the real libav-level reason (if
      // any) to the console before this ever fires.
      console.error('Watermarking failed:', e);
      if (ffmpegRef.current) {
        // Prefer a real thrown message (the codec pre-flight check and the
        // output-validation checks above already throw plain, non-technical
        // sentences); only fall back to scanning the accumulated ffmpeg log
        // when nothing usable was thrown -- this never points the visitor
        // at the console as their main instruction, that's for a developer
        // reading the console.error above.
        const reason = (e && e.message) || (typeof e === 'string' ? e : null) || describeFfmpegFailure(logLines.join('\n'));
        reportToolError({ tool: 'video-watermark', file, error: e instanceof Error ? e : new Error(String(reason)) });
        setError('Watermarking failed: ' + reason);
      }
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
        <p className="text-neutral-500 text-sm text-center mb-2">Works on videos up to <strong>2 minutes</strong> long. Watermarking runs entirely in your browser and takes roughly as long as the video itself (about 1 second of processing per second of video).</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Best supported formats: <strong>MP4 (H.264)</strong> and <strong>WebM</strong>. Formats like .avi, many .mov/.mkv files, or uncommon codecs often can&apos;t be decoded in-browser at all -- convert to MP4 first if your file is rejected.</p>
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
          { q: "Is audio preserved?", a: "Yes, if your video has an audio track it's kept and re-encoded to AAC alongside the watermarked video. Silent or audio-free videos (screen recordings, muted exports) work fine too -- the output is just video-only." },
          { q: "Why was my video rejected before I even clicked Convert?", a: "Two different reasons produce two different messages. If your browser can't decode the file at all (common for .avi, some .mov/.mkv, or uncommon codecs), you'll see a message saying so -- that's a browser support gap, not proof your file is broken. If the browser can play the file but can't determine its length, you'll see a different message asking for a re-export. MP4 (H.264) and WebM are the safest formats to use here." },
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
