'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import MediaInfo from '../../../components/MediaInfo';
import MetadataStripper from '../../../components/MetadataStripper';
import { VIDEO_ACCEPT } from '../../../lib/mediaSupport';
import IosOriginalNote from '../../../components/IosOriginalNote';
import UploadPrompt from '@/app/components/UploadPrompt';

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
        <p className="text-neutral-500 text-center mb-8">Codecs, bitrate, frame rate, resolution, audio tracks and tags of a video file — read in your browser, nothing uploaded</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputEl && inputEl.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a video file" />}</p>
            <input ref={setInputEl} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleFile} />
          </div>
          {videoUrl && <video src={videoUrl} controls playsInline className="w-full rounded-xl bg-neutral-800" />}
          <MediaInfo file={file} />
          <MetadataStripper file={file} kind="video" />
        </div>
      </div>
      <SeoContent
        title="Video Metadata"
        description={`Video Metadata reads the full technical report of one video file with ffprobe running in your browser: container, duration and overall bitrate; for each video stream the codec and profile, resolution, display aspect, frame rate, pixel format, color and rotation; for each audio track the codec, sample rate, channels and language; subtitle tracks, tags such as the creation date, and chapters. It reads MP4, MOV, MKV, WebM, AVI, WMV, FLV, MPEG, TS and more, even when the browser cannot play them. "Remove the metadata (no re-encoding)" saves a copy without location, dates, device tags, chapters, subtitle or data tracks.`}
        howToTitle="How to check a video file's metadata"
        howTo={[
          `Pick or drop a video file; on an iPhone, pick it from Files to read the original.`,
          `Wait for ffprobe to finish; the engine it runs on, about 10 MB, loads on the first visit only.`,
          `Read "General", each "Stream", and "Tags" and "Chapters" when the file has them.`,
          `Copy every field with "Copy full report (JSON)", or press "Download" for the same data as a file.`,
          `To strip location and other tags, click "Remove the metadata (no re-encoding)", then "Download" the copy.`,
        ]}
        specs={[
          { label: `Input formats`, value: `MP4, M4V, MOV, QT, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS` },
          { label: `Report`, value: `Video, audio and subtitle streams listed one by one; full ffprobe JSON on request` },
          { label: `Clean copy output`, value: `Same container; video and audio copied unchanged; tags, chapters, subtitle and data tracks removed` },
          { label: `Maximum file size`, value: `Report: none set by the page, as the file is read from disk in pieces. Clean copy: 2 GB.` },
          { label: `On iPhone and iPad`, value: `A video chosen from Photos arrives already re-encoded by iOS; choose it from Files to read the original.` },
        ]}
        privacy={`ffprobe reads the video and ffmpeg writes the clean copy inside your browser tab, both compiled to WebAssembly and downloaded from unpkg.com on first use; no frame or sound of the video leaves the device. If making the clean copy fails, its error text, cleaned of your file name, is logged by us with your browser's name and version.`}
        privacyTitle="Where your video is processed"
        faqs={[
          { q: `Can I remove the GPS location from a phone video?`, a: `Yes. "Remove the metadata (no re-encoding)" writes a copy without location, dates, device, title and comment tags or chapters, and leaves out subtitle and data tracks where drones and dashcams store positions. Motion JPEG and AVCHD (.mts) files can keep data inside each picture; the page warns you, since only re-encoding removes it.` },
          { q: `Does it show a phone video's rotation?`, a: `Yes, when the file carries a rotation flag: the "Rotation" row then shows the angle, which explains why a video stored in landscape can play sideways in some players. The row is left out when there is no rotation.` },
          { q: `How large a video can it read?`, a: `2 GB for the clean copy, which the browser tab has to write in full; the report itself is not capped, because ffprobe reads only the parts it needs from disk.` },
          { q: `Does it read the original file on an iPhone?`, a: `No, not when you pick from Photos: iOS hands the page a re-encoded copy, so size, bitrate and tags differ. Save the video to Files first and choose it there; the page shows this note on iPhone and iPad.` },
        ]}
        tips={[
          `If the bitrate shown is far higher than you need for sharing, shrink the file with Video Compressor.`,
        ]}
      />
    </div>
  );
}
