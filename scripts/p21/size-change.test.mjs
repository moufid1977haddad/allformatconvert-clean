// P21 (02/10): a converted file larger than the original is explained, never shown as a failure.
import assert from 'node:assert/strict';
import { whyLarger, sizeChangeText, formatKey } from '../../app/lib/sizeChange.js';
const cases = [
  [{ from: 'photo.jpg', to: 'photo.png', inBytes: 1e6, outBytes: 5.43e6 }, /lossless/],
  [{ from: 'IMG_0001.HEIC', to: 'IMG_0001.jpg', inBytes: 2e6, outBytes: 4e6 }, /HEIC stores the same picture in fewer bytes than JPG/],
  [{ from: 'a.webp', to: 'a.jpg', inBytes: 1e5, outBytes: 2e5 }, /WebP stores/],
  [{ from: 'a.jpg', to: 'a.jpg', inBytes: 1e5, outBytes: 2e5 }, /already more compressed/],
  [{ from: 'a.jpg', to: 'a.gif', inBytes: 1e5, outBytes: 3e5 }, /256 colours/],
  [{ from: 'clip.mp4', to: 'clip.gif', inBytes: 1e6, outBytes: 9e6, kind: 'video' }, /every frame/],
  [{ from: 'a.png', to: 'a.bmp', inBytes: 1e5, outBytes: 9e5 }, /Both formats are lossless/],
  [{ from: 'a.jpg', to: 'a.ico', inBytes: 1e4, outBytes: 9e4 }, /several sizes/],
  [{ from: 'song.mp3', to: 'song.wav', inBytes: 3e6, outBytes: 3e7, kind: 'audio' }, /lossless.*MP3, M4A or Opus/],
  [{ from: 'clip.mov', to: 'clip.mp4', inBytes: 1e7, outBytes: 2e7, kind: 'video' }, /HEVC/],
];
for (const [args, re] of cases) assert.match(whyLarger(args), re, JSON.stringify(args));
assert.equal(whyLarger({ from: 'a.png', to: 'a.jpg', inBytes: 5e6, outBytes: 1e6 }), null);
assert.equal(whyLarger({ from: 'a.jpg', to: 'a.png', inBytes: 1000, outBytes: 1004 }), null); // rounds to 0 %
for (const [args] of cases) assert.doesNotMatch(whyLarger(args), /Nothing was lost/.test(whyLarger(args)) && /gif|ico/i.test(args.to) ? /./ : /^$/);
assert.equal(sizeChangeText(1000, 5430), ' (443% larger)');
assert.equal(sizeChangeText(1000, 500), ' (50% smaller)');
assert.equal(formatKey('image/jpeg'), 'jpg');
console.log('size-change: all passed');
