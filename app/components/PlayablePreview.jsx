'use client';
import { useEffect, useState } from 'react';

// A result's player, or — when this browser cannot play the format — a plain sentence instead of a broken player
// (28/09, owner on Safari macOS: Opus results showed a player marked "Error"). Decided by the browser itself:
// canPlayType() for the exact type first (never the user-agent), then the element's own error as a safety net.
// CloudConvert, FreeConvert and Convertio show no preview at all; this shows one whenever it can play, and says
// honestly when it cannot. Audio Merger's wording, now shared by every audio and video tool.
const TYPES = {
  mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', ogg: 'audio/ogg; codecs="vorbis"', oga: 'audio/ogg',
  opus: 'audio/ogg; codecs="opus"', m4a: 'audio/mp4; codecs="mp4a.40.2"', aac: 'audio/aac', m4r: 'audio/mp4',
  alac: 'audio/mp4; codecs="alac"', wma: 'audio/x-ms-wma', ac3: 'audio/ac3', aiff: 'audio/aiff', aif: 'audio/aiff',
  caf: 'audio/x-caf', amr: 'audio/amr', weba: 'audio/webm; codecs="opus"', mka: 'audio/x-matroska',
  mp4: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', m4v: 'video/mp4', mov: 'video/quicktime',
  webm: 'video/webm; codecs="vp9, opus"', mkv: 'video/x-matroska', avi: 'video/x-msvideo', wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv', ogv: 'video/ogg; codecs="theora"', '3gp': 'video/3gpp', mpg: 'video/mpeg', mpeg: 'video/mpeg', ts: 'video/mp2t',
};
const NAMES = { opus: 'Opus', webm: 'WebM', weba: 'WebM audio', flac: 'FLAC', alac: 'ALAC', aiff: 'AIFF', aif: 'AIFF', mkv: 'MKV', mka: 'MKA' };
const extOf = (name = '') => (name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
export const formatLabel = (name) => { const e = extOf(name); return NAMES[e] || e.toUpperCase() || 'this'; };

/** '' | 'maybe' | 'probably' from the browser, for a file name (or an explicit type). */
export function canPlay(kind, name, type) {
  if (typeof document === 'undefined') return 'maybe';
  const t = type || TYPES[extOf(name)];
  if (!t) return 'maybe'; // unknown: let the element try, its error decides
  return document.createElement(kind).canPlayType(t);
}

export default function PlayablePreview({ src, name, kind, type, className = 'w-full', ...rest }) {
  const k = kind || (/^video\//.test(type || TYPES[extOf(name)] || '') ? 'video' : 'audio');
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(canPlay(k, name, type) === ''); }, [k, name, type, src]);
  if (!src) return null;
  if (bad) {
    const label = formatLabel(name);
    return <p className="text-sm text-neutral-600 text-center" data-no-preview data-testid="no-preview">Your browser can&apos;t play {label} files, so there is no preview — the downloaded file is complete and plays in apps that support {label}.</p>;
  }
  const Tag = k;
  return <Tag controls playsInline={k === 'video' ? true : undefined} src={src} className={className} onError={() => setBad(true)} data-preview={k} {...rest} />;
}
