// One full-canvas RGBA frame into a gifenc encoder, keeping transparency (audit 2, 29/09).
// gifenc's quantize() defaults to rgb565, which ignores alpha: every transparent pixel was written with its RGB value
// (black for a canvas or an APNG), so transparent PNG/APNG sources came out on a black background. Here pixels with
// alpha < 128 (GIF has 1-bit transparency) get their own palette index, declared transparent in the Graphic Control
// Extension, and the other pixels are quantized to at most 255 colours.
// When any frame of an animation has transparency, every frame must use disposal 2 ("restore to background"):
// otherwise the previous frame shows through the transparent pixels of the next one.

export function hasTransparency(rgba) {
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 128) return true;
  return false;
}

// gif: GIFEncoder(); lib: the gifenc module; rgba: Uint8Array / Uint8ClampedArray (w*h*4).
// opts: { delay (ms), repeat (first frame only: 0 = forever, -1 = play once, n = n more times), dispose }
export function writeRgbaFrame(gif, lib, rgba, w, h, { delay = 0, repeat, dispose = -1 } = {}) {
  const extra = { delay, dispose, ...(repeat !== undefined ? { repeat } : {}) };
  if (!hasTransparency(rgba)) {
    const palette = lib.quantize(rgba, 256);
    gif.writeFrame(lib.applyPalette(rgba, palette), w, h, { palette, ...extra });
    return;
  }
  // Transparent pixels take the colour of an opaque one so they cost no palette entry.
  const data = new Uint8Array(rgba);
  let fill = null;
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 128) { fill = [data[i], data[i + 1], data[i + 2]]; break; }
  fill = fill || [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) { data[i] = fill[0]; data[i + 1] = fill[1]; data[i + 2] = fill[2]; }
    data[i + 3] = 255;
  }
  const palette = lib.quantize(data, 255);
  const index = lib.applyPalette(data, palette);
  const transparentIndex = palette.length;
  palette.push([0, 0, 0]);
  for (let p = 0; p < index.length; p++) if (rgba[p * 4 + 3] < 128) index[p] = transparentIndex;
  gif.writeFrame(index, w, h, { palette, transparent: true, transparentIndex, ...extra });
}
