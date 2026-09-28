// PDF Crop geometry (audit 2, 29/09).
// Before: the margins were taken from (0, 0) of the MediaBox. A page that already had a CropBox (a scan, an earlier
// crop) was un-cropped then cropped from the wrong edges, a MediaBox not starting at (0, 0) was cut in the wrong
// place, and on a page displayed rotated (/Rotate 90, 180, 270) "top" trimmed another side. Now the margins are the
// ones the reader SEES: taken from the visible box (CropBox, else MediaBox), mapped through the page's rotation.

// box: { x, y, width, height } (the current CropBox); rotation: /Rotate in degrees; m: { top, right, bottom, left }
// as seen on screen. Returns the new box, or null if the margins leave nothing of the page.
export function cropRect(box, rotation, m) {
  const r = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  // Unrotated side trimmed by each visible margin (the page is turned clockwise by r when displayed).
  const u = r === 90 ? { left: m.top, top: m.right, right: m.bottom, bottom: m.left }
    : r === 180 ? { top: m.bottom, bottom: m.top, left: m.right, right: m.left }
    : r === 270 ? { right: m.top, bottom: m.right, left: m.bottom, top: m.left }
    : { top: m.top, right: m.right, bottom: m.bottom, left: m.left };
  const width = box.width - u.left - u.right, height = box.height - u.top - u.bottom;
  if (!(width > 0) || !(height > 0)) return null;
  return { x: box.x + u.left, y: box.y + u.bottom, width, height };
}
