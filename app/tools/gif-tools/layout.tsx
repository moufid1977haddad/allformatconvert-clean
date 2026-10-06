import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "GIF Tools: Video to GIF, GIF Maker and GIF Compressor" },
  description: "Make a GIF from up to 60 seconds of MP4, MOV, WebM or AVI video, animate images, compress GIFs and convert them to MP4 or APNG.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools" },
  openGraph: {
    title: "GIF Tools: Video to GIF, GIF Maker and GIF Compressor",
    description: "Make a GIF from up to 60 seconds of MP4, MOV, WebM or AVI video, animate images, compress GIFs and convert them to MP4 or APNG.",
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
