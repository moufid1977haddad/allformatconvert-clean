// Browser-side preparation of an image for the vision model.
//
// The vision model works on a reduced image anyway (OpenAI downsizes to at most 2048 px on the longest side
// in "high" detail), so the original never needs to leave the device: it is decoded and scaled here, and only
// a JPEG of a few hundred KB is sent. This is what removes the old ~3 MiB source ceiling of image-captioner
// (base64 inside a Vercel-limited JSON body) without sending more data and without losing what the model sees.
// Same idea as the background remover, which resizes to the model's own input size in the browser.

export const VISION_MAX_SIDE = 2048;
const JPEG_QUALITY = 0.85;

async function decode(file) {
  // createImageBitmap decodes off the main thread and does not keep a second full-size copy around.
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fall back to <img> below */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // the decoded image stays valid after the URL is revoked
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {File} file any image the browser can decode
 * @returns {Promise<{base64: string, width: number, height: number, bytes: number}>} JPEG, longest side <= 2048
 * @throws {Error} with a message safe to show as is
 */
export async function imageToVisionJpeg(file) {
  let src;
  try {
    src = await decode(file);
  } catch {
    throw new Error('This image could not be read. It may be corrupt or in a format your browser cannot open.');
  }
  const w = src.naturalWidth || src.width;
  const h = src.naturalHeight || src.height;
  if (!w || !h) throw new Error('This image could not be read. It may be corrupt or in a format your browser cannot open.');
  const scale = Math.min(1, VISION_MAX_SIDE / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  // JPEG has no alpha: transparent PNG/WebP areas would turn black
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, cw, ch);
  if (typeof src.close === 'function') src.close();
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  // a browser that cannot encode JPEG answers PNG: never announce success on a wrong or empty output
  if (!dataUrl.startsWith('data:image/jpeg;base64,') || dataUrl.length < 200) {
    throw new Error('Your browser could not prepare this image. Please try another browser or a smaller image.');
  }
  const base64 = dataUrl.slice('data:image/jpeg;base64,'.length);
  return { base64, width: cw, height: ch, bytes: Math.floor((base64.length * 3) / 4) };
}
