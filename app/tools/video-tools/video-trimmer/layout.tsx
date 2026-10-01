import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Trimmer — Cut a Section Online Free" },
  description: "Video Trimmer cuts a section from your video in your browser without re-encoding it, so the cut takes seconds and keeps your original quality and format (MP4, MOV, WebM, MKV); a Precise cut may send just the cut part to our own video service to re-encode it.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools/video-trimmer" },
  openGraph: {
    title: "Video Trimmer — Cut a Section Online Free",
    description: "Video Trimmer cuts a section from your video in your browser without re-encoding it, so the cut takes seconds and keeps your original quality and format (MP4, MOV, WebM, MKV); a Precise cut may send just the cut part to our own video service to re-encode it.",
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
