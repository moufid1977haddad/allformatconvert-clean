'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { reportToolError } from '../../../lib/reportError';

export default function AudioMergerPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(newFiles);
    setResult(null);
  };

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      // ffmpeg.wasm's own stderr/stdout -- this is where the real reason for
      // a failure lives. Without this, a failed exec() surfaces only as a
      // generic rejection with no way to diagnose what actually happened.
      ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));
      await ffmpeg.load();

      // Maps an audio codec_name (as reported by ffprobe) to a container
      // extension that it is SAFE to stream-copy into. Deliberately
      // conservative -- an unknown codec falls through to the re-encode
      // path rather than guessing at container compatibility.
      const COPY_SAFE_EXT = {
        mp3: 'mp3',
        flac: 'flac',
        vorbis: 'ogg',
        opus: 'opus',
        aac: 'aac',
        pcm_s16le: 'wav',
        pcm_s24le: 'wav',
        pcm_s32le: 'wav',
        pcm_u8: 'wav',
        pcm_f32le: 'wav',
        pcm_f64le: 'wav',
      };
      const MIME_FOR_EXT = {
        mp3: 'audio/mpeg', flac: 'audio/flac', ogg: 'audio/ogg',
        opus: 'audio/opus', aac: 'audio/aac', wav: 'audio/wav',
      };

      const probeCodec = async (name) => {
        await ffmpeg.ffprobe([
          '-v', 'error',
          '-select_streams', 'a:0',
          '-show_entries', 'stream=codec_name',
          '-of', 'default=noprint_wrappers=1:nokey=1',
          name,
          '-o', 'probe.txt',
        ]);
        const probeData = await ffmpeg.readFile('probe.txt');
        await ffmpeg.deleteFile('probe.txt');
        return new TextDecoder().decode(probeData).trim().split('\n')[0] || null;
      };

      const inputNames = [];
      for (let i = 0; i < files.length; i++) {
        const rawExt = (files[i].name.split('.').pop() || 'dat').toLowerCase();
        const ext = /^[a-z0-9]{1,10}$/.test(rawExt) ? rawExt : 'dat'; // keep out of the quoted concat list-file syntax
        const name = `input${i}.${ext}`;
        await ffmpeg.writeFile(name, await fetchFile(files[i]));
        inputNames.push(name);
      }

      const codecs = [];
      for (const name of inputNames) {
        codecs.push(await probeCodec(name));
      }
      const allSameCodec = codecs.every((c) => c && c === codecs[0]);
      const canStreamCopy = allSameCodec && Object.prototype.hasOwnProperty.call(COPY_SAFE_EXT, codecs[0]);

      let outputName;
      let mime;
      if (canStreamCopy) {
        const ext = COPY_SAFE_EXT[codecs[0]];
        outputName = `output.${ext}`;
        mime = MIME_FOR_EXT[ext] || 'audio/mpeg';
        const listEntries = inputNames.map((n) => `file '${n}'`);
        await ffmpeg.writeFile('list.txt', new TextEncoder().encode(listEntries.join('\n')));
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', outputName]);
      } else {
        outputName = 'output.mp3';
        mime = 'audio/mpeg';
        const args = [];
        inputNames.forEach((n) => args.push('-i', n));
        const filterInputs = inputNames.map((_, i) => `[${i}:a]`).join('');
        args.push('-filter_complex', `${filterInputs}concat=n=${inputNames.length}:v=0:a=1[out]`, '-map', '[out]', outputName);
        await ffmpeg.exec(args);
      }

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
      const outExt = outputName.split('.').pop();
      setResult({ url, name: `merged_audio.${outExt}` });
    } catch(e) {
      // Full error object + stack to the console -- ffmpeg.wasm frequently
      // throws non-Error values (or Errors with no .message) on internal
      // failures, so `e.message` alone can silently render as "undefined"
      // with zero way to diagnose what actually happened.
      console.error('Merge failed:', e);
      const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
      // No single "the file" for a multi-file merge -- ext/sizeBucket stay
      // null rather than reporting just the first of several files.
      reportToolError({ tool: 'audio-merger', error: e instanceof Error ? e : new Error(String(reason)) });
      setError('Merge failed: ' + reason);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Merger</h1>
        <p className="text-neutral-500 text-center mb-8">Merge multiple audio files into one</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {files.length > 0 ? <p className="text-neutral-700 font-medium">{files.length} files selected</p> : <p className="text-neutral-400 text-sm">Click to upload multiple audio files</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => <div key={i} className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">{i+1}. {f.name}</div>)}
            </div>
          )}
          <button onClick={merge} disabled={files.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Merging...' : 'Merge Audio Files'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <audio controls src={result.url} className="w-full" />
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Merged Audio</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Merger"
        description="Audio Merger joins two or more audio files into one, entirely in your browser via ffmpeg.wasm — nothing is uploaded to a server. Each file's codec is detected automatically: if every file shares the same codec, they're combined with a lossless stream-copy; if codecs differ, the files are automatically re-encoded to MP3 so the result plays correctly instead of coming out broken or silent. Files are combined in the order you select them; there's no drag-to-reorder, fade, or volume-leveling controls."
        howTo={[
          "Click the upload area and select two or more audio files — they'll merge in the order you pick them.",
          "Review the list of selected files.",
          "Click \"Merge Audio Files\" to combine them locally.",
          "Preview and download the merged audio file."
        ]}
        faqs={[
          { q: "Can I reorder files before merging?", a: "Not currently — files merge in the order they were selected during upload." },
          { q: "Does merging work with mixed formats?", a: "Yes. The tool checks each file's codec first: same-codec files (e.g., all MP3, or all WAV) are joined with a lossless stream-copy, and mixed-codec files (e.g., an MP3 and a WAV) are automatically re-encoded to MP3 so the merge always produces valid, playable audio." },
          { q: "Is there a limit on file count or size?", a: "No hard limit is enforced by the tool — you're limited by your browser's available memory." },
          { q: "Is my data private?", a: "Yes. Everything happens locally via ffmpeg.wasm — files are never uploaded to a server." }
        ]}
        tips={[
          "Merging files that share the same format (e.g., all MP3, all WAV, all FLAC) keeps the merge lossless — the output is a stream-copy with no quality loss and no re-encoding.",
          "Double-check the file order in the list before merging, since there's no drag-to-reorder — remove and re-add files in the order you want if needed.",
          "Mixing formats (e.g., MP3 with WAV) is fully supported — it's automatically re-encoded to MP3, so expect the output extension to change accordingly.",
          "The first merge after loading the page takes longer since the ffmpeg.wasm engine needs to download."
        ]}
      />
    </div>
  );
}