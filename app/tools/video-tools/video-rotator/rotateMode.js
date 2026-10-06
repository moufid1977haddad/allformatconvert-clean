// Which way Video Rotator turns a file (pure, tested in node: scripts/p37/video-rotator.test.mjs).
// Only MP4 / MOV / M4V / 3GP / 3G2 have a rotation setting, so only they offer "Instant, lossless".
export const ISO_BMFF = /\.(mp4|mov|m4v|3gp|3g2)$/i;

// P37: the choice was kept when another file was picked. After an MP4 set to "Instant, lossless", a WebM (where the
// choice is hidden) was refused with "Instant, lossless works for MP4, MOV, M4V and 3GP only", for a setting the
// visitor could no longer see or change. A file without a rotation setting is always turned "Compatible everywhere".
export function rotateModeFor(fileName, mode) {
  return ISO_BMFF.test(String(fileName || '')) && mode === 'lossless' ? 'lossless' : 'compatible';
}
