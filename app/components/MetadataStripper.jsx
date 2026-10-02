'use client';
import { useEffect, useState } from 'react';
import { FileDownload } from './FileDownload';

// P24 (03/10): removes the metadata of a video or audio file without re-encoding — the GPS position, date and device
// an iPhone writes into its videos, the title / artist / comment tags, chapters — as metadata2go's "Metadata
// Remover" does, here in the browser. ffmpeg.wasm copies the picture and sound streams as they are (-c copy):
// same quality, same format. Data streams (where a phone can keep timed location) and, for audio, the cover picture
// are left out, and the page says so. The file is mounted, not copied into memory (WORKERFS, as Video Merger).
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
// P24 review (03/10): extensions ffmpeg cannot pick a muxer from (they failed with a wrong "unusual codec" message)
const MUXER_BY_EXT = { qt: 'mov', weba: 'webm', m4r: 'ipod' };
const MIME_BY_EXT = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', qt: 'video/quicktime', mkv: 'video/x-matroska', webm: 'video/webm', avi: 'video/x-msvideo', '3gp': 'video/3gpp', mts: 'video/mp2t', m2ts: 'video/mp2t', ts: 'video/mp2t', mp3: 'audio/mpeg', m4a: 'audio/mp4', m4b: 'audio/mp4', m4r: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', weba: 'audio/webm', mka: 'audio/x-matroska' };

export default function MetadataStripper({ file, kind = 'video' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [warning, setWarning] = useState('');
  useEffect(() => { setResult(null); setError(''); setWarning(''); }, [file]);
  if (!file) return null;

  const strip = async () => {
    setBusy(true); setError(''); setResult(null); setWarning('');
    let ffmpeg;
    try {
      if (file.size > MAX_BYTES) throw new Error('This file is over 2 GB, more than a browser tab can rewrite.');
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      ffmpeg = new FFmpeg();
      const log = [];
      ffmpeg.on('log', ({ message }) => { if (log.length < 400) log.push(message); });
      await ffmpeg.load();
      const ext = (file.name.match(/\.([a-z0-9]{1,5})$/i)?.[1] || (kind === 'audio' ? 'm4a' : 'mp4')).toLowerCase();
      const inName = 'source.' + ext; // a plain name inside the mount, whatever the visitor's file is called
      await ffmpeg.createDir('/in');
      await ffmpeg.mount('WORKERFS', { files: [new File([file], inName, { type: file.type })] }, '/in');
      const out = 'clean.' + ext;
      // P24 review (03/10): 0:V = video tracks without cover pictures (a cover JPEG can carry its own EXIF / GPS); subtitle tracks are left out — a drone's or dashcam's caption track holds the GPS position as text
      const streams = kind === 'audio' ? ['-map', '0:a'] : ['-map', '0:V?', '-map', '0:a?'];
      const mp4ish = /^(mp4|m4v|mov|qt|m4a|3gp|m4b|m4r)$/.test(ext);
      const args = ['-loglevel', 'info', '-i', '/in/' + inName, ...streams, '-map_metadata', '-1', '-map_chapters', '-1', '-c', 'copy', '-fflags', '+bitexact', ...(mp4ish ? ['-movflags', '+faststart'] : []), ...(MUXER_BY_EXT[ext] ? ['-f', MUXER_BY_EXT[ext]] : []), out];
      // the exit code is checked: ffmpeg.exec does not throw when ffmpeg fails
      if (await ffmpeg.exec(args) !== 0) throw new Error('ffmpeg could not rewrite this file without re-encoding (an unusual container or codec).');
      const data = await ffmpeg.readFile(out);
      if (!data?.byteLength) throw new Error('The cleaned file came out empty.');
      const blob = new Blob([data.buffer], { type: file.type || MIME_BY_EXT[ext] || (kind === 'audio' ? 'audio/mp4' : 'video/mp4') });
      // -c copy cannot reach what is written inside each picture: MJPEG frames carry an EXIF block (cameras, dashcams),
      // AVCHD camcorders put the date and GPS in the H.264 stream — said, not hidden
      const head = log.join('\n');
      const mjpeg = /Video: mjpeg(?![^\n]*attached pic)/i.test(head); // a cover picture is not the video (left out above)
      if (kind !== 'audio' && (mjpeg || /^(mts|m2ts)$/.test(ext))) setWarning(mjpeg
        ? 'Its pictures are Motion JPEG: each one can carry its own EXIF block (camera, date, sometimes GPS), which only re-encoding removes.'
        : 'An AVCHD camcorder file (.mts) can keep the date and GPS inside the video stream itself, which only re-encoding removes.');
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace(/(\.[^.]+)?$/, '-no-metadata$1'), bytes: blob.size });
    } catch (e) { setError(e?.message || String(e)); }
    finally { try { ffmpeg?.terminate(); } catch { /* already gone */ } setBusy(false); }
  };

  return (
    <div className="border-t border-neutral-200 pt-4 space-y-2" data-metadata-stripper>
      <button type="button" onClick={strip} disabled={busy} className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-300 text-white rounded-xl py-2 font-semibold">
        {busy ? 'Removing the metadata…' : 'Remove the metadata (no re-encoding)'}
      </button>
      <p className="text-xs text-neutral-500">Removes location, date, device, title / artist / comment tags and chapters; the {kind === 'audio' ? 'sound is' : 'picture and sound are'} copied as they are{kind === 'audio' ? ', and the cover picture is left out' : ', and data and subtitle tracks (where a phone, drone or dashcam can store the position) are left out, as are cover pictures and attached fonts'}. Done in your browser.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {warning && <p role="status" data-strip-warning className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{warning}</p>}
      {result && <FileDownload href={result.url} name={result.name} />}
    </div>
  );
}
