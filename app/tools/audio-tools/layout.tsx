import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Tools: Convert, Trim, Merge and Transcribe Audio" },
  description: "11 audio tools to convert, compress, trim, split, merge, boost and record. Editing runs in your browser; Opus output and transcription use a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools" },
  openGraph: {
    title: "Audio Tools: Convert, Trim, Merge and Transcribe Audio",
    description: "11 audio tools to convert, compress, trim, split, merge, boost and record. Editing runs in your browser; Opus output and transcription use a server.",
    url: "https://www.onlineconvertools.com/tools/audio-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
