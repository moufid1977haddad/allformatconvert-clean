'use client';
import { segmentsToSubtitles } from '../lib/subtitleTime';
import { saveBlob } from '../lib/download';

// Download buttons for a transcript: TXT always, SRT and VTT subtitles when the timed segments came back (30/09).
export default function TranscriptExports({ text, segments, baseName }) {
  const subs = segmentsToSubtitles(segments);
  const base = (baseName || 'transcript').replace(/\.[^.]+$/, '') || 'transcript';
  const save = (content, ext, type) => saveBlob(new Blob([content], { type }), `${base}.${ext}`);
  const btn = 'flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl py-2 text-sm font-semibold transition';
  return (
    <div className="flex gap-2" data-transcript-exports>
      <button type="button" className={btn} onClick={() => save(text, 'txt', 'text/plain;charset=utf-8')}>Download TXT</button>
      {subs && <button type="button" className={btn} onClick={() => save(subs.srt, 'srt', 'application/x-subrip')}>Download SRT</button>}
      {subs && <button type="button" className={btn} onClick={() => save(subs.vtt, 'vtt', 'text/vtt')}>Download VTT</button>}
    </div>
  );
}
