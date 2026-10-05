import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Video Rotator — Rotate Your Video Online Free" },
  description: "Rotate a video 90°, 180° or 270°: turned picture that plays upright in every player, or instant lossless rotation for MP4 and MOV. Free, full resolution.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-rotator" },
  openGraph: {
    title: "Video Rotator — Rotate Your Video Online Free",
    description: "Rotate a video 90°, 180° or 270°: turned picture that plays upright in every player, or instant lossless rotation for MP4 and MOV. Free, full resolution.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-rotator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/video-tools/video-rotator">{children}</ToolSeo>;
}
