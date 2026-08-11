'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      await ffmpeg.writeFile('input.gif', await fetchFile(file));
      // libx264 requires even width/height; GIFs often aren't, so scale down
      // to the nearest even dimension if needed.
      await ffmpeg.exec([
        '-i', 'input.gif',
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        'output.mp4'
      ]);
      const data = await ffmpeg.readFile('output.mp4');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setResult(url);
    } catch(e) { setError('Conversion failed: ' + e.message); }
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
          {result && <div className="space-y-2"><video controls src={result} className="w-full rounded-xl" /><a href={result} download="converted.mp4" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a></div>}
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
          { q: "Does the output preserve my GIF's full animation?", a: "Yes — every frame and its original timing from the source GIF is carried over into the video, not just a single frame." },
          { q: "What format is the output actually in?", a: "A real MP4 file using H.264 video, playable in virtually any video player or website that accepts MP4 uploads." },
          { q: "Does the video have sound?", a: "No — GIFs never contain audio, so there's nothing to carry over; the output video is silent." },
          { q: "Is GIF to MP4 free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my file uploaded anywhere?", a: "No. Conversion happens entirely in your browser via ffmpeg.wasm — nothing is uploaded to a server." }
        ]}
        tips={[
          "The first conversion after loading the page takes longer since the ffmpeg.wasm engine needs to download.",
          "MP4 is far more widely compatible than GIF for sharing on social platforms or embedding in video players.",
          "If your GIF has an odd width or height, it's automatically scaled down by one pixel to satisfy H.264's even-dimension requirement — this is a 1px crop, not a visible quality change.",
          "For a much smaller file than the original GIF at similar visual quality, MP4/H.264 is typically far more efficient than GIF's format."
        ]}
      />
    </div>
  );
}