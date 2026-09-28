// Placing an image on a PDF page as the reader SEES the page (audit 2, 29/09, PDF Sign).
// Before, the signature was put at (width - 220, 50) of the MediaBox: outside the visible area when the page has a
// CropBox elsewhere, and on a page displayed rotated (/Rotate 90, 180, 270) in another corner and turned sideways.

// box: the page's CropBox { x, y, width, height }; rotation: /Rotate; (vx, vy): lower-left corner of the image in
// visible coordinates (origin at the visible bottom-left, in points). Returns { x, y, rotate } for pdf-lib's drawImage
// (rotate in degrees, counter-clockwise), so that the image appears upright at that place.
export function placeOnVisiblePage(box, rotation, vx, vy) {
  const r = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  const W = box.width, H = box.height;
  let x = vx, y = vy;
  if (r === 90) { x = W - vy; y = vx; }
  else if (r === 180) { x = W - vx; y = H - vy; }
  else if (r === 270) { x = vy; y = H - vx; }
  return { x: box.x + x, y: box.y + y, rotate: r };
}

// Width and height of the page as displayed.
export function visibleSize(box, rotation) {
  const r = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  return r === 90 || r === 270 ? { width: box.height, height: box.width } : { width: box.width, height: box.height };
}
