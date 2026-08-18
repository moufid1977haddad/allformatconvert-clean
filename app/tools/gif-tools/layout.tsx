import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "GIF Tools — Convert Videos and Images to GIF Format Online" },
  description: "Gif Tools is a free online platform that allows users to create, edit, compress, and convert GIF files without any software installation or subscription…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools" },
  openGraph: {
    title: "GIF Tools — Convert Videos and Images to GIF Format Online",
    description: "Gif Tools is a free online platform that allows users to create, edit, compress, and convert GIF files without any software installation or subscription…",
    url: "https://www.onlineconvertools.com/tools/gif-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
