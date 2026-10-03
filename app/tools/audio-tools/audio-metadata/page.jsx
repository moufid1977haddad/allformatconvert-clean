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
        <p className="text-neutral-500 text-center mb-8">Codec, bitrate, sample rate, channels, tags and cover art of any audio file — read in your browser, nothing uploaded</p>
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
        description="Audio Metadata shows the full technical report of an audio file — container, duration, overall bitrate, codec and profile, sample rate, channels, bit depth, embedded tags (title, artist, album…), chapters and cover picture — read by ffprobe running in your browser. Nothing is uploaded, and the file is read from your disk in pieces, so its size does not matter. The report can be copied or downloaded as JSON."
        howTo={[
          "Click the upload area and select an audio file (MP3, WAV, FLAC, M4A, OGG, Opus, WMA, AIFF, AC3 and more).",
          "The report appears in a few seconds (the first time also loads the ~10 MB reading engine).",
          "Read the general information, the tags, and the details of each stream; the cover picture is shown if the file has one.",
          "Copy or download the full report as JSON if you need every field."
        ]}
        faqs={[
          { q: "What information does it show?", a: "Container, duration, overall bitrate, and for each stream the codec, profile, sample rate, channels and layout, bit depth, sample format and bitrate; the embedded tags (title, artist, album, year, genre, track, comment, encoder…), chapters, and the cover picture." },
          { q: "Can I edit or remove the tags?", a: "Editing, not yet. Removing, yes: 'Remove the metadata' writes a copy without its tags (title, artist, album, comment, encoder), chapters and cover picture, the sound copied as it is — no re-encoding, no quality lost — in your browser." },
          { q: "What audio formats are supported?", a: "Everything ffmpeg can read, including formats your browser cannot play (WMA, AC3, AMR…): for those there is no preview player, but the report is complete." },
          { q: "Is there a size limit?", a: "No: the file is read from your disk in pieces, never copied whole into memory." },
          { q: "Is my file uploaded anywhere?", a: "No. ffprobe (part of ffmpeg, compiled to WebAssembly) runs in your browser; your file never leaves your device." }
        ]}
        tips={[
          "Check the bitrate and sample rate before converting: re-encoding a 128 kbit/s MP3 at 320 kbit/s does not add quality back.",
          "“Bit depth” tells you whether a lossless file is 16-bit (CD) or 24-bit (studio).",
          "Download the JSON report to keep a record of a file's exact technical details.",
          "An empty “Tags” section means the file carries no embedded tags."
        ]}
      />
    </div>
  );
}
