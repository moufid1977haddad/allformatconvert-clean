'use client';
import { useEffect, useState } from 'react';
import { animationOf } from '../lib/animatedImage';

// P24 (03/10): said before the work starts, on every canvas filter — an animated GIF, APNG or WebP comes out
// as its first frame only (these tools draw one picture).
export default function AnimatedImageNote({ file }) {
  const [kind, setKind] = useState(null);
  useEffect(() => {
    let live = true;
    setKind(null);
    animationOf(file).then((k) => { if (live) setKind(k); }, () => {});
    return () => { live = false; };
  }, [file]);
  if (!kind) return null;
  return (
    <p role="status" data-animated-note className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      This {kind} is animated: the result will hold its first frame only, as a still image.
      {kind === 'GIF' ? ' To keep the animation, use our GIF Compressor (it can also resize every frame).' : ''}
    </p>
  );
}
