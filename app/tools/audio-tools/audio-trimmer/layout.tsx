import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Trimmer — Cut a Section Out Online Free" },
  description: "Audio Trimmer cuts a section out of an audio file using ffmpeg.wasm's fast stream-copy trimming, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-trimmer" },
  openGraph: {
    title: "Audio Trimmer — Cut a Section Out Online Free",
    description: "Audio Trimmer cuts a section out of an audio file using ffmpeg.wasm's fast stream-copy trimming, entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-trimmer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
