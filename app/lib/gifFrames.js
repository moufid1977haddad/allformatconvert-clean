// Full frames of an animated GIF (29/09), shared by GIF to APNG and GIF to PNG.
//
// GIF to APNG pasted each frame with putImageData, which REPLACES pixels:
// the transparent pixels an optimised GIF uses to mean "unchanged since the
// previous frame" punched holes in every frame after the first. Disposal 3
// ("restore to previous") was not handled either. Here each frame is drawn
// with drawImage (alpha compositing, as a GIF decoder does), and the three
// disposal methods of the GIF89a spec are applied.

import { maxCanvasPixels } from './canvasLimit';

export async function gifFrames(arrayBuffer) {
  const { parseGIF, decompressFrames } = await import('gifuct-js');
  const gif = parseGIF(arrayBuffer);
  const raw = decompressFrames(gif, true);
  const width = gif.lsd.width;
  const height = gif.lsd.height;
  // P31: a GIF larger than the device's canvas (iPhone / iPad: 16.7 MP) would come out blank: say so instead.
  if (width * height > maxCanvasPixels()) throw new Error(`This GIF is ${width} × ${height} pixels, more than this device can draw (${Math.round(maxCanvasPixels() / 1e6)} megapixels at most). Use a computer for this file.`);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const patchCanvas = document.createElement('canvas');
  const pctx = patchCanvas.getContext('2d');
  const frames = [];
  for (const f of raw) {
    const { dims, patch, delay, disposalType } = f;
    const before = disposalType === 3 ? ctx.getImageData(0, 0, width, height) : null;
    patchCanvas.width = dims.width;
    patchCanvas.height = dims.height;
    const img = pctx.createImageData(dims.width, dims.height);
    img.data.set(patch);
    pctx.putImageData(img, 0, 0);
    ctx.drawImage(patchCanvas, dims.left, dims.top);
    frames.push({ imageData: ctx.getImageData(0, 0, width, height), delay: delay || 100 });
    if (disposalType === 2) ctx.clearRect(dims.left, dims.top, dims.width, dims.height);
    else if (disposalType === 3 && before) ctx.putImageData(before, 0, 0);
  }
  return { width, height, frames };
}
