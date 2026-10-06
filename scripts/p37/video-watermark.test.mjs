// P37 lot 1, bug 2: Video Watermark's time estimate was (1 - progress) × the video's length, i.e. the seconds of video
// still to encode, not the waiting time. Simulated encodes at the speeds measured on 28/09 (ffmpeg.wasm 1080p:
// ~3.7 s per second of video in Chrome, ~29 s in Firefox) and a fast 360p case (0.8 s/s): the estimate shown at 10 %,
// 25 %, 50 % and 75 % must be within 15 % of the real time left.
// Run: node scripts/p37/video-watermark.test.mjs  |  SRC_REV=HEAD node scripts/p37/video-watermark.test.mjs
import { load, source, check, done } from './lot1-load.mjs';

const page = source('app/tools/video-tools/video-watermark/page.jsx');
let estimate;
if (/setEta\(Math\.max\(0, Math\.round\(\(1 - clamped\) \* duration\)\)\)/.test(page)) {
  estimate = (p, _elapsed, videoS) => Math.max(0, Math.round((1 - p) * videoS)); // the formula in the page before P37
  console.log('page formula: (1 - progress) x video length');
} else {
  check('page uses encodeSecondsLeft from ./encodeEta', /setEta\(encodeSecondsLeft\(clamped, \(performance\.now\(\) - encodeStart\) \/ 1000\)\)/.test(page) && /encodeStart = performance\.now\(\);\r?\n\s*await ffmpeg\.exec\(\[/.test(page));
  const { encodeSecondsLeft } = await load('app/tools/video-tools/video-watermark/encodeEta.js');
  estimate = (p, elapsed) => encodeSecondsLeft(p, elapsed);
  console.log('page formula: elapsed x (1 - progress) / progress');
}

for (const [label, videoS, secPerSec] of [['60 s 1080p, Chrome', 60, 3.7], ['60 s 1080p, Firefox', 60, 29], ['120 s 360p, fast', 120, 0.8]]) {
  const total = videoS * secPerSec;
  for (const p of [0.1, 0.25, 0.5, 0.75]) {
    const elapsed = total * p, real = total - elapsed;
    const shown = estimate(p, elapsed, videoS);
    const ok = shown !== null && Math.abs(shown - real) <= real * 0.15;
    check(`${label}, ${p * 100} % done: real ${Math.round(real)} s left`, ok, `shown ${shown === null ? 'nothing' : shown + ' s'}`);
  }
}
if (!/\(1 - clamped\) \* duration/.test(page)) {
  const { encodeSecondsLeft, formatSecondsLeft } = await load('app/tools/video-tools/video-watermark/encodeEta.js');
  check('nothing shown before 3 % / 3 s (no guessed figure)', encodeSecondsLeft(0.01, 10) === null && encodeSecondsLeft(0.5, 1) === null && encodeSecondsLeft(NaN, 5) === null);
  check('labels', formatSecondsLeft(45) === 'about 45 s left' && formatSecondsLeft(200) === 'about 3 min 20 s left' && formatSecondsLeft(120) === 'about 2 min left' && formatSecondsLeft(0) === 'almost done', [45, 200, 120, 0].map(formatSecondsLeft).join(' | '));
}
done('video-watermark');
