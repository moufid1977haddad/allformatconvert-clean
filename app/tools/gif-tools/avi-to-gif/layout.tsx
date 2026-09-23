import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AVI to GIF — Convert a Video Clip to an Animated GIF" },
  description: "Convert a clip of your AVI video into an animated GIF: choose start, length up to 60 s, width and frame rate. Proportions kept, any browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/avi-to-gif" },
  openGraph: {
    title: "AVI to GIF — Convert a Video Clip to an Animated GIF",
    description: "Convert a clip of your AVI video into an animated GIF: choose start, length up to 60 s, width and frame rate. Proportions kept, any browser.",
    url: "https://www.onlineconvertools.com/tools/gif-tools/avi-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
