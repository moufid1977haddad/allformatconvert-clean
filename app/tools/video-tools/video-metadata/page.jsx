'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import MediaInfo from '../../../components/MediaInfo';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';

// 28/09/2026: the page used to list only name, size, MIME type, duration, width and height from the browser's
// player, and nothing but an error for a format the player cannot read (AVI, WMV, MKV in Safari…). The full
// technical report now comes from ffprobe in the browser (MediaInfo): codecs, bitrates, frame rate, pixel format,
// color, rotation, audio tracks, subtitles, chapters, tags -- what the reference (metadata2go.com) shows after
// uploading the file, here without uploading it and without its 75 MB cap.
export default function VideoMetadataPage() {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [inputEl, setInputEl] = useState(null);

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);
  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video Metadata</h1>
        <p className="text-neutral-500 text-center mb-8">Codecs, bitrate, frame rate, resolution, audio tracks and tags of any video — read in your browser, nothing uploaded</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputEl && inputEl.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={setInputEl} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFile} />
          </div>
          {videoUrl && <video src={videoUrl} controls playsInline className="w-full rounded-xl bg-neutral-800" />}
          <MediaInfo file={file} />
        </div>
      </div>
      <SeoContent
        title="Video Metadata"
        description="Video Metadata shows the full technical report of a video file — container, duration, overall bitrate, and for each stream the codec and profile, resolution, display aspect, frame rate, pixel format, color, rotation, bitrate, audio sample rate and channels, subtitle and audio languages — plus tags and chapters, read by ffprobe running in your browser. Nothing is uploaded, and the file is read from your disk in pieces, so its size does not matter. The report can be copied or downloaded as JSON."
        howTo={[
          "Click the upload area and select a video file (MP4, MOV, MKV, WebM, AVI, WMV, FLV, MPEG, TS and more).",
          "The report appears in a few seconds (the first time also loads the ~10 MB reading engine).",
          "Read the general information, then each stream: video, audio tracks, subtitles.",
          "Copy or download the full report as JSON if you need every field."
        ]}
        faqs={[
          { q: "What information does it show?", a: "Container, duration and overall bitrate; for each video stream the codec, profile, resolution, display aspect, frame rate, pixel format, color and rotation; for each audio track the codec, sample rate, channels and language; subtitle tracks; tags (title, creation date, encoder…) and chapters." },
          { q: "What video formats are supported?", a: "Everything ffmpeg can read, including formats your browser cannot play (AVI, WMV, FLV…): for those there is no preview player, but the report is complete." },
          { q: "Can I download a metadata report?", a: "Yes: copy it or download it as a JSON file — ffprobe's complete output, every field included." },
          { q: "Is there a size limit?", a: "No: the file is read from your disk in pieces, never copied whole into memory." },
          { q: "Is my file uploaded anywhere?", a: "No. ffprobe (part of ffmpeg, compiled to WebAssembly) runs in your browser; your file never leaves your device." }
        ]}
        tips={[
          "“Rotation” explains why a phone video plays sideways in some players: the picture is stored landscape with a rotation flag.",
          "Compare the overall bitrate of two versions of a video to see which one kept more quality.",
          "The frame rate and pixel format tell you whether a video will play smoothly on older devices (e.g. 60 fps or 10-bit HDR).",
          "Download the JSON report to keep a record of a file's exact technical details."
        ]}
      />
    </div>
  );
}
