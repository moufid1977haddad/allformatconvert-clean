import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "GIF to MP4 — Convert Your Gif's Full Animation Online Free" },
  description: "GIF to MP4 converts your GIF's full animation into a real MP4 (H.264) video, using ffmpeg.wasm entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-mp4" },
  openGraph: {
    title: "GIF to MP4 — Convert Your Gif's Full Animation Online Free",
    description: "GIF to MP4 converts your GIF's full animation into a real MP4 (H.264) video, using ffmpeg.wasm entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/gif-to-mp4",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
