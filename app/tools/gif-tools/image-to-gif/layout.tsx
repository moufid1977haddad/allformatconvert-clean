import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image to GIF — Turn a Batch Online Free" },
  description: "Image to GIF turns a batch of photos already sitting on your device into one animated GIF file, processed entirely client-side with the gifenc library so…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/gif-tools/image-to-gif" },
  openGraph: {
    title: "Image to GIF — Turn a Batch Online Free",
    description: "Image to GIF turns a batch of photos already sitting on your device into one animated GIF file, processed entirely client-side with the gifenc library so…",
    url: "https://www.onlineconvertools.com/tools/gif-tools/image-to-gif",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
