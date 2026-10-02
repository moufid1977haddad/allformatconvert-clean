'use client';
import { headerSize, sizeProblem } from '../../../lib/gifEncode';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reportToolError } from '../../../lib/reportError';
import { FileDownload } from '../../../components/FileDownload';
import { execChecked } from '../../../lib/ffmpegRun';
export default function GifToMp4Page() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept="image/gif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to MP4'}</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><FileDownload href={result} name="converted.mp4" /></div>}
        </div>
      </div>
      <SeoContent
        title="GIF to MP4"
        description="GIF to MP4 converts your GIF's full animation into a real MP4 (H.264) video, using ffmpeg.wasm entirely in your browser — nothing is uploaded to a server. All frames and their original timing are preserved; since MP4/H.264 requires even pixel dimensions, an odd width or height is automatically scaled down by one pixel."
        howTo={[
          "Click the upload area and select a GIF file from your device.",
          "Click \"Convert to MP4\" to transcode the full animation locally.",
          "Preview the resulting MP4 video.",
          "Click \"Download\" to save it."
        ]}
        faqs={[
          { q: "Does the output preserve my GIF's full animation?", a: "Yes — every frame and its original timing from the source GIF is carried over into the video, not just a single frame — the last frame keeps its full delay, so a final pause is not cut short." },
          { q: "What happens to a transparent GIF?", a: "Video has no transparency: transparent areas become white, as the GIF looks on a white web page." },
          { q: "Will the MP4 loop like my GIF?", a: "The MP4 contains the animation once; a GIF's loop setting has no equivalent in the file. Web pages and most social platforms loop short videos themselves (the loop attribute of the video tag)." },
          { q: "What format is the output actually in?", a: "A real MP4 file using H.264 video, playable in virtually any video player or website that accepts MP4 uploads." },
          { q: "Does the video have sound?", a: "No — GIFs never contain audio, so there's nothing to carry over; the output video is silent." },
          { q: "Is GIF to MP4 free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "No. Conversion happens entirely in your browser via ffmpeg.wasm — nothing is uploaded to a server." }
        ]}
        tips={[
          "The first conversion after loading the page takes longer since the ffmpeg.wasm engine needs to download.",
          "MP4 is far more widely compatible than GIF for sharing on social platforms or embedding in video players.",
          "If your GIF has an odd width or height, it's automatically scaled down by one pixel to satisfy H.264's even-dimension requirement — the picture is resized by that one pixel, not cropped, which is not visible.",
          "For a much smaller file than the original GIF at similar visual quality, MP4/H.264 is typically far more efficient than GIF's format."
        ]}
      />
    </div>
  );
}