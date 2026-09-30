'use client';
import { segmentsToSubtitles } from '../lib/subtitleTime';
import { DownloadGroup, TextDownload } from './FileDownload';

// Download rows for a transcript: TXT always, SRT and VTT subtitles when the timed segments came back (30/09).
// Through the site's one download component (P18): name, format, size, Download, Save / Share on iPhone/iPad.
export default function TranscriptExports({ text, segments, baseName }) {
  const subs = segmentsToSubtitles(segments);
  const base = (baseName || 'transcript').replace(/\.[^.]+$/, '') || 'transcript';
  return (
    <div data-transcript-exports>
      <DownloadGroup zipName={`${base}-transcript.zip`}>
        <TextDownload text={text} name={`${base}.txt`} />
        {subs && <TextDownload text={subs.srt} name={`${base}.srt`} type="application/x-subrip" />}
        {subs && <TextDownload text={subs.vtt} name={`${base}.vtt`} type="text/vtt" />}
      </DownloadGroup>
    </div>
  );
}
