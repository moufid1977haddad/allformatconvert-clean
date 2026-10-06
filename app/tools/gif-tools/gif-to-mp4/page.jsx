'use client';
import { headerSize, sizeProblem, MAX_ANIMATION_PIXELS } from '../../../lib/gifEncode';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reportToolError } from '../../../lib/reportError';
import { FileDownload } from '../../../components/FileDownload';
import { execChecked } from '../../../lib/ffmpegRun';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function GifToMp4Page() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); setError(''); };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    try {
      // P21 (robustness): a GIF really, and of a size a video can hold — a 30 000 × 30 000 PNG renamed .gif was
      // handed to the encoder and a "result" offered. Checked before ffmpeg (~30 MB) is loaded.
      const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (!file.size || !(head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46)) { const err = new Error('this is not a GIF file (or it is empty). Choose an animated GIF.'); err.visitor = true; throw err; }
      const tooBig = sizeProblem(headerSize(head));
      if (tooBig) { const err = new Error(tooBig); err.visitor = true; throw err; }
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      // ffmpeg.wasm's own stderr/stdout -- this is where the real reason for
      // a failure lives. Without this, a failed exec() surfaces only as a
      // generic rejection with no way to diagnose what actually happened.
      ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));
      await ffmpeg.load();
      const bytes = await fetchFile(file);
      // ffmpeg.wasm writes a constant frame rate and gave the LAST frame one frame period only: a GIF of
      // 100/200/300 ms came out 0.4 s long instead of 0.6 s, and a final pause was lost (audit 2, 29/09).
      // The last frame is now held (tpad) and the video cut at the GIF's real length: the sum of its frame
      // delays, read with gifuct-js (under 20 ms counts as 100 ms, as ffmpeg's GIF demuxer and browsers do).
      const { parseGIF } = await import('gifuct-js');
      const delays = parseGIF(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)).frames
        .filter((f) => f.image).map((f) => { const d = f.gce ? f.gce.delay * 10 : 0; return d < 20 ? 100 : d; });
      const total = delays.length > 1 ? delays.reduce((a, d) => a + d, 0) : 0;
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);
      await ffmpeg.writeFile('input.gif', bytes);
      // libx264 requires even width/height; GIFs often aren't, so scale down
      // to the nearest even dimension if needed.
      await execChecked(ffmpeg, [
        '-i', 'input.gif',
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        // fps first: tpad cannot clone on a GIF stream, which has no declared frame rate (ffmpeg 5.1 in
        // ffmpeg.wasm). The rate is the GIF's own time grid (1000 / gcd of the delays, 100 at most: GIF delays
        // are in hundredths of a second), so every frame keeps its exact duration.
        '-vf', (total ? `fps=${1000 / delays.reduce(gcd)},tpad=stop_mode=clone:stop_duration=${delays[delays.length - 1] / 1000},` : '') + 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        ...(total ? ['-t', String(total / 1000)] : []),
        'output.mp4'
      ]);
      const data = await ffmpeg.readFile('output.mp4');
      // never offer an empty or broken file as a video: an MP4 starts with its "ftyp" box
      if (!data || data.length < 100 || String.fromCharCode(...data.subarray(4, 8)) !== 'ftyp') throw new Error('the video could not be made from this GIF.');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setResult(url);
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Conversion failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      if (!(e && e.visitor)) reportToolError({ tool: 'gif-to-mp4', file, error: e instanceof Error ? e : new Error(String(reason)) }); // a wrong file is not a failure of the tool
      setError('Conversion failed: ' + reason);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">GIF to MP4</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to MP4 video</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img alt="Preview of your image" src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="a GIF file" /></p>}
            <input ref={inputRef} type="file" accept="image/gif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to MP4'}</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><FileDownload href={result} name="converted.mp4" /></div>}
        </div>
      </div>
      <SeoContent
        title="GIF to MP4"
        description="GIF to MP4 turns an animated GIF into an MP4 video (H.264, yuv420p, fast start) for sites and apps that take video rather than GIF. ffmpeg.wasm runs on this page and reads the delay of each frame, so a pause in the GIF stays a pause and the last frame keeps its full time. Video has no transparency, so transparent areas become white. An odd width or height is scaled to the even size that H.264 needs. The MP4 holds the animation once and has no sound."
        howToTitle="How to convert GIF to MP4"
        howTo={[
          "Choose the GIF to turn into a video; it shows as a preview before conversion.",
          "Click \"Convert to MP4\"; the ffmpeg.wasm engine is loaded before each conversion, faster once your browser has cached it.",
          "Play the video under the button to check the timing.",
          "Click \"Download\" to save converted.mp4."
        ]}
        specs={[
          { label: "Input", value: "GIF (image/gif)" },
          { label: "Output", value: "MP4 with H.264 video (yuv420p), no audio, saved as converted.mp4" },
          { label: "Frame size", value: `Up to ${(MAX_ANIMATION_PIXELS / 1e6).toFixed(1)} megapixels per frame, checked before ffmpeg.wasm loads` },
          { label: "Timing", value: "Each frame keeps its delay; delays under 20 ms count as 100 ms, as in browsers" },
          { label: "Dimensions", value: "An odd width or height is reduced by one pixel" }
        ]}
        privacy="ffmpeg.wasm encodes the MP4 inside this tab, and the GIF never leaves it. The ffmpeg.wasm engine is fetched from unpkg.com for each conversion, unless your browser reuses a cached copy; that request carries nothing about your file. A failed conversion is reported to our error log with the cleaned message, the file extension, a size range and your browser name, never the file or its name."
        faqs={[
          { q: "Will the MP4 loop like my GIF?", a: "No. The MP4 contains the animation once, because video files have no loop setting. A web page can repeat it with the loop attribute of the video tag, and a video player can be set to repeat it." },
          { q: "Does the MP4 keep transparency?", a: "No. H.264 video has no transparency, so transparent areas come out white, as the GIF looks on a white page. This was checked with a test GIF that has a transparent background." },
          { q: "Is the timing of the GIF kept?", a: "Yes. The frame delays are read from the GIF, the frame rate of the video is set on their common time grid, and the last frame is held for its own delay, so the MP4 lasts as long as one play of the GIF." },
          { q: "Will the size of the picture change?", a: "Yes, by one pixel at most, and only for an odd width or height: H.264 needs even sizes. The picture is scaled to the even size, not cropped." }
        ]}
      />
    </div>
  );
}