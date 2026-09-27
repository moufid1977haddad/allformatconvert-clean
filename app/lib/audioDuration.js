// Length of an audio file read by ffmpeg.wasm, for the formats the browser's own player cannot read (WMA, AC3, AMR…
// in every browser; more in Safari). Tools used to take the length from an <audio> element only: for those formats
// its events never came, the controls never appeared and nothing was said (found 27-28/09/2026).
// Returns the length in seconds; throws when the file has no audio (or, with {video: true}, no video) ffmpeg can read.
// Video Trimmer uses it too (28/09/2026): MKV, AVI, WMV, FLV… were accepted, but no browser previews them, so the
// start/end controls never appeared although ffmpeg.wasm can cut them.
export async function ffmpegAudioDuration(file, { video = false } = {}) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile } = await import('@ffmpeg/util');
  const ffmpeg = new FFmpeg();
  const log = [];
  ffmpeg.on('log', ({ message }) => log.push(message));
  try {
    await ffmpeg.load();
    const raw = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'dat';
    const name = 'probe.' + (/^[a-z0-9]{1,10}$/.test(raw) ? raw : 'dat');
    await ffmpeg.writeFile(name, await fetchFile(file));
    await ffmpeg.exec(['-hide_banner', '-i', name]).catch(() => {}); // no output: only prints the streams
    const report = log.join(' ');
    if (!(video ? /Video:/ : /Audio:/).test(report)) throw new Error(video ? 'no video stream' : 'no audio stream');
    const m = report.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
    let seconds = m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
    if (!seconds) { // no length in the header: decode it to the end
      log.length = 0;
      await ffmpeg.exec(['-i', name, ...(video ? ['-an'] : ['-vn']), '-f', 'null', '-']).catch(() => {});
      const times = [...log.join(' ').matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)];
      const last = times[times.length - 1];
      seconds = last ? +last[1] * 3600 + +last[2] * 60 + +last[3] : 0;
    }
    if (!seconds) throw new Error('unknown length');
    return seconds;
  } finally {
    ffmpeg.terminate();
  }
}
