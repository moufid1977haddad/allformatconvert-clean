import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Trimmer — Cut a Section Online Free" },
  description: "Video Trimmer cuts a section from your video by playing it and re-recording just that range using the browser's native MediaRecorder API, entirely…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-trimmer" },
  openGraph: {
    title: "Video Trimmer — Cut a Section Online Free",
    description: "Video Trimmer cuts a section from your video by playing it and re-recording just that range using the browser's native MediaRecorder API, entirely…",
    url: "https://www.onlineconvertools.com/tools/video-tools/video-trimmer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
