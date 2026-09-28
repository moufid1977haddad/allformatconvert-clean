// Builds fixtures/optimised.gif (29/09): 8x8, frame 1 all red; frame 2 stores
// ONLY the top-left pixel (blue), every other pixel is the transparent index,
// meaning "unchanged" (disposal 1) -- how GIF optimisers encode animations.
// A correct decoder shows frame 2 as red with one blue pixel.
// Run: node scripts/converter-tests/fixtures/make-optimised-gif.mjs
import gifenc from 'gifenc';
const { GIFEncoder } = gifenc;
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const palette = [[255, 0, 0], [0, 0, 255], [0, 0, 0]];
const W = 8, H = 8;
const gif = GIFEncoder();
gif.writeFrame(new Uint8Array(W * H).fill(0), W, H, { palette, delay: 100, dispose: 1 });
const f2 = new Uint8Array(W * H).fill(2);
f2[0] = 1;
gif.writeFrame(f2, W, H, { palette, delay: 100, transparent: true, transparentIndex: 2, dispose: 1 });
gif.finish();
const out = join(dirname(fileURLToPath(import.meta.url)), 'optimised.gif');
writeFileSync(out, gif.bytes());
console.log('written', out);
