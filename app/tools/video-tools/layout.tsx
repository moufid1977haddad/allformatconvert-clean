import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Video Tools — Convert, Compress, and Edit Videos Online Free" },
  description: "Video Tools is a free online platform offering video editing, conversion, and enhancement features accessible directly from your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/video-tools" },
  openGraph: {
    title: "Video Tools — Convert, Compress, and Edit Videos Online Free",
    description: "Video Tools is a free online platform offering video editing, conversion, and enhancement features accessible directly from your browser.",
    url: "https://www.onlineconvertools.com/tools/video-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
