import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Splitter — Cut an Audio File Online Free" },
  description: "Audio Splitter cuts an audio file at the point you choose, into equal parts or every N seconds, using ffmpeg.wasm in your browser — nothing is uploaded, except for Opus output, which our own server encodes and then deletes.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-splitter" },
  openGraph: {
    title: "Audio Splitter — Cut an Audio File Online Free",
    description: "Audio Splitter cuts an audio file at the point you choose, into equal parts or every N seconds, using ffmpeg.wasm in your browser — nothing is uploaded, except for Opus output, which our own server encodes and then deletes.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-splitter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
