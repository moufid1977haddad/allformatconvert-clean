import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Subtitle Generator — Be a Manual SRT Subtitle Builder Online" },
  description: "Subtitle Generator is a manual SRT subtitle builder — add rows with your own start time, end time, and text for each line, and it assembles a standard .srt…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/subtitle-generator" },
  openGraph: {
    title: "Subtitle Generator — Be a Manual SRT Subtitle Builder Online",
    description: "Subtitle Generator is a manual SRT subtitle builder — add rows with your own start time, end time, and text for each line, and it assembles a standard .srt…",
    url: "https://www.onlineconvertools.com/tools/video-tools/subtitle-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
