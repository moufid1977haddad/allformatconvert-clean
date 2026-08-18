import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Booster — Amplify an Audio File's Volume Online Free" },
  description: "Audio Booster amplifies an audio file's volume using a simple gain multiplier (1x–5x), processed entirely in your browser via ffmpeg.wasm (WebAssembly)…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-booster" },
  openGraph: {
    title: "Audio Booster — Amplify an Audio File's Volume Online Free",
    description: "Audio Booster amplifies an audio file's volume using a simple gain multiplier (1x–5x), processed entirely in your browser via ffmpeg.wasm (WebAssembly)…",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-booster",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
