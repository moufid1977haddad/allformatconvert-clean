import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Watermark — Thi Tool Captures a Still Frame Online" },
  description: "This tool captures a still frame from your video with a text watermark burned in, producing a downloadable PNG image — not a watermarked video file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-watermark" },
  openGraph: {
    title: "Video Watermark — Thi Tool Captures a Still Frame Online",
    description: "This tool captures a still frame from your video with a text watermark burned in, producing a downloadable PNG image — not a watermarked video file.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-watermark",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
