'use client';
import { useState, useRef } from 'react';
import { FileDownload } from '../../../components/FileDownload';
import { Music } from 'lucide-react';
import SeoContent from '../../../components/SeoContent';
import { AUDIO_ACCEPT, VIDEO_ACCEPT, encryptedMusicMessage } from '../../../lib/mediaSupport';
import { detectEncoding } from '../../../lib/csvEncoding';
import UploadPrompt from '@/app/components/UploadPrompt';
import { fitSize, freeCanvas } from '../../../lib/canvasLimit'; // P31: one canvas cap for iPhone / iPad
export default function MediaPlayerPage() {
  const [file, setFile] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [url, setUrl] = useState(null);
  // 28/09/2026: a file the browser cannot play (AVI, WMV, FLV, WMA…) showed a dead player and nothing else.
  const [cannotPlay, setCannotPlay] = useState(false);
  const inputRef = useRef();
  // P24 (03/10): speed, loop, picture-in-picture, a still of the current frame and subtitles (SRT / VTT), as
  // imageonline.io's and litetools' players offer — all with the browser's own player, nothing uploaded
  const mediaRef = useRef(null);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [subUrl, setSubUrl] = useState(null);
  const [shot, setShot] = useState(null);
  const setSpeed = (r) => { setRate(r); if (mediaRef.current) mediaRef.current.playbackRate = r; };
  // P24 review (03/10): an SRT time with a one-digit hour (0:00:01,000) is written as WebVTT wants (00:00:01.000) — it
  // was left with its comma and the cue silently skipped; a file saved in Windows-1252 (common for SRT) is read as such
  const toVtt = (text) => (/^WEBVTT/.test(text.replace(/^\uFEFF/, '').trim()) ? text : 'WEBVTT\n\n' + text.replace(/^\uFEFF/, '').replace(/\r/g, '')
    .split('\n').map((line) => (!line.includes('-->') ? line // only the timing lines: a time in the text stays as typed
      : line.replace(/(^|[^\d])(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/g, (m, pre, h, mi, se, ms) => `${pre}${h.padStart(2, '0')}:${mi}:${se}.${ms.padEnd(3, '0')}`))).join('\n'));
  const loadSubs = async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const { encoding } = detectEncoding(bytes);
    const text = new TextDecoder(encoding).decode(bytes);
    setSubUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(new Blob([toVtt(text)], { type: 'text/vtt' })); });
  };
  const snapshot = () => {
    const v = mediaRef.current; if (!v || !v.videoWidth) return;
    const { width, height } = fitSize(v.videoWidth, v.videoHeight); // an 8K frame is 33 MP: over the iPhone canvas cap
    const c = document.createElement('canvas'); c.width = width; c.height = height; c.getContext('2d').drawImage(v, 0, 0, width, height);
    c.toBlob((b) => { freeCanvas(c); if (b) setShot(URL.createObjectURL(b)); }, 'image/png');
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setCannotPlay(false);
    setSubUrl((old) => { if (old) URL.revokeObjectURL(old); return null; }); setShot(null); // a new video: the previous one's subtitles and still go
    // The MIME type is often empty for .mkv, .avi, .flv…: fall back on the extension.
    setIsVideo(f.type ? f.type.startsWith('video') : /\.(mp4|m4v|mov|qt|webm|mkv|avi|wmv|flv|ogv|3gp|3g2|mpg|mpeg|ts|mts|m2ts)$/i.test(f.name));
    setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
  };
  const ext = file ? (file.name.split('.').pop() || '').toUpperCase() : '';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Media Player</h1>
        <p className="text-neutral-500 text-center mb-8">Play audio and video files in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a media file" />}</p>
            <p className="text-neutral-500 text-sm mt-1">Plays what your browser can decode, such as MP4, MP3, WAV, OGG and WebM</p>
            <input ref={inputRef} type="file" accept={`${AUDIO_ACCEPT},${VIDEO_ACCEPT}`} className="hidden" onChange={handleFile} />
          </div>
          {file && encryptedMusicMessage(file.name) ? (
            <p role="alert" className="text-sm text-red-600 text-center">{encryptedMusicMessage(file.name)}</p>
          ) : cannotPlay && (
            <p role="alert" className="text-sm text-red-600 text-center">
              This browser cannot play {ext ? `this ${ext} file` : 'this file'}. Convert it first with the <a className="underline" href={isVideo ? '/tools/video-tools/video-converter' : '/tools/audio-tools/audio-converter'}>{isVideo ? 'Video Converter (to MP4)' : 'Audio Converter (to MP3)'}</a>, then play it here.
            </p>
          )}
          {url && (
            <div className="space-y-3">
              {isVideo ? (
                <video ref={mediaRef} controls playsInline src={url} loop={loop} onLoadedMetadata={(e) => { e.currentTarget.playbackRate = rate; }} onError={() => setCannotPlay(true)} className="w-full rounded-xl bg-neutral-800">
                  {subUrl && <track kind="subtitles" src={subUrl} default label="Subtitles" />}
                </video>
              ) : (
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-8 text-center space-y-4">
                  <Music className="w-16 h-16 mx-auto text-neutral-400" />
                  <p className="text-neutral-300 font-semibold">{file.name}</p>
                  <audio ref={mediaRef} controls src={url} loop={loop} onLoadedMetadata={(e) => { e.currentTarget.playbackRate = rate; }} onError={() => setCannotPlay(true)} className="w-full" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700" data-player-controls>
                <span>Speed</span>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => <button key={r} type="button" onClick={() => setSpeed(r)} aria-pressed={rate === r} className={'px-2 py-1 rounded border ' + (rate === r ? 'bg-indigo-600 text-white border-indigo-600' : 'border-neutral-300')}>{r}×</button>)}
                <label className="flex items-center gap-1 ml-2"><input id="mp-loop" type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop</label>
                {isVideo && <>
                  {typeof document !== 'undefined' && document.pictureInPictureEnabled && <button type="button" onClick={() => mediaRef.current?.requestPictureInPicture?.().catch(() => {})} className="px-2 py-1 rounded border border-neutral-300">Picture in picture</button>}
                  <button type="button" onClick={snapshot} className="px-2 py-1 rounded border border-neutral-300">Save this frame</button>
                  <label className="px-2 py-1 rounded border border-neutral-300 cursor-pointer">Subtitles (.srt, .vtt)<input type="file" accept=".srt,.vtt,text/vtt" className="hidden" onChange={loadSubs} /></label>
                </>}
              </div>
              {shot && <div className="space-y-1"><img src={shot} alt="Saved frame" className="max-h-40 mx-auto rounded" /><FileDownload href={shot} name={(file?.name || 'video').replace(/\.[^.]+$/, '') + '-frame.png'} /></div>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Media Player"
        description={`Media Player opens one audio or video file from your device in the player built into your browser. Below it you can set the speed from 0.5× to 2× and turn on "Loop". For a video you can also open a picture-in-picture window where the browser offers it, save the current frame as a PNG, and add subtitles from an .srt or .vtt file; a subtitle file that is not UTF-8 is read in the usual Windows code page of your browser's language. It plays what your browser can decode; for a file it cannot decode, it says so and links to Video Converter or Audio Converter. It does not make playlists.`}
        howToTitle="How to play an audio or video file"
        howTo={[
          `Pick or drop an audio or video file.`,
          `Use the player's controls, and choose a "Speed" or tick "Loop".`,
          `For a video, click "Subtitles (.srt, .vtt)" to add a subtitle file, or "Picture in picture" to keep it on top.`,
          `Click "Save this frame", then "Download" to save the picture as a PNG.`,
        ]}
        specs={[
          { label: `Input formats`, value: `Audio: MP3, WAV, M4A, AAC, FLAC, OGG, OGA, Opus, WMA, AIFF, AIF, AMR, MKA, WEBA, CAF. Video: MP4, M4V, MOV, QT, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS. Playback depends on your browser.` },
          { label: `Subtitles`, value: `SRT or WebVTT, for videos` },
          { label: `Saved frame`, value: `PNG at the video's size; on iPhone and iPad, scaled down to fit 16.7 megapixels` },
        ]}
        privacy={`The file is opened from your device through a local blob: address and played by your browser; it is not uploaded or streamed from a server. Subtitles are converted and frames are drawn in the same tab, and the speed, loop and picture-in-picture buttons only act on the player.`}
        faqs={[
          { q: `Can it play AVI, WMV or MKV files?`, a: `Yes, if your browser can decode them. When it cannot, the page says "This browser cannot play" this file and links to Video Converter or Audio Converter, so you can make an MP4 or MP3 first.` },
          { q: `Can I add subtitles to a video?`, a: `Yes: click "Subtitles (.srt, .vtt)" and pick the file. SRT timings are rewritten as WebVTT, one-digit hours included. A file that is not UTF-8 is read in the Windows code page of your browser's language, such as Windows-1252 for Western languages.` },
          { q: `Can I save a still image from a video?`, a: `Yes. Pause where you want, click "Save this frame" and download the PNG. It has the video's own size, except on iPhone and iPad, where a picture over 16.7 megapixels is scaled down to fit the browser's canvas limit.` },
          { q: `Can I play several files in a row?`, a: `No. The player holds one file at a time; choosing another file replaces it and clears the subtitles and the saved frame of the previous one. To hear several tracks back to back, join them first with Audio Merger.` },
        ]}
        tips={[
          `Tick "Loop" and choose 0.75× to practise a passage of music or a dance step.`,
          `Load the .srt you made in Subtitle Generator here to check its timings against the video.`,
        ]}
      />
    </div>
  );
}