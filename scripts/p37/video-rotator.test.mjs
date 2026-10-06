// P37 lot 1, bug 3: Video Rotator kept "Instant, lossless" after another file was picked. MP4 + "Instant, lossless",
// then a WebM (the choice is hidden for it): "Rotate Video" was refused with "Instant, lossless works for MP4, MOV,
// M4V and 3GP only", a setting the visitor could no longer see. Sequences of picks replayed with the page's own rules.
// Run: node scripts/p37/video-rotator.test.mjs  |  SRC_REV=HEAD node scripts/p37/video-rotator.test.mjs
import { load, source, check, done } from './lot1-load.mjs';

const page = source('app/tools/video-tools/video-rotator/page.jsx');
const ISO_BMFF = /\.(mp4|mov|m4v|3gp|3g2)$/i;
const fixed = /setMode\(\(m\) => rotateModeFor\(f\.name, m\)\)/.test(page) && /const how = rotateModeFor\(file\.name, mode\);/.test(page) && !/[^w] mode === 'lossless'/.test(page.slice(page.indexOf('const rotate = async'), page.indexOf('  return (')));
let rotateModeFor = (_name, mode) => mode; // before P37: the state is used as it is, and a pick leaves it untouched
if (fixed) ({ rotateModeFor } = await load('app/tools/video-tools/video-rotator/rotateMode.js'));
console.log(fixed ? 'page: mode reset on pick and checked at rotate time' : 'page: mode kept across picks');

// What rotate() does, with the guards of page.jsx (same order)
function rotateOutcome(fileName, modeState, flip = '') {
  const how = rotateModeFor(fileName, modeState);
  if (flip && how === 'lossless') return 'refused: mirror with lossless';
  if (how === 'lossless' && !ISO_BMFF.test(fileName)) return 'refused: hidden "Instant, lossless" on a file without rotation setting';
  return how === 'lossless' ? 'lossless in the browser' : 'turned on the video service';
}
function pickSequence(steps) {
  let mode = 'compatible', name = '';
  for (const step of steps) {
    if (step.pick) { name = step.pick; mode = rotateModeFor(name, mode); }
    if (step.choose) { if (ISO_BMFF.test(name)) mode = step.choose; } // the choice is only shown for ISO_BMFF files
  }
  return rotateOutcome(name, mode);
}

const CASES = [
  ['MP4 + lossless, then a WebM', [{ pick: 'a.mp4' }, { choose: 'lossless' }, { pick: 'b.webm' }], 'turned on the video service'],
  ['MOV + lossless, then an MKV', [{ pick: 'a.mov' }, { choose: 'lossless' }, { pick: 'b.mkv' }], 'turned on the video service'],
  ['MP4 + lossless, then another MP4 (choice visible, kept)', [{ pick: 'a.mp4' }, { choose: 'lossless' }, { pick: 'b.mp4' }], 'lossless in the browser'],
  ['WebM alone', [{ pick: 'b.webm' }], 'turned on the video service'],
  ['MP4 + lossless', [{ pick: 'a.mp4' }, { choose: 'lossless' }], 'lossless in the browser'],
];
for (const [label, steps, expected] of CASES) {
  const got = pickSequence(steps);
  check(`${label}: ${expected}`, got === expected, got);
}
// the radio shown after the last pick must match what rotate() uses (no hidden state)
if (fixed) check('state after a WebM pick is "compatible" (the radio group hidden for it says nothing else)', rotateModeFor('b.webm', 'lossless') === 'compatible');
done('video-rotator');
