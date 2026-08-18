import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Screen Recorder — Record Screens Online Free" },
  description: "Screen Recorder captures your screen, window, or browser tab using the browser's built-in screen-sharing and MediaRecorder APIs — entirely client-side,…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/screen-recorder" },
  openGraph: {
    title: "Screen Recorder — Record Screens Online Free",
    description: "Screen Recorder captures your screen, window, or browser tab using the browser's built-in screen-sharing and MediaRecorder APIs — entirely client-side,…",
    url: "https://www.onlineconvertools.com/tools/video-tools/screen-recorder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
