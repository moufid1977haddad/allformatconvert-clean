import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Tools — Convert, Compress, and Edit Audio Files Online" },
  description: "Audio Tools is a free online platform offering utilities to enhance, convert, and edit sound files without any software installation.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools" },
  openGraph: {
    title: "Audio Tools — Convert, Compress, and Edit Audio Files Online",
    description: "Audio Tools is a free online platform offering utilities to enhance, convert, and edit sound files without any software installation.",
    url: "https://www.onlineconvertools.com/tools/audio-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
