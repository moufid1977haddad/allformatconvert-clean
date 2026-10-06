// P37: the waiting time shown next to Video Watermark's progress bar. It was (1 - progress) × the video's length, the
// seconds of VIDEO still to encode: a 60-second clip showed "60s" at the start, while ffmpeg.wasm takes about 3.7 s
// per second of 1080p video in Chrome and about 29 s in Firefox (measured 28/09). The estimate now comes from the
// speed really measured in this tab: time spent so far × what is left / what is done. Nothing is shown until the
// measure means something (at least 3 % done and 3 seconds spent), and no figure is ever guessed. Pure, tested in
// node: scripts/p37/video-watermark.test.mjs.
export const ETA_MIN_PROGRESS = 0.03;
export const ETA_MIN_ELAPSED_S = 3;

/** Seconds left (whole number), or null while there is not enough to measure. `progress` 0..1, `elapsedS` seconds. */
export function encodeSecondsLeft(progress, elapsedS) {
  const p = Number(progress), t = Number(elapsedS);
  if (!Number.isFinite(p) || !Number.isFinite(t) || p < ETA_MIN_PROGRESS || t < ETA_MIN_ELAPSED_S) return null;
  if (p >= 1) return 0;
  return Math.max(0, Math.round((t * (1 - p)) / p));
}

/** "about 45 s left", "about 3 min 20 s left" */
export function formatSecondsLeft(s) {
  if (s === null || s === undefined) return '';
  if (s === 0) return 'almost done';
  if (s < 60) return `about ${s} s left`;
  const m = Math.floor(s / 60), r = s % 60;
  return `about ${m} min${r ? ` ${r} s` : ''} left`;
}
