import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Compressor — Compress Audio Online Free" },
  description: "Audio Compressor reduces an audio file's size by re-encoding it at a lower bitrate (64–320 kbps) using ffmpeg.wasm, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-compressor" },
  openGraph: {
    title: "Audio Compressor — Compress Audio Online Free",
    description: "Audio Compressor reduces an audio file's size by re-encoding it at a lower bitrate (64–320 kbps) using ffmpeg.wasm, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-compressor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
