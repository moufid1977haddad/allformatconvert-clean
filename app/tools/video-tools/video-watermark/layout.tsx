import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Watermark — Add a Text or Image Watermark to Video" },
  description: "Burns a text or image watermark into your video and exports a real watermarked .mp4 file, entirely in your browser via ffmpeg.wasm — no upload. Videos up to 2 minutes; original audio is preserved.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-watermark" },
  openGraph: {
    title: "Video Watermark — Add a Text or Image Watermark to Video",
    description: "Burns a text or image watermark into your video and exports a real watermarked .mp4 file, entirely in your browser via ffmpeg.wasm — no upload. Videos up to 2 minutes; original audio is preserved.",
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
