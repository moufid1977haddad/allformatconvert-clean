'use client';
import { useEffect, useState } from 'react';
import { FileDownload } from './FileDownload';

// P24 (03/10): removes the metadata of a video or audio file without re-encoding — the GPS position, date and device
// an iPhone writes into its videos, the title / artist / comment tags, chapters — as metadata2go's "Metadata
// Remover" does, here in the browser. ffmpeg.wasm copies the picture and sound streams as they are (-c copy):
// same quality, same format. Data streams (where a phone can keep timed location) and, for audio, the cover picture
// are left out, and the page says so. The file is mounted, not copied into memory (WORKERFS, as Video Merger).
const MAX_BYTES = 2 * 1024 * 1024 * 1024;

export default function MetadataStripper({ file, kind = 'video' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  useEffect(() => { setResult(null); setError(''); }, [file]);
  if (!file) return null;

  const strip = async () => {
    setBusy(true); setError(''); setResult(null);
    let ffmpeg;
    try {
      if (file.size > MAX_BYTES) throw new Error('This file is over 2 GB, more than a browser tab can rewrite.');
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      ffmpeg = new FFmpeg();
      await ffmpeg.load();
      const ext = (file.name.match(/\.([a-z0-9]{1,5})$/i)?.[1] || (kind === 'audio' ? 'm4a' : 'mp4')).toLowerCase();
      const inName = 'source.' + ext; // a plain name inside the mount, whatever the visitor's file is called
      await ffmpeg.createDir('/in');
      await ffmpeg.mount('WORKERFS', { files: [new File([file], inName, { type: file.type })] }, '/in');
      const out = 'clean.' + ext;
      const streams = kind === 'audio' ? ['-map', '0:a'] : ['-map', '0:v?', '-map', '0:a?', '-map', '0:s?'];
      const mp4ish = /^(mp4|m4v|mov|m4a|3gp|m4b|m4r)$/.test(ext);
      const args = ['-i', '/in/' + inName, ...streams, '-map_metadata', '-1', '-map_chapters', '-1', '-c', 'copy', '-fflags', '+bitexact', ...(mp4ish ? ['-movflags', '+faststart'] : []), out];
      // the exit code is checked: ffmpeg.exec does not throw when ffmpeg fails
      if (await ffmpeg.exec(args) !== 0) throw new Error('ffmpeg could not rewrite this file without re-encoding (an unusual container or codec).');
      const data = await ffmpeg.readFile(out);
      if (!data?.byteLength) throw new Error('The cleaned file came out empty.');
      const blob = new Blob([data.buffer], { type: file.type || (kind === 'audio' ? 'audio/mp4' : 'video/mp4') });
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace(/(\.[^.]+)?$/, '-no-metadata$1'), bytes: blob.size });
    } catch (e) { setError(e?.message || String(e)); }
    finally { try { ffmpeg?.terminate(); } catch { /* already gone */ } setBusy(false); }
  };

  return (
    <div className="border-t border-neutral-200 pt-4 space-y-2" data-metadata-stripper>
      <button type="button" onClick={strip} disabled={busy} className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-300 text-white rounded-xl py-2 font-semibold">
        {busy ? 'Removing the metadata…' : 'Remove the metadata (no re-encoding)'}
      </button>
      <p className="text-xs text-neutral-500">Removes location, date, device, title / artist / comment tags and chapters; the {kind === 'audio' ? 'sound is' : 'picture and sound are'} copied as they are{kind === 'audio' ? ', and the cover picture is left out' : ', and data tracks (where a phone can store timed location) are left out'}. Done in your browser.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {result && <FileDownload href={result.url} name={result.name} />}
    </div>
  );
}
