import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Filter — Apply One Visual Effect (grayscale, Sepia," },
  description: "Video Filter applies one visual effect — Grayscale, Sepia, Invert, Blur, Brightness, Contrast, or Saturate — to your video, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-filter" },
  openGraph: {
    title: "Video Filter — Apply One Visual Effect (grayscale, Sepia,",
    description: "Video Filter applies one visual effect — Grayscale, Sepia, Invert, Blur, Brightness, Contrast, or Saturate — to your video, in your browser.",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-filter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
