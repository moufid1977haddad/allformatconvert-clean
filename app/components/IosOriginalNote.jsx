'use client';
import { useEffect, useState } from 'react';

// iPhone / iPad only (28/09, measured by the owner: the same .MOV weighs 29.44 MB picked on a Mac, 9.88 MB picked from
// Photo Library on an iPhone). iOS re-encodes a video picked from Photo Library before the site receives it, and no
// HTML attribute prevents it (Apple Developer Forums 731042: the old `multiple` trick no longer works); a file picked
// with "Choose Files" (the Files app) arrives as it is. So the page says how to get the original there.
export function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function IosOriginalNote({ kind = 'video' }) {
  const [ios, setIos] = useState(false);
  useEffect(() => { setIos(isIos()); }, []);
  if (!ios) return null;
  return (
    <p className="text-xs text-neutral-600 bg-amber-50 border border-amber-200 rounded-lg p-2" data-ios-original-note>
      {kind === 'video'
        ? 'iPhone: a video picked from Photo Library reaches this page already shrunk by iOS. To use the original, first save it to Files (Photos › Share › Save to Files), then pick it here with Choose Files.'
        : 'iPhone: a photo picked from Photo Library reaches this page converted by iOS (HEIC becomes JPEG). To use the original file, first save it to Files (Photos › Share › Save to Files), then pick it here with Choose Files.'}
    </p>
  );
}
