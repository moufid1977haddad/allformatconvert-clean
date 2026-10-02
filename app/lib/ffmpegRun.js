// P24 (03/10): ffmpeg.wasm's exec() resolves even when ffmpeg fails — it returns ffmpeg's exit code. A run that failed
// half-way can leave a partial or empty output, or none, and Audio Booster's normalisation showed nothing at all when
// its filter chain failed. Every run whose output is handed to the visitor goes through this: a non-zero exit code is an
// error, with a sentence the visitor can act on.
export async function execChecked(ffmpeg, args, message = 'ffmpeg could not process this file with these settings.') {
  const code = await ffmpeg.exec(args);
  if (code !== 0) throw new Error(message);
  return code;
}
