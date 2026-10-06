'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import MediaInfo from '../../../components/MediaInfo';
import MetadataStripper from '../../../components/MetadataStripper';
import { AUDIO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import UploadPrompt from '@/app/components/UploadPrompt';

// 28/09/2026: the page used to list only name, size, MIME type, date and the player's duration (nothing for a
// format the player cannot read). The full technical report now comes from ffprobe in the browser (MediaInfo):
// codec, bitrate, sample rate, channels, bit depth, tags, chapters, cover picture -- what the reference
// (metadata2go.com) shows after uploading the file, here without uploading it and without its 75 MB cap.
export default function AudioMetadataPage() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [inputEl, setInputEl] = useState(null);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Metadata</h1>
        <p className="text-neutral-500 text-center mb-8">Codec, bitrate, sample rate, channels, tags and cover art of an audio file — read in your browser, nothing uploaded</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => inputEl && inputEl.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /></p>}
          </div>
          <input ref={setInputEl} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFile} />
          {audioUrl && <audio src={audioUrl} controls className="w-full" />}
          {file && encryptedMusicMessage(file.name) && <p role="alert" className="text-sm text-red-600 text-center">{encryptedMusicMessage(file.name)}</p>}
          <MediaInfo file={file} />
          <MetadataStripper file={file} kind="audio" />
        </div>
      </div>
      <SeoContent
        title="Audio Metadata"
        description={`Audio Metadata reads the technical report of one audio file with ffprobe, the probing part of ffmpeg, compiled to WebAssembly. You get the container, duration and overall bitrate; for each stream the codec and profile, sample rate, channels and layout, bit depth and sample format; the container's tags such as title, artist and album (OGG and Opus files keep theirs inside the stream: see the JSON report); chapters; and the cover picture. Files your browser cannot play, such as WMA or AMR, still get a full report. A second button writes a copy of the file without its tags, chapters and cover, with the sound copied unchanged.`}
        howToTitle="How to read an audio file's metadata"
        howTo={[
          `Pick or drop an audio file such as MP3, WAV, M4A, FLAC, OGG, Opus, WMA, AIFF or AMR.`,
          `The report shows once ffprobe has read the file; on your first visit the page also fetches the reading engine, about 10 MB.`,
          `Look through "General" and each "Stream", plus "Tags" and "Chapters" if the file carries them.`,
          `Keep the report: "Copy full report (JSON)" puts it on the clipboard, "Download" saves it as a .json file.`,
          `For a tag-free copy of the song, press "Remove the metadata (no re-encoding)" and save what appears.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AC3, AIFF, AIF, AMR, MKA, WEBA, CAF` },
          { label: `Report`, value: `Shown in sections, with every field ffprobe returns available as JSON` },
          { label: `Clean copy output`, value: `Same format as the source, audio streams only, without tags, chapters or cover picture` },
          { label: `Maximum file size`, value: `Report: set by your browser, since the file is read from disk in pieces. Clean copy: 2 GB.` },
        ]}
        privacy={`ffprobe and ffmpeg run on this page as WebAssembly, fetched from unpkg.com the first time. They read your audio straight from disk and write the clean copy in the browser tab; the file and its tags are not sent to any server. If making the clean copy fails, its error message, stripped of your file name, reaches our error log with the tool name and your browser's name and version.`}
        faqs={[
          { q: `Can I edit the tags?`, a: `No, not yet. You can only remove them: "Remove the metadata (no re-encoding)" writes a copy without title, artist, album, comment and encoder tags, chapters or cover picture. The sound itself is copied, not re-encoded, so its quality does not change.` },
          { q: `Does it show the bit depth?`, a: `Yes, when the file stores one, as WAV, FLAC and ALAC files do. Lossy formats such as MP3 store none, so the "Bit depth" row is left out for them while the codec and bitrate are still shown.` },
          { q: `How large an audio file can it read?`, a: `Any size for the report: ffprobe reads the file from disk in pieces and never loads it whole. The clean copy is different: above 2 GB the page refuses, because the browser tab would have to hold the whole new file.` },
          { q: `Does a missing Tags section mean the file has no tags?`, a: `No, not always. The "Tags" section lists the container's tags, as MP3, M4A and FLAC store them. OGG and Opus files keep their tags inside the audio stream, which that section does not list; "Copy full report (JSON)" shows them.` },
        ]}
        tips={[
          `Check the real bitrate here before using Audio Compressor, which stays at or below it when it can read it.`,
          `Make a clean copy before posting a recording whose tags name you or your device.`,
        ]}
      />
    </div>
  );
}
