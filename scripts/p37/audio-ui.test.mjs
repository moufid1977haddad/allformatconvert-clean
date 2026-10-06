// P37 lot 1, bugs 4, 5 (and the same defect in Video Trimmer): text the page really shows / announces.
//  - Audio Compressor wrote "1.2 MB MB" (formatBytes already gives the unit) and "500 KB MB".
//  - Audio Equalizer's three sliders were all named ": dB" for screen readers; Video Trimmer's "Start: s" / "End: s".
// The JSX lines are read from the page and their expressions filled in with real values.
// Run: node scripts/p37/audio-ui.test.mjs  |  SRC_REV=HEAD node scripts/p37/audio-ui.test.mjs
import { load, source, check, done } from './lot1-load.mjs';

const { formatBytes } = await load('app/lib/formatBytes.js');

// --- Audio Compressor: sizes as displayed
const comp = source('app/tools/audio-tools/audio-compressor/page.jsx');
for (const [label, orig, compd] of [['5.2 MB -> 1.2 MB', 5_151_217, 1_234_567], ['800 KB -> 500 KB', 800_000, 500_000]]) {
  const values = { 'result.originalSize': formatBytes(orig), 'result.newSize': formatBytes(compd) };
  const shown = comp.split(/\r?\n/).filter((l) => /result\.(originalSize|newSize)/.test(l) && !/setResult/.test(l))
    .map((l) => l.replace(/\{(result\.(?:originalSize|newSize))\}/g, (_, k) => values[k]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const bad = shown.filter((t) => /\b(B|KB|MB|GB) (KB|MB|GB)\b/.test(t));
  check(`Audio Compressor ${label}: every size has one unit`, shown.length >= 3 && bad.length === 0, bad.length ? bad.join(' | ') : shown.join(' | '));
}

// --- accessible names of range sliders: must not be empty around the label (": dB", "Start: s")
function sliderNames(src, values) {
  const out = [];
  for (const m of src.matchAll(/<input\s+aria-label=(\{`([^`]*)`\}|"([^"]*)")[^>]*type="range"/g)) {
    const raw = m[2] ?? m[3];
    for (const v of values) out.push(raw.replace(/\$\{label\}/g, v));
  }
  return out;
}
const eq = source('app/tools/audio-tools/audio-equalizer/page.jsx');
const eqNames = sliderNames(eq, ['Bass', 'Mid', 'Treble']);
check('Audio Equalizer: 3 sliders named after their band', eqNames.length === 3 && ['Bass', 'Mid', 'Treble'].every((b, i) => eqNames[i].startsWith(b)) && new Set(eqNames).size === 3, eqNames.join(' | '));
const tr = source('app/tools/video-tools/video-trimmer/page.jsx');
const trNames = [...tr.matchAll(/aria-label="([^"]*)" type="range"/g)].map((m) => m[1]);
check('Video Trimmer: Start / End sliders have a full name', trNames.length === 2 && trNames.every((n) => /^(Start|End) \(seconds\)$/.test(n)), trNames.join(' | '));
done('audio-ui');
