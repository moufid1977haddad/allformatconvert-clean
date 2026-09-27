// Decodes any audio file to an AudioBuffer. The browser's own decoder first (fast); when it cannot read the format
// (WMA, AC3, AMR… in every browser; Opus/FLAC in some older Safari), ffmpeg.wasm turns the file into a WAV that
// every browser decodes. Found 28/09/2026: Audio Waveform and Audio Equalizer accepted these files (their pickers
// list them) and then failed with "Unable to decode audio data".
export async function decodeAnyAudio(file, audioCtx) {
  try {
    return await audioCtx.decodeAudioData(await file.arrayBuffer());
  } catch (first) {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const ffmpeg = new FFmpeg();
    try {
      await ffmpeg.load();
      await ffmpeg.createDir('/in');
      await ffmpeg.mount('WORKERFS', { files: [file] }, '/in'); // read from disk, not copied
      await ffmpeg.exec(['-v', 'error', '-i', '/in/' + file.name, '-vn', '-c:a', 'pcm_f32le', '/out.wav']);
      const wav = await ffmpeg.readFile('/out.wav');
      if (!wav.length) throw first;
      return await audioCtx.decodeAudioData(wav.buffer);
    } catch {
      throw first; // neither could read it: the browser's own message
    } finally {
      ffmpeg.terminate();
    }
  }
}
